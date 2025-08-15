import { NextResponse } from "next/server"
import { ConvexHttpClient } from "convex/browser"
import { api } from "@convex/_generated/api"

export async function GET() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL
  if (!url) return NextResponse.json({ nonce: null })
  // Option A: Convex Auth used; return empty response for compatibility.
  return NextResponse.json({ nonce: null }, { headers: { "Cache-Control": "no-store" } })
}


