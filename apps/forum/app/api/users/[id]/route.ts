import { type NextRequest, NextResponse } from "next/server"
import { ConvexHttpClient } from "convex/browser"
import { api } from "@convex/_generated/api"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = params.id

    const url = process.env.NEXT_PUBLIC_CONVEX_URL
    if (!url) return NextResponse.json({ error: "Convex URL not configured" }, { status: 500 })
    const client = new ConvexHttpClient(url)
    const user = await client.query(api.users.get as any, { id: userId as any } as any)
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
    return NextResponse.json({ user })
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = params.id
    const body = await request.json()
    const { username, bio, avatar } = body

    // TODO: Add authentication check here
    // const currentUser = await getCurrentUser(request)
    // if (!currentUser || currentUser.id !== userId) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const url = process.env.NEXT_PUBLIC_CONVEX_URL
    if (!url) return NextResponse.json({ error: "Convex URL not configured" }, { status: 500 })
    const client = new ConvexHttpClient(url)
    // With unified backend, profile updates should use shared users.updateProfile via Convex client in-app.
    const updated = await client.mutation(api.users.updateProfile as any, { displayName: username, avatar } as any)
    return NextResponse.json({ user: updated })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}
