"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, Search, User, X } from "lucide-react"
import { ThemeToggle } from "./theme-toggle"
import { WalletConnect } from "./wallet-connect"

export function ForumHeader() {
  const [showMobileSearch, setShowMobileSearch] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [connecting, setConnecting] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch("/api/auth/user", { cache: "no-store" })
        const data = await res.json()
        setUser(data.user || null)
      } catch {
        setUser(null)
      }
    })()
  }, [])

  // WalletConnect handles connect/verify/logout internally

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowMobileSearch(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  return (
    <header className="sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mt-4 rounded-2xl border border-border/60 bg-card/40 backdrop-blur supports-[backdrop-filter]:bg-card/30">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary/80 to-primary">
                  <span className="text-primary-foreground font-bold text-lg font-serif">𓃣</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold font-serif tracking-tight">
                    <span className="bg-gradient-to-r from-primary via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                      anubis.chat
                    </span>
                  </h1>
                  <p className="text-xs text-muted-foreground">Community Forum</p>
                </div>
              </div>
              <Badge variant="secondary" className="hidden sm:inline-flex bg-primary/15 text-primary border-primary/25">
                🤖 Powered by GPT-5, Gemini 2.5 Pro, o4-mini & Free Models ✨
              </Badge>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative hidden md:block">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search forum..."
                  className="pl-10 pr-4 py-2 w-64 rounded-xl border border-border/60 bg-background/70 focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <Button variant="ghost" size="icon" className="rounded-xl md:hidden" onClick={() => setShowMobileSearch(true)}>
                <Search className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-xl">
                <Bell className="w-5 h-5" />
              </Button>
              <WalletConnect />
              <ThemeToggle />
              <Button variant="ghost" size="icon" className="rounded-xl">
                <User className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      {showMobileSearch && (
        <div className="fixed inset-0 z-[60] bg-background/80 backdrop-blur">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mt-4 rounded-2xl border border-border/60 bg-card p-3">
              <div className="flex items-center gap-2">
                <Search className="text-muted-foreground w-5 h-5" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search forum..."
                  className="flex-1 bg-transparent focus:outline-none"
                />
                <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => setShowMobileSearch(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
