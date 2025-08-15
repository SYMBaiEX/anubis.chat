import { type NextRequest, NextResponse } from "next/server"
import { ConvexHttpClient } from "convex/browser"
import { api } from "@convex/_generated/api"

export async function GET(request: NextRequest) {
  try {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL
    if (!url) return NextResponse.json({ user: null })
    const client = new ConvexHttpClient(url)
    // With Convex Auth, the client can fetch user directly; keep this as a shim returning null.
    return NextResponse.json({ user: null }, { headers: { "Cache-Control": "private, max-age=60" } })
  } catch (error) {
    console.error("Error getting user:", error)
    return NextResponse.json({ error: "Failed to get user" }, { status: 500 })
  }
}
