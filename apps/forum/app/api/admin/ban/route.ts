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

    // Forward Authorization: Bearer <token>
    const authHeader = request.headers.get("Authorization") || undefined
    const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined
    if (bearer) client.setAuth(bearer)

    // Resolve current user via Convex
    const actor: any = await client.query(api.users.getCurrentUserProfile as any, {})
    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (!isAdminWallet(actor.walletAddress)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { ids } = await request.json()
    if (!Array.isArray(ids)) return NextResponse.json({ error: "Invalid body" }, { status: 400 })

    await client.mutation((api as any).adminAuth.banUsers as any, { ids } as any)

    // Route-level audit logging with IP and User-Agent context
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
    const userAgent = request.headers.get('user-agent') || undefined
    await client.mutation((api as any).audit.logAdminAction as any, {
      action: 'route.admin.banUsers',
      targets: ids as any,
      metadata: { route: '/api/admin/ban' } as any,
      ip,
      userAgent,
    } as any)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("ban error", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}


