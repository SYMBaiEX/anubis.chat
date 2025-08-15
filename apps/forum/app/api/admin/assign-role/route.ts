import { NextResponse } from "next/server"
import { ConvexHttpClient } from "convex/browser"

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

    // Authn via session cookie
    const cookie = (request as any)?.cookies?.get?.("session")?.value
    const token = cookie || (request.headers.get("x-session-token") || undefined)
    const session: any = token ? await client.query("auth:session", { token }) : null
    const actor = session?.user

    if (!isAdminWallet(actor?.wallet)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { ids, role } = await request.json()
    if (!Array.isArray(ids) || !role) return NextResponse.json({ error: "Invalid body" }, { status: 400 })

    await client.mutation("admin:assignRole", { ids, role })
    await client.mutation("audit:log", { action: "assign_role", actorId: actor._id, details: { ids, role } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("assign-role error", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}


