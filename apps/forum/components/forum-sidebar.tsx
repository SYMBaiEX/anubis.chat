"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Megaphone,
  Map,
  Coins,
  Users,
  BookOpen,
  HelpCircle,
  Lightbulb,
  Bug,
  Palette,
  MessageCircle,
  ImageIcon,
  Scroll,
  Gift,
  Calendar,
  Handshake,
  Code,
  Github,
  Shield,
  Zap,
} from "lucide-react"
import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"

const forumSections = [
  {
    title: "Official Communications",
    icon: Megaphone,
    sections: [
      { name: "Announcements / News", icon: Megaphone, pinned: true },
      { name: "Roadmap & Changelog", icon: Map },
      { name: "Token & Governance", icon: Coins, badge: "New" },
    ],
  },
  {
    title: "User Onboarding & Support",
    icon: Users,
    sections: [
      { name: "Welcome & Introductions", icon: Users },
      { name: "How-To Guides", icon: BookOpen },
      { name: "Support & Troubleshooting", icon: HelpCircle },
    ],
  },
  {
    title: "Product & Feedback",
    icon: Lightbulb,
    sections: [
      { name: "Feature Requests", icon: Lightbulb },
      { name: "Bug Reports", icon: Bug },
      { name: "UX / Design Feedback", icon: Palette },
    ],
  },
  {
    title: "Community & Culture",
    icon: MessageCircle,
    sections: [
      { name: "General Chat (The Oasis)", icon: MessageCircle },
      { name: "Memes & Fan Art (Temple of Memes)", icon: ImageIcon },
      { name: "Prompt Library (Book of the Dead)", icon: Scroll },
      { name: "Referral & Rewards", icon: Gift },
      { name: "Events & Contests", icon: Calendar },
      { name: "Partnerships & Cross-Community Raids", icon: Handshake },
    ],
  },
  {
    title: "Developer & Contributor Zone",
    icon: Code,
    sections: [
      { name: "Dev Updates & Technical Discussions", icon: Code },
      { name: "Open Source / GitHub Issues", icon: Github },
      { name: "API & Integration", icon: Zap },
      { name: "Security Best Practices", icon: Shield },
    ],
  },
]

interface ForumSidebarProps {
  activeSection: {
    category: string
    section: string
  }
  onSectionChange: (category: string, section: string) => void
}

export function ForumSidebar({ activeSection, onSectionChange }: ForumSidebarProps) {
  const [sectionCounts, setSectionCounts] = useState<Record<string, number>>({})

  const counts = useQuery(api.sections.counts, {})
  useEffect(() => {
    if (counts) setSectionCounts(counts as Record<string, number>)
  }, [counts])

  return (
    <aside className="w-80 border-r border-border/60 bg-card/30 backdrop-blur supports-[backdrop-filter]:bg-card/20 h-[calc(100vh-73px)] md:sticky md:top-[73px] md:self-start">
      <ScrollArea className="h-full">
        <div className="p-4 space-y-6">
          {forumSections.map((category, categoryIndex) => (
            <div key={categoryIndex} className="space-y-2">
              <div className="flex items-center space-x-2 mb-3">
                <category.icon className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-sm text-foreground font-serif">{category.title}</h3>
              </div>
              <div className="space-y-1">
                {category.sections.map((section, sectionIndex) => {
                  const isActive = activeSection.category === category.title && activeSection.section === section.name
                  const count = sectionCounts[section.name] || 0

                  return (
                    <div
                      key={sectionIndex}
                      className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all hover:bg-accent/30 ${isActive ? "bg-primary/10 border border-primary/30 shadow-[0_0_0_1px_inset_var(--color-primary)]" : "border border-transparent"
                        }`}
                      onClick={() => onSectionChange(category.title, section.name)}
                    >
                      <div className="flex items-center space-x-3">
                        <section.icon className={`w-4 h-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                        <span className={`text-sm ${isActive ? "text-primary font-medium" : "text-foreground"}`}>
                          {section.name}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {section.badge && (
                          <Badge variant="secondary" className="text-xs bg-primary/20 text-primary">
                            {section.badge}
                          </Badge>
                        )}
                        {section.pinned && <div className="w-2 h-2 bg-primary rounded-full"></div>}
                        <span className="text-xs text-muted-foreground bg-muted/60 px-2 py-1 rounded">{count}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
              {categoryIndex < forumSections.length - 1 && <div className="hieroglyph-border mt-4"></div>}
            </div>
          ))}
        </div>
      </ScrollArea>
    </aside>
  )
}
