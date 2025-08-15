import { type NextRequest, NextResponse } from "next/server"
import { ConvexHttpClient } from "convex/browser"
import { api } from "@convex/_generated/api"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const postId = Number.parseInt(params.id)

    const url = process.env.NEXT_PUBLIC_CONVEX_URL
    if (!url) return NextResponse.json({ error: "Convex URL not configured" }, { status: 500 })
    const client = new ConvexHttpClient(url)
    const updated: any = await client.mutation(api.posts.like as any, { postId: postId as any } as any)
    return NextResponse.json({ id: updated._id, likes: updated.likes ?? 0 })
  } catch (error) {
    console.error("Error liking post:", error)
    return NextResponse.json({ error: "Failed to like post" }, { status: 500 })
  }
}
