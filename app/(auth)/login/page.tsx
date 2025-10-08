"use client"

import type React from "react"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
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
          <CardTitle className="text-center">Sign in to Get Material</CardTitle>
        </CardHeader>
        <CardContent>
          <LoginForm />
          <p className="text-sm text-muted-foreground text-center mt-4">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-primary underline-offset-4 hover:underline">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
