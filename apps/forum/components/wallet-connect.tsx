"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"

declare global {
  interface Window {
    solana?: any
    backpack?: any
  }
}

export function WalletConnect() {
  const [wallet, setWallet] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    ;(async () => {
      const res = await fetch("/api/auth/user")
      const data = await res.json()
      setWallet(data.user?.wallet || null)
    })()
  }, [])

  const connect = async () => {
    try {
      setLoading(true)
      const provider = window.solana?.isPhantom ? window.solana : window.backpack?.solana
      if (!provider) {
        toast({ title: "Wallet not found", description: "Install Phantom or Backpack" })
        return
      }
      const { publicKey } = await provider.connect()
      const walletStr = publicKey.toString()
      const nonceRes = await fetch("/api/auth/nonce")
      const { nonce } = await nonceRes.json()
      const domain = window.location.host
      const msg = `${domain} wants you to sign in with your Solana account:
${walletStr}

URI: ${window.location.origin}
Version: 1
Nonce: ${nonce}
Issued At: ${new Date().toISOString()}`
      const encoded = new TextEncoder().encode(msg)
      const signed = await provider.signMessage(encoded, "utf8")
      const signature = signed.signature ? Buffer.from(signed.signature).toString("base64") : Buffer.from(signed).toString("base64")
      // Server expects bs58; some wallets return bytes; try base58 via buffer -> Uint8Array handled server-side
      const verifyRes = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: walletStr, signature, message: msg }),
      })
      if (!verifyRes.ok) throw new Error("Verification failed")
      setWallet(walletStr)
      toast({ title: "Signed in", description: walletStr })
    } catch (e: any) {
      toast({ title: "Sign-in failed", description: e.message })
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    setLoading(true)
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      setWallet(null)
      toast({ title: "Signed out" })
    } finally {
      setLoading(false)
    }
  }

  if (wallet) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground hidden sm:block">{wallet.slice(0, 4)}…{wallet.slice(-4)}</span>
        <Button variant="outline" size="sm" onClick={logout} disabled={loading} className="rounded-xl">
          Logout
        </Button>
      </div>
    )
  }

  return (
    <Button onClick={connect} disabled={loading} className="rounded-xl">
      {loading ? "Connecting…" : "Connect Wallet"}
    </Button>
  )
}


