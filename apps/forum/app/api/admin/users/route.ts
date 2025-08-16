import { NextResponse } from "next/server"
import { ConvexHttpClient } from "convex/browser"
import { api } from "@convex/_generated/api"

export async function GET(request: Request) {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL
  if (!url) return NextResponse.json({ users: [] })
  const client = new ConvexHttpClient(url)
  // Forward Authorization so backend admin checks can succeed
  const authHeader = request.headers.get("Authorization") || undefined
  const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined
  if (bearer) client.setAuth(bearer)
  // With Convex Auth, this is guarded by requireAdmin on the backend.
  const users: any[] = await client.query(api.admin.listAllUsers as any, {})
  return NextResponse.json({ users })
}


