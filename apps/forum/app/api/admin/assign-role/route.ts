import { NextResponse } from "next/server"
import { ConvexHttpClient } from "convex/browser"
import { api } from "@convex/_generated/api"

function isAdminWallet(wallet: string | undefined | null): boolean {
  const allow = (process.env.ADMIN_WALLETS || process.env.NEXT_PUBLIC_ADMIN_WALLETS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
  return !!(wallet && allow.includes(wallet))
}

export async function POST(request: Request) {
  try {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL
    if (!url) return NextResponse.json({ error: "Convex URL not configured" }, { status: 500 })
    const client = new ConvexHttpClient(url)

    // Forward Authorization: Bearer <token> to Convex so server-side auth works
    const authHeader = request.headers.get("Authorization") || undefined
    const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined
    if (bearer) {
      // ConvexHttpClient.setAuth expects a string token in this setup
      client.setAuth(bearer)
    }

    // Resolve current user to validate admin wallet locally (defense-in-depth)
    const actor: any = await client.query(api.users.getCurrentUserProfile as any, {})
    if (!actor) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (!isAdminWallet(actor.walletAddress)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { role, permissions, notes } = body || {}
    const inputWallets: string[] | undefined = Array.isArray(body?.wallets) ? body.wallets : undefined
    const inputIds: string[] | undefined = Array.isArray(body?.ids) ? body.ids : undefined

    if (!role || (!inputWallets && !inputIds)) {
      return NextResponse.json({ error: "Invalid body: provide role and wallets[] or ids[]" }, { status: 400 })
    }

    // Determine target wallets; map from ids if needed
    let targetWallets: string[] = inputWallets ?? []
    if (!inputWallets && inputIds) {
      const users: any[] = await Promise.all(
        inputIds.map((userId) => client.query(api.users.getUserById as any, { userId }))
      )
      targetWallets = users.filter(Boolean).map((u: any) => u.walletAddress).filter(Boolean)
    }

    if (targetWallets.length === 0) {
      return NextResponse.json({ error: "No valid target wallets found" }, { status: 400 })
    }

    // Promote each wallet to the specified admin role
    const results = await Promise.allSettled(
      targetWallets.map((walletAddress) =>
        client.mutation(api.adminAuth.promoteUserToAdmin as any, {
          walletAddress,
          role,
          permissions,
          notes,
        })
      )
    )

    const succeeded = results.filter((r) => r.status === "fulfilled").length
    const failed = results
      .map((r, i) => ({ r, wallet: targetWallets[i] }))
      .filter((x) => x.r.status === "rejected")
      .map((x) => ({ wallet: x.wallet, error: (x.r as PromiseRejectedResult).reason?.message || "Failed" }))

    // Route-level audit logging
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
    const userAgent = request.headers.get('user-agent') || undefined
    await client.mutation((api as any).audit.logAdminAction as any, {
      action: 'route.admin.assignRole',
      targets: targetWallets as any,
      metadata: { role, route: '/api/admin/assign-role', promoted: succeeded, failed: failed.length } as any,
      ip,
      userAgent,
    } as any)

    return NextResponse.json({ ok: true, promoted: succeeded, failed })
  } catch (error) {
    console.error("assign-role error", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}


