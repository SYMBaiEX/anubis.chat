import { type NextRequest, NextResponse } from "next/server"
import { ConvexHttpClient } from "convex/browser"
import { api } from "@convex/_generated/api"
import { z } from "zod"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get("category")
  const section = searchParams.get("section")
  const cursor = searchParams.get("cursor")

  try {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL
    if (!url) return NextResponse.json({ posts: [] })
    const client = new ConvexHttpClient(url)
    const numItems = 20
    const page: any = await client.query(api.posts.list as any, {
      category: category || "",
      section: section || "",
      paginationOpts: { numItems, cursor: cursor || undefined },
    })
    const posts = page.page.map((p: any) => ({
      id: p._id,
      title: p.title,
      content: p.content,
      tags: p.tags ?? [],
      category: p.category,
      section: p.section,
      author: "Anonymous",
      avatar: "/placeholder-user.jpg",
      time: new Date(p.createdAt).toISOString(),
      created_at: new Date(p.createdAt).toISOString(),
      replies: 0,
      views: p.views ?? 0,
      likes: p.likes ?? 0,
    }))

    return NextResponse.json({ posts, continueCursor: page.continueCursor ?? null }, {
      headers: {
        "Cache-Control": "private, max-age=0, must-revalidate",
      },
    })
  } catch (error) {
    console.error("Error fetching posts:", error)
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const Schema = z.object({
      title: z.string().min(1).max(140),
      content: z.string().min(1).max(20000),
      tags: z.array(z.string().min(1).max(32)).max(16).optional(),
      category: z.string().min(1).max(64),
      section: z.string().min(1).max(64),
    })
    const { title, content, tags, category, section } = Schema.parse(body)

    // TODO: Add authentication check here
    // const user = await getCurrentUser(request)
    // if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = process.env.NEXT_PUBLIC_CONVEX_URL
    if (!url) return NextResponse.json({ error: "Convex URL not configured" }, { status: 500 })
    const client = new ConvexHttpClient(url)
    // With Convex Auth, Authorization: Bearer <token> must be forwarded to Convex HTTP action if used.
    // Prefer calling Convex from client with useMutation; this API route remains for compatibility.
    const created: any = await client.mutation(api.posts.create as any, {
      title,
      content,
      tags,
      category,
      section,
    })
    const mapped = {
      id: created._id,
      title: created.title,
      content: created.content,
      tags: created.tags ?? [],
      category: created.category,
      section: created.section,
      author: "Anonymous",
      avatar: "/placeholder-user.jpg",
      time: new Date(created.createdAt).toISOString(),
      created_at: new Date(created.createdAt).toISOString(),
      replies: 0,
      views: created.views ?? 0,
      likes: created.likes ?? 0,
    }
    return NextResponse.json(mapped)
  } catch (error) {
    console.error("Error creating post:", error)
    const message = error instanceof Error ? error.message : "Failed to create post"
    const status = message.includes("Unauthorized") ? 401 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
