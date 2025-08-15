"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const accepted = localStorage.getItem("cookie-consent")
      if (!accepted) setVisible(true)
    } catch {
      // ignore
    }
  }, [])

  if (!visible) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4">
      <div className="mx-auto max-w-3xl">
        <Card className="rounded-2xl p-4 border-border/60 bg-card/90 backdrop-blur">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              We use cookies for session and analytics as described in our privacy policy.
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => {
                  try { localStorage.setItem("cookie-consent", "dismissed") } catch {}
                  setVisible(false)
                }}
              >
                Dismiss
              </Button>
              <Button
                className="rounded-xl"
                onClick={() => {
                  try { localStorage.setItem("cookie-consent", "accepted") } catch {}
                  setVisible(false)
                }}
              >
                Accept
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}


