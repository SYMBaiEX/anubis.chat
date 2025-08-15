import { NextResponse } from "next/server"
import { ConvexHttpClient } from "convex/browser"

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

    // With Convex Auth, rely on server-side admin checks in backend or Authorization header.
    // For now, gate via env-configured wallets only.
    const actorWallet = request.headers.get('x-user-wallet')
    if (!isAdminWallet(actorWallet)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const flags: any[] = await client.query("flags:listOpen", {})
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

    const actorWallet = request.headers.get('x-user-wallet')

    const { id, status } = await request.json()
    if (!isAdminWallet(actorWallet)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    await client.mutation("flags:resolve", { id, status })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("flags update error", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}


