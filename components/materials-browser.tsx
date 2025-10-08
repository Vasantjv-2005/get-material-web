"use client"

import useSWR from "swr"
import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function MaterialsBrowser() {
  const [q, setQ] = React.useState("")
  const [semester, setSemester] = React.useState<string>("all")
  const [subject, setSubject] = React.useState("")

  const params = new URLSearchParams()
  if (q) params.set("q", q)
  if (semester !== "all") params.set("semester", semester)
  if (subject) params.set("subject", subject)

  const { data, isLoading } = useSWR(`/api/materials?${params.toString()}`, fetcher)

  return (
    <div className="grid gap-6">
      <div className="grid gap-3 md:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="search">Search</Label>
          <Input id="search" placeholder="Search by book or subject" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label>Semester</Label>
          <Select value={semester} onValueChange={setSemester}>
            <SelectTrigger>
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {Array.from({ length: 8 }).map((_, i) => (
                <SelectItem key={i + 1} value={`${i + 1}`}>{`Semester ${i + 1}`}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="subject">Subject</Label>
          <Input
            id="subject"
            placeholder="Optional subject filter"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Loading materials...</div>
      ) : !data?.items?.length ? (
        <div className="text-muted-foreground">No materials found.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((m: any) => {
            const isUrl = typeof m.file_url === "string" && /^https?:\/\//.test(m.file_url)

            // If original value is a URL, always use URL proxy endpoint.
            // Otherwise treat as a storage key and use path endpoint.
            const viewHref = isUrl
              ? `/api/download?url=${encodeURIComponent(m.file_url)}&disposition=inline`
              : typeof m.file_url === "string"
                ? `/api/download?path=${encodeURIComponent(m.file_url)}&disposition=inline`
                : "#"

            const downloadHref = isUrl
              ? `/api/download?url=${encodeURIComponent(m.file_url)}`
              : typeof m.file_url === "string"
                ? `/api/download?path=${encodeURIComponent(m.file_url)}`
                : "#"

            const suggestedName = `${m.book_name || "material"}.pdf`.replace(/[^\w.-]+/g, "-")

            return (
              <Card key={m.id} className="transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle className="text-pretty">{m.book_name}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{m.subject}</Badge>
                    <Badge>Sem {m.semester}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Uploaded by {m.uploader_email}</p>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button asChild size="sm" variant="default">
                    <a href={viewHref} target="_blank" rel="noreferrer">
                      View
                    </a>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <a href={downloadHref} download={suggestedName}>
                      Download
                    </a>
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
