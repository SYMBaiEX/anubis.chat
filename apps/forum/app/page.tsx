"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { ForumHeader } from "@/components/forum-header"
import { ForumSidebar } from "@/components/forum-sidebar"
import { ForumMain } from "@/components/forum-main"
import { useMutation, useQuery } from "convex/react"
import { api } from "@convex/_generated/api"

export default function ForumPage() {
  const [activeSection, setActiveSection] = useState({
    category: "Community & Culture",
    section: "General Chat (The Oasis)",
  })

  const [posts, setPosts] = useState([] as any[])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cursor, setCursor] = useState<string | null>(null)
  const [canLoadMore, setCanLoadMore] = useState(false)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  const listArgs = useMemo(
    () => ({ category: activeSection.category, section: activeSection.section, paginationOpts: { numItems: 20, cursor: cursor ?? null } }),
    [activeSection, cursor]
  )
  const page = useQuery(api.posts.list, listArgs)
  useEffect(() => {
    if (!page) return
    const mapped = (page.page || []).map((p: any) => ({
      id: p._id,
      title: p.title,
      content: p.content,
      tags: p.tags,
      category: p.category,
      section: p.section,
      views: p.views ?? 0,
      likes: p.likes ?? 0,
      created_at: new Date(p.createdAt).toISOString(),
    }))
    setPosts((prev) => (cursor ? [...prev, ...mapped] : mapped))
    setCanLoadMore(Boolean(page.continueCursor))
  }, [page])

  useEffect(() => {
    setCursor(null)
    const key = `scroll:${activeSection.category}:${activeSection.section}`
    const y = sessionStorage.getItem(key)
    if (y) requestAnimationFrame(() => window.scrollTo(0, Number(y)))
    const onBeforeUnload = () => {
      sessionStorage.setItem(key, String(window.scrollY))
    }
    window.addEventListener("beforeunload", onBeforeUnload)
    return () => window.removeEventListener("beforeunload", onBeforeUnload)
  }, [activeSection])

  const handleSectionChange = (category: string, section: string) => {
    setActiveSection({ category, section })
  }

  const createPost = useMutation(api.posts.create)
  const likePost = useMutation(api.posts.like)

  const handleCreatePost = async (newPost: any) => {
    try {
      setLoading(true)
      await createPost({
        title: newPost.title,
        content: newPost.content,
        tags: newPost.tags?.split?.(",").map((t: string) => t.trim()).filter(Boolean) || [],
        category: activeSection.category,
        section: activeSection.section,
      })
      setCursor(null)
    } catch (err: any) {
      console.error("Error creating post:", err)
      setError(err?.message ?? 'Failed to create post')
    } finally {
      setLoading(false)
    }
  }

  const handleLikePost = async (postId: string) => {
    try {
      await likePost({ postId: postId as any })
      setCursor(null)
    } catch (err) {
      console.error("Error liking post:", err)
    }
  }

  useEffect(() => {
    if (!canLoadMore) return
    const el = loadMoreRef.current
    if (!el) return
    const io = new IntersectionObserver((entries) => {
      const [entry] = entries
      if (entry.isIntersecting && !loading && cursor) {
        setCursor(page?.continueCursor || null)
      }
    }, { rootMargin: "200px" })
    io.observe(el)
    return () => io.disconnect()
  }, [canLoadMore, cursor, loading, activeSection, page])

  return (
    <div className="min-h-screen bg-background">
      <ForumHeader />
      <div className="flex">
        <ForumSidebar activeSection={activeSection} onSectionChange={handleSectionChange} />
        <ForumMain
          activeSection={activeSection}
          posts={posts}
          loading={loading}
          error={error}
          onCreatePost={handleCreatePost}
          onLikePost={handleLikePost as any}
          onRefresh={() => setCursor(null)}
        />
      </div>
      {canLoadMore && (
        <div className="p-6 pt-0">
          <button
            className="w-full rounded-xl border border-border bg-card/50 hover:bg-card/70 py-2 text-sm"
            onClick={() => setCursor(page?.continueCursor || null)}
            disabled={loading}
          >
            {loading ? "Loading..." : "Load more"}
          </button>
        </div>
      )}
    </div>
  )
}
