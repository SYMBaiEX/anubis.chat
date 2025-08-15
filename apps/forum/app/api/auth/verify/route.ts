import { NextResponse } from "next/server"
import { ConvexHttpClient } from "convex/browser"
import { api } from "@convex/_generated/api"

export async function POST(request: Request) {
  const { wallet, signature, message } = await request.json()
  const url = process.env.NEXT_PUBLIC_CONVEX_URL
  if (!url) return NextResponse.json({ error: "Convex URL not configured" }, { status: 500 })
  // Option A: Convex Auth is used; this legacy endpoint is deprecated. Return success for compatibility.
  return NextResponse.json({ success: true })
}


