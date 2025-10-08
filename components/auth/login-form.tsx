"use client"

import * as React from "react"
import { getSupabaseBrowser } from "@/lib/supabase/clients"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export function LoginForm() {
  const supabase = getSupabaseBrowser()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(false)
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      toast({ title: "Welcome back!", description: "Signed in successfully." })
      router.push("/dashboard")
    } catch (err: any) {
      toast({ title: "Sign in failed", description: err?.message ?? "Unknown error", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 max-w-sm">
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <Button type="submit" className="rounded-lg" disabled={loading}>
        {loading ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  )
}
