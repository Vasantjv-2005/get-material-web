import type { NextRequest } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/clients"
import { cookies } from "next/headers"

function supabasePathFromUrl(u: string): string | null {
  // handles patterns like: .../object/public/materials/<path> or .../object/sign/materials/<path>
  try {
    const url = new URL(u)
    const parts = url.pathname.split("/").filter(Boolean)
    const idx = parts.findIndex((p) => p === "materials")
    if (idx >= 0 && parts.length > idx + 1) {
      // everything after "materials" is the object key
      return parts.slice(idx + 1).join("/")
    }
    return null
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const disposition =
    (searchParams.get("disposition") || "attachment").toLowerCase() === "inline" ? "inline" : "attachment"

  const sb = getSupabaseServer(cookies)

  // Require authenticated user
  const { data: auth } = await sb.auth.getUser()
  const email = auth.user?.email
  if (!email) {
    return new Response("Authentication required", { status: 401 })
  }

  // Enforce: user must have uploaded at least one document
  const { count: userUploadCount, error: countError } = await sb
    .from("materials")
    .select("id", { count: "exact", head: true })
    .eq("uploader_email", email)

  if (countError) {
    return new Response("Unable to verify permissions", { status: 400 })
  }
  if (!userUploadCount || userUploadCount < 1) {
    return new Response("Please upload at least one semester-related document to unlock downloads.", { status: 403 })
  }

  // Prefer storage path (most reliable). If only a URL is provided, try to derive path if it's a Supabase URL.
  let path = searchParams.get("path")
  const urlParam = searchParams.get("url")

  if (!path && urlParam) {
    const derived = supabasePathFromUrl(urlParam)
    if (derived) path = derived
  }

  // If we have a storage path, stream bytes directly from Supabase Storage
  if (path) {
    const { data, error } = await sb.storage.from("materials").download(path)
    if (error || !data) {
      return new Response("File not found", { status: 404 })
    }

    const baseName = path.split("/").pop() || "material"
    const filename = baseName.toLowerCase().endsWith(".pdf") ? baseName : `${baseName}.pdf`

    const headers = new Headers()
    headers.set("Content-Disposition", `${disposition}; filename="${filename}"`)
    headers.set("Content-Type", "application/pdf")
    headers.set("Cache-Control", "no-cache, no-store, must-revalidate")
    headers.set("Pragma", "no-cache")
    headers.set("Expires", "0")
    headers.set("X-Content-Type-Options", "nosniff")

    // data is a Blob; Response accepts Blob directly
    return new Response(data, { status: 200, headers })
  }

  // Fallback: proxy a direct URL only if it is a real PDF (blocks HTML pages)
  if (urlParam && /^https?:\/\//.test(urlParam)) {
    const upstream = await fetch(urlParam, {
      cache: "no-store",
      redirect: "follow",
      headers: { Accept: "application/pdf" },
    })
    if (!upstream.ok || !upstream.body) {
      return new Response("File not found", { status: 404 })
    }
    const ct = (upstream.headers.get("content-type") || "").toLowerCase()
    const looksPdf = ct.includes("application/pdf") || ct.includes("application/octet-stream") || urlParam.toLowerCase().endsWith(".pdf")
    if (!looksPdf) {
      // Don't serve HTML or anything else masquerading as a PDF
      return new Response("Provided URL is not a PDF", { status: 400 })
    }

    const baseName = new URL(urlParam).pathname.split("/").pop() || "material"
    const filename = baseName.toLowerCase().endsWith(".pdf") ? baseName : `${baseName}.pdf`

    const headers = new Headers()
    headers.set("Content-Disposition", `${disposition}; filename="${filename}"`)
    headers.set("Content-Type", "application/pdf")
    headers.set("Cache-Control", "no-cache, no-store, must-revalidate")
    headers.set("Pragma", "no-cache")
    headers.set("Expires", "0")
    headers.set("X-Content-Type-Options", "nosniff")

    return new Response(upstream.body, { status: 200, headers })
  }

  return new Response("Missing file reference", { status: 400 })
}
