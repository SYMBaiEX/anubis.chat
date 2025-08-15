import { NextResponse } from "next/server"
import { ConvexHttpClient } from "convex/browser"
import { api } from "@convex/_generated/api"

export async function GET(request: Request) {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL
  if (!url) return NextResponse.json({ users: [] })
  const client = new ConvexHttpClient(url)
  // With Convex Auth, this is guarded by requireAdmin on the backend.
  const users: any[] = await client.query(api.admin.listAllUsers as any, {})
  return NextResponse.json({ users })
}


