import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/clients"
import { cookies } from "next/headers"
import { sendUploadNotification } from "@/lib/email"

// Ensure this route is always dynamic and never statically cached
export const dynamic = "force-dynamic"
export const revalidate = 0
export const runtime = "nodejs"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const q = url.searchParams.get("q") || ""
  const semester = url.searchParams.get("semester")
  const subject = url.searchParams.get("subject") || ""

  const cookieStore: any = await (cookies() as any)
  const supabase = getSupabaseServer(() => cookieStore)
  let query = supabase.from("materials").select("*").order("created_at", { ascending: false })

  if (semester && semester !== "all") query = query.eq("semester", Number(semester))
  if (q) query = query.or(`book_name.ilike.%${q}%,subject.ilike.%${q}%`)
  if (subject) query = query.ilike("subject", `%${subject}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Filter out records pointing to missing storage objects to avoid showing deleted files in UI.
  // For storage paths, attempt to create a short-lived signed URL; if it errors, the object is missing.
  function supabasePathFromUrl(u: string): string | null {
    try {
      const parsed = new URL(u)
      const parts = parsed.pathname.split("/").filter(Boolean)
      const idx = parts.findIndex((p) => p === "materials")
      if (idx >= 0 && parts.length > idx + 1) return parts.slice(idx + 1).join("/")
      return null
    } catch {
      return null
    }
  }

  const items = Array.isArray(data) ? data : []
  // Limit concurrency to avoid overloading; simple batching of 10
  const batchSize = 10
  const filtered: any[] = []
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const checks = batch.map(async (m) => {
      const fileUrl = m?.file_url
      if (!fileUrl || typeof fileUrl !== "string") return null

      const isHttp = /^https?:\/\//.test(fileUrl)
      // Try to derive storage path either directly or from a Supabase storage URL
      const storagePath = isHttp ? supabasePathFromUrl(fileUrl) : fileUrl

      if (storagePath) {
        const { data: signed, error: signErr } = await supabase.storage.from("materials").createSignedUrl(storagePath, 60)
        // Be lenient: if signing fails, still keep the item so it shows up in UI
        if (signErr || !signed) return m
        return m
      }

      // If it's an external URL (non-supabase), keep it as-is
      if (isHttp) return m
      return null
    })

    const results = await Promise.all(checks)
    for (const r of results) if (r) filtered.push(r)
  }

  const res = NextResponse.json({ items: filtered })
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate")
  res.headers.set("Pragma", "no-cache")
  res.headers.set("Expires", "0")
  return res
}

export async function POST(request: Request) {
  const body = await request.json()
  const cookieStore: any = await (cookies() as any)
  const supabase = getSupabaseServer(() => cookieStore)

  const { data: auth } = await supabase.auth.getUser()
  const email = auth.user?.email ?? body.uploader_email ?? "anonymous@user"

  const { book_name, subject, semester, file_url } = body

  // Minimal validation: require file_url and book_name
  if (!file_url || typeof file_url !== "string") {
    return NextResponse.json({ error: "Missing file_url" }, { status: 400 })
  }
  if (!book_name || typeof book_name !== "string") {
    return NextResponse.json({ error: "Missing book_name" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("materials")
    .insert({
      book_name,
      subject,
      semester,
      file_url,
      uploader_email: email,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Best-effort email notification. Only for PDFs. Does not block response.
  try {
    const isPdf = typeof file_url === "string" && /\.pdf(\?.*)?$/i.test(file_url)
    if (isPdf) {
      await sendUploadNotification({
        book_name,
        subject: subject ?? null,
        semester: semester ?? null,
        file_url,
        uploader_email: email,
        created_at: data?.created_at,
      })
    }
  } catch (e) {
    // logged inside helper; ignore
  }
  return NextResponse.json({ item: data }, { status: 201 })
}
