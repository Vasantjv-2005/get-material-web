export default function AdminPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-semibold">Admin</h1>
      <p className="text-muted-foreground">
        Admin tools will appear here (validate uploads, delete/update, manage access). This is a placeholder; will be
        wired to Supabase roles and policies.
      </p>
    </div>
  )
}
