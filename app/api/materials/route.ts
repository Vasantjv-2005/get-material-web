import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/clients"
import { cookies } from "next/headers"
import { Resend } from "resend"

// Ensure this route is always dynamic and never statically cached
export const dynamic = "force-dynamic"
export const revalidate = 0
export const runtime = "nodejs"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const q = url.searchParams.get("q") || ""
  const semester = url.searchParams.get("semester")
  const subject = url.searchParams.get("subject") || ""

  const supabase = getSupabaseServer(cookies)
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
        if (signErr || !signed) return null // missing in storage
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
  const supabase = getSupabaseServer(cookies)

  const { data: auth } = await supabase.auth.getUser()
  const email = auth.user?.email ?? body.uploader_email ?? "anonymous@user"

  const { book_name, subject, semester, file_url } = body
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

  // Fire-and-forget email notification using Resend. Do not block or fail the request.
  try {
    const apiKey = process.env.RESEND_API_KEY
    const to = process.env.EMAIL_TO
    const from = process.env.EMAIL_FROM || "onboarding@resend.dev"
    const isPdf = typeof file_url === "string" && /\.pdf(\?.*)?$/i.test(file_url)
    if (apiKey && to && from && isPdf) {
      const resend = new Resend(apiKey)
      const when = new Date().toISOString()
      const subjectLine = `Material upload: ${book_name ?? "(no title)"}`
      const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif;line-height:1.6">
      <h2>New material uploaded</h2>
      <p><strong>Uploader:</strong> ${email}</p>
      <p><strong>Book:</strong> ${book_name ?? ""}</p>
      <p><strong>Subject:</strong> ${subject ?? ""}</p>
      <p><strong>Semester:</strong> ${semester ?? ""}</p>
      <p><strong>When:</strong> ${when}</p>
      <p><strong>File:</strong> <a href="${file_url ?? ""}">${file_url ?? ""}</a></p>
    </div>
  `
      const text = [
        "NEW MATERIAL UPLOADED",
        "",
        `Uploader: ${email}`,
        "",
        `Book: ${book_name ?? ""}`,
        "",
        `Subject: ${subject ?? ""}`,
        "",
        `Semester: ${semester ?? ""}`,
        "",
        `When: ${when}`,
        "",
        `File: ${file_url ?? ""}`,
      ].join("\n")
      await resend.emails.send({ from, to, subject: subjectLine, html, text })
    } else {
      console.warn(
        "Email notification skipped: missing env vars or file is not a PDF."
      )
    }
  } catch (e) {
    console.error("Failed to send upload notification email:", e)
  }
  return NextResponse.json({ item: data }, { status: 201 })
}
