import { NextResponse } from "next/server"
import { summarizeLargeText } from "@/lib/ai/gemini"
import { createRequire } from "module"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

async function extractPdfTextFromBuffer(buf: Uint8Array) {
  // Lazy import and call wrapped in try/catch for clearer errors
  let pdfParse: any
  try {
    const mod: any = await import("pdf-parse")
    pdfParse = mod?.default || mod
    if (typeof pdfParse !== "function") throw new Error("pdf-parse not a function")
  } catch (e) {
    // Fallback to CommonJS require for environments where dynamic import of CJS fails
    try {
      const req = createRequire(process.cwd() + "/")
      const mod2: any = req("pdf-parse")
      pdfParse = mod2?.default || mod2
      if (typeof pdfParse !== "function") throw new Error("pdf-parse loaded but is not callable")
    } catch (e2) {
      throw new Error(
        "Failed to load pdf-parse. Ensure it's installed and compatible with Node.js runtime."
      )
    }
  }

  try {
    const result = await pdfParse(buf)
    const text: string = result?.text || ""
    return text
  } catch (e: any) {
    // Common cryptic error surface from pdf.js: Object.defineProperty called on non-object
    const msg = e?.message || String(e)
    throw new Error(`PDF parsing failed: ${msg}`)
  }
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || ""

    let text = ""
    let prompt: string | undefined

    if (contentType.includes("multipart/form-data")) {
      const form = await (req as any).formData()
      const file = form.get("file") as File | null
      prompt = (form.get("prompt") as string) || undefined
      if (!file) {
        return NextResponse.json({ error: "Missing file" }, { status: 400 })
      }
      const fileType = (file as any)?.type || ""
      if (!/application\/pdf/i.test(fileType)) {
        return NextResponse.json({ error: "Uploaded file is not a PDF" }, { status: 400 })
      }
      const arrayBuf = await file.arrayBuffer()
      const buf = new Uint8Array(arrayBuf)
      text = await extractPdfTextFromBuffer(buf)
    } else {
      const body = await req.json().catch(() => ({}))
      const fileUrl: string | undefined = body.file_url || body.url
      prompt = body.prompt
      const inputText: string | undefined = body.text

      if (inputText && typeof inputText === "string") {
        text = inputText
      } else if (fileUrl && typeof fileUrl === "string") {
        const res = await fetch(fileUrl)
        if (!res.ok) return NextResponse.json({ error: `Failed to fetch file: ${res.status}` }, { status: 400 })
        const ct = res.headers.get("content-type") || ""
        if (!/application\/pdf/i.test(ct)) {
          return NextResponse.json({ error: `URL does not point to a PDF (content-type: ${ct || "unknown"})` }, { status: 400 })
        }
        const arrayBuf = await res.arrayBuffer()
        const buf = new Uint8Array(arrayBuf)
        text = await extractPdfTextFromBuffer(buf)
      } else {
        return NextResponse.json({ error: "Provide a PDF file (multipart) or { file_url } / { text } in JSON" }, { status: 400 })
      }
    }

    if (!text?.trim()) {
      return NextResponse.json({ error: "No text extracted from PDF" }, { status: 400 })
    }

    const summary = await summarizeLargeText(text, prompt)
    return NextResponse.json({ summary })
  } catch (e: any) {
    console.error("Summarize error:", e)
    const msg = e?.message || "Internal error"
    // Normalize common cryptic error to actionable advice
    if (/Object\.defineProperty called on non-object/i.test(msg)) {
      return NextResponse.json(
        {
          error:
            "PDF parsing failed (invalid PDF or incompatible parser). Ensure the file is a valid PDF and try again.",
          detail: msg,
        },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
