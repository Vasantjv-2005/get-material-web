"use client"

import type React from "react"
import { SignupForm } from "@/components/auth/signup-form"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    // Placeholder: navigate to dashboard
    router.push("/dashboard")
  }

  return (
    <main className="min-h-svh flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Create your account</CardTitle>
        </CardHeader>
        <CardContent>
          <SignupForm />
          <p className="text-sm text-muted-foreground text-center mt-4">
            Already have an account?{" "}
            <Link href="/login" className="text-primary underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
