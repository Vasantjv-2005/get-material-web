"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { UploadForm } from "@/components/upload-form"

type Material = {
  id: string
  bookName: string
  subject: string
  semester: number
  filename?: string
  createdAt: string
  uploader?: string
}

export default function UploadPage() {
  const [bookName, setBookName] = useState("")
  const [subject, setSubject] = useState("")
  const [semester, setSemester] = useState<number | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  function saveToLocal(m: Material) {
    const key = "materials"
    const existing = (typeof window !== "undefined" && window.localStorage.getItem(key)) || "[]"
    let list: Material[] = []
    try {
      list = existing ? JSON.parse(existing) : []
    } catch (err) {
      console.log("[v0] materials parse error in saveToLocal:", err)
      list = []
    }
    list.unshift(m)
    window.localStorage.setItem(key, JSON.stringify(list))
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!bookName || !subject || !semester) {
      toast({ title: "Missing fields", description: "Please fill all fields." })
      return
    }
    const m: Material = {
      id: crypto.randomUUID(),
      bookName,
      subject,
      semester,
      filename: file?.name,
      createdAt: new Date().toISOString(),
      uploader: "You",
    }
    saveToLocal(m)
    toast({ title: "Upload complete", description: "Mock upload saved locally." })
    router.push("/materials")
  }

  useEffect(() => {
    // Prefill example subject names if needed later
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Upload Material</h1>

      <UploadForm />
    </div>
  )
}
