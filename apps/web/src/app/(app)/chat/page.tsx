'use client';

import { Bot, Home, LayoutDashboard } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AuthGuard } from '@/components/auth/auth-guard';
import { ChatInterface } from '@/components/chat/chat-interface';
import { useAuthContext } from '@/components/providers/auth-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function ChatPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuthContext();

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading chat...</p>
        </div>
      </div>
    );
  }

  // AuthGuard will handle the redirect if not authenticated
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        {/* Background Gradient */}
        <div className="pointer-events-none fixed inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-background" />

        <div className="relative">
          {/* Header Bar */}
          <div className="sticky top-0 z-10 border-border/50 border-b bg-background/80 backdrop-blur">
            <div className="container mx-auto max-w-7xl px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 p-2" />
                    <div>
                      <h1 className="bg-gradient-to-r from-primary to-accent bg-clip-text font-bold text-transparent text-xl">
                        AI Chat
                      </h1>
                      <p className="text-muted-foreground text-xs">
                        Powered by ISIS Intelligence
                      </p>
                    </div>
                  </div>
                  <Badge
                    className="hidden items-center gap-1 sm:flex"
                    variant="outline"
                  >
                    <Bot className="h-3 w-3" />
                    Multi-Model AI
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    className="button-press"
                    onClick={() => router.push('/')}
                    size="sm"
                    variant="ghost"
                  >
                    <Home className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Home</span>
                  </Button>
                  <Button
                    className="button-press"
                    onClick={() => router.push('/dashboard')}
                    size="sm"
                    variant="ghost"
                  >
                    <LayoutDashboard className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Interface */}
          <div className="h-[calc(100vh-73px)]">
            <ChatInterface />
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
