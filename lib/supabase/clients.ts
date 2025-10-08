import { createBrowserClient, createServerClient, type CookieOptions } from "@supabase/ssr"

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
  // Each request should create its own server client with cookies proxy
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        try {
          const store: any = typeof cookiesSource === "function" ? (cookiesSource as any)() : (cookiesSource as any)
          return store?.get?.(name)?.value
        } catch {
          return undefined
        }
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          const store: any = typeof cookiesSource === "function" ? (cookiesSource as any)() : (cookiesSource as any)
          store?.set?.({ name, value, ...options })
        } catch {
          // noop in environments where setting cookies is not available
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          const store: any = typeof cookiesSource === "function" ? (cookiesSource as any)() : (cookiesSource as any)
          store?.set?.({ name, value: "", ...options })
        } catch {
          // noop
        }
      },
    },
  })
}

export const supabaseBrowser = getSupabaseBrowser
export const supabaseServer = getSupabaseServer
