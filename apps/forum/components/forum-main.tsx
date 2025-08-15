"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Pin,
  MessageCircle,
  Eye,
  ThumbsUp,
  Clock,
  TrendingUp,
  Flame,
  Star,
  Users,
  Plus,
  RefreshCw,
  AlertCircle,
  Search,
  Filter,
  Reply,
  Share,
  Bookmark,
  MoreHorizontal,
} from "lucide-react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@convex/_generated/api"

interface ForumMainProps {
  activeSection: {
    category: string
    section: string
  }
  posts: any[]
  loading: boolean
  error: string | null
  onCreatePost: (post: any) => void
  onLikePost: (postId: string) => void
  onRefresh: () => void
}

export function ForumMain({
  activeSection,
  posts,
  loading,
  error,
  onCreatePost,
  onLikePost,
  onRefresh,
}: ForumMainProps) {
  const [newPost, setNewPost] = useState({
    title: "",
    content: "",
    tags: "",
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("recent")
  const [selectedPost, setSelectedPost] = useState<any>(null)
  const [showReplies, setShowReplies] = useState<{ [key: string]: boolean }>({})
  const [newReply, setNewReply] = useState("")
  const [isReplying, setIsReplying] = useState<string | null>(null)

  const repliesFor = (postId: string) => useQuery(api.replies.list, postId ? { postId: postId as any } : ("skip" as any))
  const createReply = useMutation(api.replies.create)

  const handleCreatePost = async () => {
    if (newPost.title && newPost.content) {
      setIsCreating(true)

      try {
        await onCreatePost({
          ...newPost,
          tags: newPost.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
        })

        setNewPost({ title: "", content: "", tags: "" })
        setIsDialogOpen(false)
      } catch (err) {
        console.error("Error creating post:", err)
      } finally {
        setIsCreating(false)
      }
    }
  }

  const handleReply = async (postId: string) => {
    if (!newReply.trim()) return
    try {
      await createReply({ postId: postId as any, content: newReply })
      setNewReply("")
      setIsReplying(null)
      onRefresh()
    } catch (error) {
      console.error("Error posting reply:", error)
    }
  }

  const toggleReplies = (postId: string) => {
    setShowReplies((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }))
  }

  const filteredPosts = useMemo(() => posts.filter(
    (post) =>
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags?.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase())),
  ), [posts, searchQuery])

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    switch (sortBy) {
      case "popular":
        return (b.likes || 0) - (a.likes || 0)
      case "replies":
        return (b.replies || 0) - (a.replies || 0)
      case "views":
        return (b.views || 0) - (a.views || 0)
      default:
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    }
  })

  return (
    <main className="flex-1 p-6 space-y-6">
      {/* Header Section */}
      <Card className="temple-card anubis-glow p-6 rounded-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold font-serif mb-2 tracking-tight">
              <span className="bg-gradient-to-r from-primary via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                {activeSection.section}
              </span>
            </h2>
            <p className="text-muted-foreground">
              {activeSection.category} - {posts.length} posts in this section
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading} className="rounded-xl">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </Button>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center space-x-2 rounded-xl">
                  <Plus className="w-4 h-4" />
                  <span>New Post</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Post in {activeSection.section}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Post title..."
                    value={newPost.title}
                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  />
                  <Textarea
                    placeholder="Write your post content..."
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    rows={6}
                  />
                  <Input
                    placeholder="Tags (comma separated)..."
                    value={newPost.tags}
                    onChange={(e) => setNewPost({ ...newPost, tags: e.target.value })}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isCreating} className="rounded-xl">
                      Cancel
                    </Button>
                    <Button onClick={handleCreatePost} disabled={isCreating} className="rounded-xl">
                      {isCreating ? "Creating..." : "Create Post"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <div className="text-6xl opacity-20 font-serif">𓃣</div>
          </div>
        </div>
      </Card>

      {/* Search and Filter Section */}
      <Card className="temple-card p-4 rounded-2xl">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-xl"
            />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40 rounded-xl">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Recent</SelectItem>
              <SelectItem value="popular">Most Liked</SelectItem>
              <SelectItem value="replies">Most Replies</SelectItem>
              <SelectItem value="views">Most Viewed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-4 temple-card rounded-2xl">
              <div className="flex items-start gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {error && (
        <Card className="p-8 temple-card text-center border-destructive/50 rounded-2xl">
          <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-4" />
          <h4 className="text-lg font-semibold mb-2 text-destructive">Error Loading Posts</h4>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => { toast.info("Retrying…"); onRefresh() }} variant="outline" className="rounded-xl">
            Try Again
          </Button>
        </Card>
      )}

      {/* Posts Section */}
      {!loading && !error && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold font-serif">
              {sortedPosts.length > 0 ? `${sortedPosts.length} Posts` : "No posts yet"}
            </h3>
            {searchQuery && <Badge variant="secondary">Showing results for "{searchQuery}"</Badge>}
          </div>

          {sortedPosts.length === 0 ? (
            <Card className="p-8 temple-card text-center rounded-2xl animate-in fade-in-50 slide-in-from-bottom-2">
              <img src="/people-supporting-each-other.png" alt="Community" className="w-40 h-40 object-contain mx-auto mb-4 opacity-80" />
              <h4 className="text-lg font-semibold mb-2">
                {searchQuery ? "No posts found" : "No posts in this section yet"}
              </h4>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? "Try adjusting your search terms" : "Be the first to start a discussion!"}
              </p>
              {!searchQuery && <Button onClick={() => setIsDialogOpen(true)} className="rounded-xl">Create First Post</Button>}
            </Card>
          ) : (
            <div className="space-y-4">
              {sortedPosts.map((post, idx) => {
                const replies = showReplies[post.id] ? repliesFor(post.id) : null
                return (
                  <Card
                    key={post.id}
                    className="temple-card rounded-2xl transition-all duration-300 hover:bg-accent/20 hover:translate-y-[-2px] hover:shadow-lg animate-in fade-in-50 slide-in-from-bottom-2"
                    style={{ animationDelay: `${Math.min(idx, 6) * 40}ms` }}
                  >
                    <div className="p-4">
                      <div className="flex items-start space-x-4">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={post.avatar || "/placeholder.svg"} />
                          <AvatarFallback>{post.author?.[0] || "U"}</AvatarFallback>
                        </Avatar>

                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center space-x-2">
                                {post.pinned && <Pin className="w-4 h-4 text-primary" />}
                                {post.trending && <TrendingUp className="w-4 h-4 text-orange-500" />}
                                {post.hot && <Flame className="w-4 h-4 text-red-500" />}
                                <h4 className="font-medium hover:text-primary transition-colors cursor-pointer">
                                  {post.title}
                                </h4>
                              </div>
                              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                <span>by {post.author || "Anonymous"}</span>
                                <span>•</span>
                                <span>{post.category}</span>
                                <span>•</span>
                                <Clock className="w-3 h-3" />
                                <span>{post.time || post.created_at}</span>
                              </div>
                              {post.content && (
                                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{post.content}</p>
                              )}
                            </div>

                            <Button variant="ghost" size="sm" className="rounded-xl">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <button
                                className="flex items-center space-x-1 hover:text-primary transition-colors"
                                onClick={() => toggleReplies(post.id)}
                              >
                                <MessageCircle className="w-4 h-4" />
                                <span>{replies?.length || 0}</span>
                              </button>
                              <div className="flex items-center space-x-1">
                                <Eye className="w-4 h-4" />
                                <span>{post.views || 0}</span>
                              </div>
                              <button
                                className="flex items-center space-x-1 hover:text-primary transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onLikePost(post.id)
                                }}
                              >
                                <ThumbsUp className="w-4 h-4" />
                                <span>{post.likes || 0}</span>
                              </button>
                            </div>

                            <div className="flex items-center space-x-2">
                              <Button variant="ghost" size="sm" className="rounded-xl">
                                <Reply className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="rounded-xl">
                                <Share className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="rounded-xl">
                                <Bookmark className="w-4 h-4" />
                              </Button>
                              {post.tags?.map((tag: string, tagIndex: number) => (
                                <Badge key={tagIndex} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {/* Replies Section */}
                          {showReplies[post.id] && (
                            <div className="mt-4 space-y-3 border-t pt-4">
                              <div className="flex items-center justify-between">
                                <h5 className="font-medium text-sm">Replies ({replies?.length || 0})</h5>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setIsReplying(isReplying === post.id ? null : post.id)}
                                >
                                  <Reply className="w-3 h-3 mr-1" />
                                  Reply
                                </Button>
                              </div>

                              {/* Reply Form */}
                              {isReplying === post.id && (
                                <div className="space-y-2">
                                  <Textarea
                                    placeholder="Write your reply..."
                                    value={newReply}
                                    onChange={(e) => setNewReply(e.target.value)}
                                    rows={3}
                                  />
                                  <div className="flex justify-end space-x-2">
                                    <Button variant="outline" size="sm" onClick={() => setIsReplying(null)} className="rounded-xl">
                                      Cancel
                                    </Button>
                                    <Button size="sm" onClick={() => handleReply(post.id)} disabled={!newReply.trim()} className="rounded-xl">
                                      Post Reply
                                    </Button>
                                  </div>
                                </div>
                              )}

                              <div className="space-y-2 text-sm">
                                {(replies || []).length === 0 ? (
                                  <p className="text-muted-foreground">No replies yet. Be the first to reply!</p>
                                ) : (
                                  (replies || []).map((r: any) => (
                                    <div key={r._id} className="p-3 rounded-xl bg-muted/40">
                                      <div className="text-xs text-muted-foreground mb-1">{new Date(r.createdAt).toLocaleString()}</div>
                                      <div>{r.content}</div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <Card className="p-6 temple-card rounded-2xl animate-in fade-in-50 slide-in-from-bottom-2">
        <h3 className="text-lg font-semibold font-serif mb-4">Quick Actions</h3>
        <div className="grid grid-cols-3 gap-4">
          <Button className="h-16 flex-col space-y-2 rounded-xl" onClick={() => setIsDialogOpen(true)}>
            <MessageCircle className="w-6 h-6" />
            <span>New Post</span>
          </Button>
          <Button variant="outline" className="h-16 flex-col space-y-2 bg-transparent rounded-xl">
            <Star className="w-6 h-6" />
            <span>Feature Request</span>
          </Button>
          <Button variant="outline" className="h-16 flex-col space-y-2 bg-transparent rounded-xl">
            <Users className="w-6 h-6" />
            <span>Join Event</span>
          </Button>
        </div>
      </Card>
    </main>
  )
}
