# Get Material Web

A simple materials sharing app where students can upload and browse semester-related PDFs.

Built with:
- Next.js 15 (App Router) + TypeScript
- Tailwind CSS + Radix UI (shadcn/ui components)
- Supabase (Auth, Database, Storage)

## Features
- Upload PDF materials with book name, subject, semester
- Browse and filter materials by search, subject, and semester
- View or download PDFs via a secure proxy
- Auth-aware download gating: new users must upload at least one document before downloading

## Project Structure
- `app/` – Next.js routes
  - `app/api/materials/route.ts` – list/create materials
  - `app/api/download/route.ts` – secure PDF streaming and download gating
  - `app/(app)/*` – application pages (`/materials`, `/upload`, etc.)
  - `app/(auth)/*` – auth pages (`/login`, `/signup`)
- `components/` – UI and feature components
  - `components/materials-browser.tsx` – listing UI with gating prompts
  - `components/upload-form.tsx` – upload form
- `lib/` – utilities and clients
  - `lib/supabase/clients.ts` – Supabase browser/server clients

## Prerequisites
- Node.js 18+
- A Supabase project with:
  - Auth enabled (Email or OAuth)
  - Database table `materials`
  - Storage bucket `materials`

### Database schema (materials)
Minimal shape used by the app:
- `id`: uuid (default gen_random_uuid())
- `book_name`: text
- `subject`: text
- `semester`: int
- `file_url`: text (either a storage key or a public URL)
- `uploader_email`: text
- `created_at`: timestamptz default now()

## Environment Variables
Set these in `.env.local` for local development.

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Notes:
- The repo currently includes fallback values in `lib/supabase/clients.ts`. For production, always use your own project values via env vars.

## Install & Run

```bash
# install deps
npm install

# start dev server
npm run dev

# open http://localhost:3000
```

## Usage Flow
1. Sign up or log in.
2. Upload a PDF at `/upload` with required fields.
3. Go to `/materials` to browse. After your first upload, View/Download buttons unlock.

Gating behavior:
- Server-side enforcement in `app/api/download/route.ts`:
  - 401 if not authenticated
  - 403 if authenticated but has zero uploads (must upload at least one document)
- Client-side UX in `components/materials-browser.tsx`:
  - Shows an upload prompt card
  - Disables buttons and shows a toast when blocked

## File Downloads
- All downloads go through `/api/download` to ensure correct headers and permissions.
- If the stored value is a storage key, it streams directly from Supabase Storage.
- If the stored value is a URL, the route proxies it (PDF-only, with safe content-type checks).

## Scripts
- `npm run dev` – start local dev
- `npm run build` – build for production
- `npm run start` – start production server

## Troubleshooting
- "Couldn't download – No file":
  - Ensure the record has a valid `file_url` (storage key or a working URL).
  - Check Network tab for `/api/download` response (401/403/404/400 messages).
  - Confirm you are logged in and have uploaded at least one document.
- "cookies is not a function":
  - The server client expects `cookies` from `next/headers` (passed as a function, not invoked). Ensure Next.js 14/15 App Router.
- CORS or content-type issues when proxying external URLs:
  - The route allows `application/pdf` and `application/octet-stream` and `.pdf` URLs.

## Security Notes
- Do not expose service role keys to the client.
- Use environment variables for Supabase credentials in production.
- The download API enforces authentication and upload-before-download policy.

## License
This project is provided as-is. Add a license of your choice if you plan to distribute.
