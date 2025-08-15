import { type NextRequest, NextResponse } from "next/server"
import { ConvexHttpClient } from "convex/browser"
import { api } from "@convex/_generated/api"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const url = process.env.NEXT_PUBLIC_CONVEX_URL
    if (!url) return NextResponse.json({ error: "Convex URL not configured" }, { status: 500 })
    const client = new ConvexHttpClient(url)
    const post: any = await client.query(api.posts.get as any, { id: id as any } as any)
    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 })
    const ident = request.headers.get("x-forwarded-for") || request.headers.get("cf-connecting-ip") || request.ip || "anon"
    // Debounced view increment
    client.mutation(api.posts.incrementView as any, { id: id as any, ident } as any).catch(() => {})
    return NextResponse.json({
      post: {
        id: post._id,
        title: post.title,
        content: post.content,
        tags: post.tags ?? [],
        category: post.category,
        section: post.section,
        author: "Anonymous",
        avatar: "/placeholder-user.jpg",
        created_at: new Date(post.createdAt).toISOString(),
        views: post.views ?? 0,
        likes: post.likes ?? 0,
      },
    })
  } catch (error) {
    console.error("Error fetching post:", error)
    return NextResponse.json({ error: "Failed to fetch post" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const postId = params.id
    const body = await request.json()
    const { title, content, tags } = body

    // TODO: Add authentication check here
    // const user = await getCurrentUser(request)
    // const post = await db.posts.findUnique({ where: { id: parseInt(postId) } })
    // if (!user || post.authorId !== user.id) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    // TODO: Replace with your actual database update
    // Example: const updatedPost = await db.posts.update({ where: { id: parseInt(postId) }, data: { title, content, tags } })

    const updatedPost = {
      id: Number.parseInt(postId),
      title,
      content,
      tags,
      updated_at: new Date().toISOString(),
    }

    return NextResponse.json({ post: updatedPost })
  } catch (error) {
    console.error("Error updating post:", error)
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const postId = params.id

    // TODO: Add authentication check here
    // const user = await getCurrentUser(request)
    // const post = await db.posts.findUnique({ where: { id: parseInt(postId) } })
    // if (!user || (post.authorId !== user.id && user.role !== 'admin')) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    // TODO: Replace with your actual database delete
    // Example: await db.posts.delete({ where: { id: parseInt(postId) } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting post:", error)
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 })
  }
}
