"use client"

import * as React from "react"
import { getSupabaseBrowser } from "@/lib/supabase/clients"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

export function SignupForm() {
  const supabase = getSupabaseBrowser()
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(false)
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const redirect =
        process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
        (typeof window !== "undefined" ? window.location.origin : "")
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirect },
      })
      if (error) throw error
      toast({ title: "Check your inbox", description: "Confirm your email to finish sign up." })
    } catch (err: any) {
      toast({ title: "Sign up failed", description: err?.message ?? "Unknown error", variant: "destructive" })
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
        {loading ? "Creating account..." : "Create account"}
      </Button>
    </form>
  )
}
