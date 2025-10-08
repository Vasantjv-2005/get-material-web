"use client"

import { useEffect, useState } from "react"
import { MaterialsBrowser } from "@/components/materials-browser"

type Material = {
  id: string
  bookName: string
  subject: string
  semester: number
  filename?: string
  createdAt: string
  uploader?: string
}

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([])

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem("materials") : "[]"
      const list: Material[] = raw ? JSON.parse(raw) : []
      setMaterials(list)
    } catch (err) {
      console.log("[v0] materials parse error in MaterialsPage:", err)
      setMaterials([])
    }
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Materials</h1>
      <MaterialsBrowser />
    </div>
  )
}
