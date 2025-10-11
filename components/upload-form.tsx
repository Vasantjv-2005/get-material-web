"use client"

import * as React from "react"
import { getSupabaseBrowser } from "@/lib/supabase/clients"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export function UploadForm() {
  const supabase = getSupabaseBrowser()
  const { toast } = useToast()
  const router = useRouter()
  const [bookName, setBookName] = React.useState("")
  const [subject, setSubject] = React.useState("")
  const [semester, setSemester] = React.useState<number | null>(null)
  const [file, setFile] = React.useState<File | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [inlineMsg, setInlineMsg] = React.useState("")

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    // Basic validations
    if (!file) {
      toast({ title: "Select a PDF", description: "Please choose a PDF file to upload.", variant: "destructive" })
      setInlineMsg("Please choose a PDF file to upload.")
      return
    }
    if (!bookName) {
      toast({ title: "Missing details", description: "Enter a book name.", variant: "destructive" })
      setInlineMsg("Enter a book name.")
      return
    }
    const typeOk = file.type === "application/pdf"
    const nameOk = file.name.toLowerCase().endsWith(".pdf")
    if (!typeOk || !nameOk) {
      toast({ title: "PDF required", description: "Upload a .pdf file only.", variant: "destructive" })
      setInlineMsg("Only .pdf files are allowed.")
      return
    }

    setLoading(true)
    try {
      // Auth check
      const { data: authData } = await supabase.auth.getUser()
      const user = authData.user
      if (!user?.email) {
        toast({ title: "Login required", description: "Please log in before uploading.", variant: "destructive" })
        setInlineMsg("Please log in to upload PDFs.")
        return
      }

      // Upload to Storage
      const fileNameSafe = file.name.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9.\-_]/g, "")
      const key = `${user.id ?? "anon"}/${Date.now()}-${fileNameSafe}`
      const { error: uploadError } = await supabase.storage.from("materials").upload(key, file, {
        contentType: "application/pdf",
        upsert: false,
      })
      if (uploadError) throw uploadError

      // Get public URL (fallback to key if not public)
      const { data: publicUrlData } = supabase.storage.from("materials").getPublicUrl(key)
      const publicUrl = publicUrlData?.publicUrl || key

      // Insert row via API
      const resp = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          book_name: bookName,
          subject: subject || "",
          semester: semester || null,
          file_url: publicUrl,
        }),
      })
      if (!resp.ok) {
        const j = await resp.json().catch(() => ({}))
        throw new Error(j?.error || `Upload failed with status ${resp.status}`)
      }

      toast({ title: "Uploaded!", description: "Your PDF is now available." })
      setInlineMsg("")
      // Reset and go to materials
      setBookName("")
      setSubject("")
      setSemester(null)
      setFile(null)
      router.push("/materials")
    } catch (err: any) {
      console.log("[v0] Upload error:", err?.message)
      toast({ title: "Upload failed", description: err?.message ?? "Unknown error", variant: "destructive" })
      setInlineMsg(err?.message || "Upload failed.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle className="text-balance">Upload Material (PDF)</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="book">Book name</Label>
            <Input id="book" value={bookName} onChange={(e) => setBookName(e.target.value)} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Semester</Label>
            <Select value={semester?.toString() ?? ""} onValueChange={(v) => setSemester(Number.parseInt(v, 10))}>
              <SelectTrigger>
                <SelectValue placeholder="Select semester (optional)" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 8 }).map((_, i) => (
                  <SelectItem key={i + 1} value={`${i + 1}`}>{`Semester ${i + 1}`}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="file">PDF file</Label>
            <Input
              id="file"
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <Button type="submit" className="rounded-lg" disabled={loading}>
            {loading ? "Uploading..." : "Upload"}
          </Button>
          {inlineMsg && <p className="text-sm text-red-600 mt-1">{inlineMsg}</p>}
        </form>
      </CardContent>
    </Card>
  )
}
