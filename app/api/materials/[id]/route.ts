import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { getSupabaseServer } from "@/lib/supabase/clients"

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

export async function DELETE(_req: NextRequest, ctx: { params: { id: string } }) {
  const id = ctx.params?.id
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const sb = getSupabaseServer(cookies)
  // Require authenticated user
  const { data: auth } = await sb.auth.getUser()
  const email = auth.user?.email
  if (!email) return NextResponse.json({ error: "Authentication required" }, { status: 401 })

  // Coerce to number if it looks numeric; otherwise keep string (e.g., uuid)
  const idFilter: any = /^\d+$/.test(id) ? Number(id) : id

  // Fetch the material row
  const { data: material, error: fetchErr } = await sb.from("materials").select("*").eq("id", idFilter).single()
  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 400 })
  if (!material) return NextResponse.json({ error: "Material not found" }, { status: 404 })

  // Authorization: only uploader can delete (adjust as needed)
  if (material.uploader_email && material.uploader_email !== email) {
    return NextResponse.json({ error: "Not authorized to delete this item" }, { status: 403 })
  }

  // Delete file from storage if present (ignore errors if already missing)
  const fileUrl = typeof material.file_url === "string" ? (material.file_url as string) : null
  let storagePath: string | null = null
  if (fileUrl) {
    storagePath = /^https?:\/\//.test(fileUrl) ? supabasePathFromUrl(fileUrl) : fileUrl
  }
  if (storagePath) {
    await sb.storage.from("materials").remove([storagePath])
  }

  // Delete DB row
  const { error: delErr } = await sb.from("materials").delete().eq("id", idFilter)
  if (delErr) {
    return NextResponse.json({ error: delErr.message || "Delete failed due to database policy" }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
