"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { User, MessageCircle, ThumbsUp, Eye, Edit } from "lucide-react"

interface UserProfileProps {
  user?: {
    id: string
    username: string
    email: string
    avatar?: string
    bio?: string
    joinDate: string
    postCount: number
    likesReceived: number
    reputation: number
    role: string
  }
}

export function UserProfile({ user }: UserProfileProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState({
    username: user?.username || "",
    bio: user?.bio || "",
    avatar: user?.avatar || "",
  })

  if (!user) {
    return (
      <Card className="p-6 temple-card text-center">
        <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Not Signed In</h3>
        <p className="text-muted-foreground mb-4">Sign in to access your profile and participate in discussions</p>
        <Button>Sign In</Button>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 temple-card">
        <div className="flex items-start space-x-4">
          <Avatar className="w-20 h-20">
            <AvatarImage src={user.avatar || "/placeholder.svg"} />
            <AvatarFallback className="text-2xl">{user.username[0]}</AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold font-serif">{user.username}</h2>
                <Badge variant="secondary">{user.role}</Badge>
              </div>

              <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Username"
                      value={profile.username}
                      onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                    />
                    <Textarea
                      placeholder="Bio"
                      value={profile.bio}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      rows={4}
                    />
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                      <Button>Save Changes</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <p className="text-muted-foreground">{user.bio || "No bio provided"}</p>
            <p className="text-sm text-muted-foreground">Member since {user.joinDate}</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 temple-card text-center">
          <MessageCircle className="w-8 h-8 text-primary mx-auto mb-2" />
          <div className="text-2xl font-bold">{user.postCount}</div>
          <div className="text-sm text-muted-foreground">Posts</div>
        </Card>

        <Card className="p-4 temple-card text-center">
          <ThumbsUp className="w-8 h-8 text-primary mx-auto mb-2" />
          <div className="text-2xl font-bold">{user.likesReceived}</div>
          <div className="text-sm text-muted-foreground">Likes Received</div>
        </Card>

        <Card className="p-4 temple-card text-center">
          <Eye className="w-8 h-8 text-primary mx-auto mb-2" />
          <div className="text-2xl font-bold">{user.reputation}</div>
          <div className="text-sm text-muted-foreground">Reputation</div>
        </Card>
      </div>
    </div>
  )
}
