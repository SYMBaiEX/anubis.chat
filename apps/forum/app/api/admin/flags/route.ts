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

export async function GET(request: Request) {
  try {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL
    if (!url) return NextResponse.json({ flags: [] })
    const client = new ConvexHttpClient(url)

    // Forward Authorization: Bearer <token> so backend auth (if any) can apply
    const authHeader = request.headers.get("Authorization") || undefined
    const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined
    if (bearer) client.setAuth(bearer)

    // With Convex Auth, rely on server-side admin checks in backend or Authorization header.
    // For now, gate via env-configured wallets only.
    const actorWallet = request.headers.get('x-user-wallet')
    if (!isAdminWallet(actorWallet)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const flags: any[] = await client.query(api.flags.listOpen as any, {})
    return NextResponse.json({ flags })
  } catch (error) {
    console.error("flags list error", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL
    if (!url) return NextResponse.json({ error: "Convex URL not configured" }, { status: 500 })
    const client = new ConvexHttpClient(url)

    // Forward Authorization token for backend auth
    const authHeader = request.headers.get("Authorization") || undefined
    const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined
    if (bearer) client.setAuth(bearer)

    const actorWallet = request.headers.get('x-user-wallet')

    const { id, status } = await request.json()
    if (!isAdminWallet(actorWallet)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    await client.mutation(api.flags.resolve as any, { id, status } as any)

    // Route-level audit logging
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
    const userAgent = request.headers.get('user-agent') || undefined
    await client.mutation((api as any).audit.logAdminAction as any, {
      action: 'route.admin.flags.resolve',
      targets: [id] as any,
      metadata: { route: '/api/admin/flags', status } as any,
      ip,
      userAgent,
    } as any)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("flags update error", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}


