"use client"

import React, { useState } from "react"

export default function ChatSummarizerPage() {
  const [file, setFile] = useState<File | null>(null)
  const [url, setUrl] = useState("")
  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSummary(null)
    try {
      let res: Response
      if (file) {
        const fd = new FormData()
        fd.append("file", file)
        if (prompt) fd.append("prompt", prompt)
        res = await fetch("/api/chat/summarize", { method: "POST", body: fd })
      } else if (url.trim()) {
        res = await fetch("/api/chat/summarize", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ file_url: url.trim(), prompt }),
        })
      } else {
        setError("Please upload a PDF or provide a PDF URL.")
        setLoading(false)
        return
      }

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || `Request failed: ${res.status}`)
      setSummary(data.summary)
    } catch (err: any) {
      setError(err?.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">PDF Summarizer (Gemini)</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium">Upload PDF</label>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <div className="text-xs text-gray-500">Or provide a URL to a PDF</div>
          <input
            type="url"
            placeholder="https://.../file.pdf"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Optional prompt</label>
          <textarea
            placeholder="e.g., Focus on key definitions and examples"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full border rounded px-3 py-2 h-28"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
        >
          {loading ? "Summarizing..." : "Summarize"}
        </button>
      </form>

      {error && (
        <div className="p-3 rounded bg-red-50 text-red-700 border border-red-200">{error}</div>
      )}

      {summary && (
        <div className="p-4 rounded border bg-white whitespace-pre-wrap leading-relaxed">
          {summary}
        </div>
      )}
    </div>
  )
}
