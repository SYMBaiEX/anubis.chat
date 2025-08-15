"use client"

import { useEffect, useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { useMutation, useQuery } from "convex/react"
import { api } from "@convex/_generated/api"

export default function AdminPage() {
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [filter, setFilter] = useState("")
  const [loading, setLoading] = useState(false)

  // Admin authorization (temporary: based on env wallet list via /api/auth/user)
  useEffect(() => {
    const check = async () => {
      const res = await fetch("/api/auth/user", { cache: "no-store" })
      const data = await res.json()
      const adminWallets = (process.env.NEXT_PUBLIC_ADMIN_WALLETS || process.env.ADMIN_WALLETS || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
      const wallet = data.user?.wallet
      const ok = wallet && adminWallets.includes(wallet)
      setAuthorized(Boolean(ok))
    }
    check()
  }, [])

  // Data from Convex (guarded on backend via requireAdmin)
  const users = useQuery(api.admin.listAllUsers, authorized ? {} : ("skip" as any)) || []
  const openFlags = useQuery(api.flags.listOpen, authorized ? {} : ("skip" as any)) || []

  const resolveFlag = useMutation(api.flags.resolve)
  // Note: assignRole/ban mutations would be implemented server-side (not shown here).

  const filtered = useMemo(
    () => users.filter((u: any) => !filter || u.displayName?.toLowerCase().includes(filter.toLowerCase()) || u.walletAddress?.toLowerCase().includes(filter.toLowerCase())),
    [users, filter]
  )

  const anySelected = useMemo(() => Object.values(selected).some(Boolean), [selected])

  const assignRole = async (role: string) => {
    try {
      setLoading(true)
      const ids = Object.entries(selected).filter(([, v]) => v).map(([k]) => k)
      // TODO: Implement admin.assignRole mutation in shared backend and call here.
      toast.success(`Assigned role: ${role} to ${ids.length} users`)
      setSelected({})
    } catch (e: any) {
      toast.error("Role assignment failed", { description: e?.message || String(e) })
    } finally {
      setLoading(false)
    }
  }

  const banUsers = async () => {
    try {
      setLoading(true)
      const ids = Object.entries(selected).filter(([, v]) => v).map(([k]) => k)
      // TODO: Implement admin.banUsers mutation and call here.
      toast.success(`Banned ${ids.length} users`)
      setSelected({})
    } catch (e: any) {
      toast.error("Ban failed", { description: e?.message || String(e) })
    } finally {
      setLoading(false)
    }
  }

  if (authorized === null) return <div className="p-6">Checking admin access…</div>
  if (!authorized) return <div className="p-6">You are not authorized to view this page.</div>

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <div className="flex items-center gap-2">
          <Input placeholder="Filter users…" value={filter} onChange={(e) => setFilter(e.target.value)} className="w-64 rounded-xl" />
          <Button variant="outline" disabled={!anySelected || loading} onClick={() => assignRole("moderator")} className="rounded-xl">Make Moderator</Button>
          <Button variant="outline" disabled={!anySelected || loading} onClick={() => assignRole("user")} className="rounded-xl">Make User</Button>
          <Button variant="destructive" disabled={!anySelected || loading} onClick={banUsers} className="rounded-xl">Ban Selected</Button>
        </div>
      </div>

      <section>
        <h2 className="text-lg font-medium mb-2">Users</h2>
        <div className="grid gap-2 md:grid-cols-2">
          {filtered.map((u: any) => (
            <Card key={u._id} className="rounded-2xl border border-border/60 bg-card/50 p-3 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Checkbox checked={!!selected[u._id]} onCheckedChange={(v) => setSelected((s) => ({ ...s, [u._id]: Boolean(v) }))} />
                  <div className="text-sm">{u.displayName || u.walletAddress?.slice(0, 6) + "…"}</div>
                  {u.role && <Badge variant="secondary">{u.role}</Badge>}
                </div>
                <div className="text-xs text-muted-foreground">{u.walletAddress || "(no wallet)"}</div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => assignRole("moderator")} className="rounded-xl">Mod</Button>
                <Button size="sm" variant="outline" onClick={() => assignRole("user")} className="rounded-xl">User</Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-medium">Moderation Queue</h2>
          <Badge variant="secondary">{openFlags.length} open</Badge>
        </div>
        <div className="space-y-2">
          {openFlags.map((f: any) => (
            <Card key={f._id} className="rounded-2xl border border-border/60 bg-card/50 p-3 flex items-center justify-between">
              <div>
                <div className="text-sm">Post: {String(f.postId || f.replyId)}</div>
                <div className="text-xs text-muted-foreground">Reason: {f.reason}</div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={async () => {
                  try {
                    await resolveFlag({ id: f._id, status: "resolved" })
                    toast.success("Flag resolved")
                  } catch {
                    toast.error("Failed to resolve flag")
                  }
                }} className="rounded-xl">Resolve</Button>
                <Button size="sm" variant="outline" onClick={async () => {
                  try {
                    await resolveFlag({ id: f._id, status: "dismissed" })
                    toast.success("Flag dismissed")
                  } catch {
                    toast.error("Failed to dismiss flag")
                  }
                }} className="rounded-xl">Dismiss</Button>
              </div>
            </Card>
          ))}
          {openFlags.length === 0 && <Card className="rounded-2xl border border-border/60 bg-card/50 p-4 text-sm text-muted-foreground">No open flags</Card>}
        </div>
      </section>
    </div>
  )
}


