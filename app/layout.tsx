import type React from "react"
import type { Metadata } from "next"
import { Nunito } from "next/font/google"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "Get Material",
  description: "Academic resource-sharing hub for all 8 semesters",
  generator: "v0.app",
}

const nunito = Nunito({ subsets: ["latin"], variable: "--font-geist-sans" })

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`font-sans ${nunito.variable} ${GeistMono.variable} antialiased selection:bg-zinc-100 selection:text-zinc-900`}
      >
        <Suspense>
          {children}
          <Analytics />
          <Toaster />
        </Suspense>
      </body>
    </html>
  )
}
