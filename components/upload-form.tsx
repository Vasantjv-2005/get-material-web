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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) {
      toast({ title: "Select a PDF", description: "Please choose a PDF file to upload.", variant: "destructive" })
      return
    }
    if (!bookName || !subject || !semester) {
      toast({ title: "Missing details", description: "Fill in book, subject and semester.", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      const { data: user } = await supabase.auth.getUser()
      const email = user.user?.email ?? "anonymous@user"

      const ext = file.name.split(".").pop()?.toLowerCase() || "pdf"
      const fileNameSafe = file.name.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9.\-_]/g, "")
      const key = `${user.user?.id ?? "anon"}/${Date.now()}-${fileNameSafe}`

      const { error: uploadError } = await supabase.storage.from("materials").upload(key, file, {
        contentType: "application/pdf",
        upsert: false,
      })
      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage.from("materials").getPublicUrl(key)
      const publicUrl = publicUrlData?.publicUrl

      // Insert metadata
      const { error: insertError } = await supabase.from("materials").insert({
        book_name: bookName,
        subject,
        semester,
        file_url: publicUrl ?? key,
        uploader_email: email,
      })
      if (insertError) throw insertError

      toast({ title: "Uploaded!", description: "Your PDF is now available." })
      router.push("/materials")

      // Reset
      setBookName("")
      setSubject("")
      setSemester(null)
      setFile(null)
    } catch (err: any) {
      console.log("[v0] Upload error:", err?.message)
      toast({ title: "Upload failed", description: err?.message ?? "Unknown error", variant: "destructive" })
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
            <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} required />
          </div>
          <div className="grid gap-2">
            <Label>Semester</Label>
            <Select value={semester?.toString() ?? ""} onValueChange={(v) => setSemester(Number.parseInt(v, 10))}>
              <SelectTrigger>
                <SelectValue placeholder="Select semester" />
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
        </form>
      </CardContent>
    </Card>
  )
}
