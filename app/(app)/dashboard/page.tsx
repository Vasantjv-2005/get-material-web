"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Search, UploadCloud, Files } from "lucide-react"

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Dashboard</h1>
        <Button asChild className="rounded-full">
          <Link href="/upload">
            <UploadCloud className="mr-2 size-4" />
            Upload Material
          </Link>
        </Button>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="transition-shadow hover:shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="size-4 text-primary" />
              Quick Search
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            Use the Materials section to search by book name or subject with filters for semester.
          </CardContent>
        </Card>

        <Card className="transition-shadow hover:shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UploadCloud className="size-4 text-primary" />
              Instant Upload
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            Upload PDFs and see them appear immediately. (Currently mocked — will connect to Supabase.)
          </CardContent>
        </Card>

        <Card className="transition-shadow hover:shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Files className="size-4 text-primary" />
              Organized Library
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            Browse by semester and subject in a clean, card-based grid.
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
