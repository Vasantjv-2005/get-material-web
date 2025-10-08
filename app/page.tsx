"use client"

import Link from "next/link"
import { BookOpenText, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function LandingPage() {
  return (
    <main className="min-h-svh flex flex-col items-center justify-center text-center px-6">
      <div className="max-w-5xl w-full space-y-8">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mx-auto">
          <BookOpenText className="size-4" />
          <span>Get Material</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-semibold tracking-tight text-balance">
          Your centralized, beautiful hub for semester materials
        </h1>

        <p className="text-muted-foreground leading-relaxed text-pretty max-w-2xl mx-auto">
          Upload, discover, and download PDFs, notes, and books — neatly organized by semester and subject. A delightful
          experience for students and faculty to share and learn together.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Button asChild className="rounded-full">
            <Link href="/login">
              Get Started
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full bg-transparent">
            <Link href="/materials">Browse Materials</Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mt-6">
          <div className="border rounded-xl p-5 text-left transition-shadow hover:shadow-sm">
            <div className="text-primary font-medium mb-1">Instant Uploads</div>
            <div className="text-muted-foreground text-sm">
              Post materials and see them live right away. Clean and fast.
            </div>
          </div>
          <div className="border rounded-xl p-5 text-left transition-shadow hover:shadow-sm">
            <div className="text-primary font-medium mb-1">Smart Filters</div>
            <div className="text-muted-foreground text-sm">Find anything by semester and subject with ease.</div>
          </div>
          <div className="border rounded-xl p-5 text-left transition-shadow hover:shadow-sm">
            <div className="text-primary font-medium mb-1">Elegant UI</div>
            <div className="text-muted-foreground text-sm">A modern, minimal look that feels great to use daily.</div>
          </div>
        </div>
      </div>
    </main>
  )
}
