import { createBrowserClient, createServerClient, type CookieOptions } from "@supabase/ssr"
import type { cookies as CookiesFn } from "next/headers"

let browserClient: ReturnType<typeof createBrowserClient> | null = null

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "https://rnzegoteiohnbchyuzlk.supabase.co"
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJuemVnb3RlaW9obmJjaHl1emxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4NDE4NjYsImV4cCI6MjA3NTQxNzg2Nn0.TJKWnleeNDG5tEh2EnjhAzvFRgX5YcyBWHDrx2OrZso"

export function getSupabaseBrowser() {
  if (!browserClient) {
    browserClient = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookieOptions: {
        // Keep defaults; tokens stored via supabase-js
      } as CookieOptions,
    })
  }
  return browserClient
}

export function getSupabaseServer(cookiesSource: any) {
  // Build a cookies adapter compatible with current @supabase/ssr expectations.
  // Supports both get/set/remove and getAll/setAll.
  const getStore = () => (typeof cookiesSource === "function" ? (cookiesSource as unknown as typeof CookiesFn)() : cookiesSource)
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      // Implement CookieMethodsServer: getAll/setAll only
      getAll() {
        try {
          const store: any = getStore()
          const all = store?.getAll?.() || []
          return all.map((c: any) => ({ name: c.name, value: c.value }))
        } catch {
          return []
        }
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          const store: any = getStore()
          for (const c of cookiesToSet) store?.set?.(c)
        } catch {
          // noop
        }
      },
    },
  })
}

export const supabaseBrowser = getSupabaseBrowser
export const supabaseServer = getSupabaseServer
