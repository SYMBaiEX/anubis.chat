"use client"

import { ConvexProvider, ConvexReactClient } from "convex/react"
import type { ReactNode } from "react"

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL

if (!convexUrl && process.env.NODE_ENV !== "production") {
  // eslint-disable-next-line no-console
  console.warn("NEXT_PUBLIC_CONVEX_URL is not set. Convex client will not be initialized.")
}

const convex = convexUrl ? new ConvexReactClient(convexUrl) : undefined

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  if (!convex) return <>{children}</>
  return <ConvexProvider client={convex}>{children}</ConvexProvider>
}


