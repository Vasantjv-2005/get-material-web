const RESEND_API_KEY = process.env.RESEND_API_KEY || ""
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev"
const RESEND_TO_EMAIL = process.env.RESEND_TO_EMAIL || "vasantjv2005@gmail.com"

// Safe singleton (lazy)
let resend: any | null = null
async function getResend(): Promise<any | null> {
  if (!RESEND_API_KEY) return null
  if (resend) return resend
  try {
    const mod: any = await import("resend")
    const Resend = mod?.Resend
    if (!Resend) return null
    resend = new Resend(RESEND_API_KEY)
    return resend
  } catch (e) {
    // Package not installed or failed to load; skip silently
    return null
  }
}

export type UploadNotificationPayload = {
  book_name: string
  subject?: string | null
  semester?: number | null
  file_url: string
  uploader_email: string
  created_at?: string
}

export async function sendUploadNotification(payload: UploadNotificationPayload) {
  const client = await getResend()
  if (!client) {
    // No API key configured; skip silently
    return { skipped: true }
  }

  const { book_name, subject, semester, file_url, uploader_email, created_at } = payload
  const ts = created_at || new Date().toISOString()

  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif;line-height:1.6">
      <h2>New material uploaded</h2>
      <p><strong>Uploader:</strong> ${uploader_email}</p>
      <p><strong>Book:</strong> ${book_name}</p>
      <p><strong>Subject:</strong> ${subject || "-"}</p>
      <p><strong>Semester:</strong> ${semester ?? "-"}</p>
      <p><strong>When:</strong> ${ts}</p>
      <p><strong>File:</strong> <a href="${file_url}">${file_url}</a></p>
    </div>
  `

  try {
    const { data, error } = await client.emails.send({
      from: RESEND_FROM_EMAIL,
      to: [RESEND_TO_EMAIL],
      subject: `Material upload: ${book_name}`,
      html,
    })
    if (error) throw error
    return { id: data?.id }
  } catch (err) {
    // Do not crash API if email fails
    console.error("[email] sendUploadNotification error:", (err as any)?.message || err)
    return { error: (err as any)?.message || String(err) }
  }
}
