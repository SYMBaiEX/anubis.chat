import { NextResponse } from "next/server"
import { ConvexHttpClient } from "convex/browser"

export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL
  if (!url) return NextResponse.json({ error: "Convex URL not configured" }, { status: 500 })
  // Option A: Convex Auth sign-out handled on client; this endpoint is a no-op for compatibility.
  return NextResponse.json({ ok: true })
}


