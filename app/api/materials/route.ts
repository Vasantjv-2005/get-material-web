import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/clients"
import { cookies } from "next/headers"

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
  return NextResponse.json({ items: data ?? [] })
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
  return NextResponse.json({ item: data }, { status: 201 })
}
