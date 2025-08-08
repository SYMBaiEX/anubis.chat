'use client';

import { useEffect } from 'react';
import { useAuthContext } from '@/components/providers/auth-provider';
import { AuthGuard } from '@/components/auth/auth-guard';
import { useRouter } from 'next/navigation';
import { ChatInterface } from '@/components/chat/chat-interface';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Home, Bot } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ChatPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuthContext();

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
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
        <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-background pointer-events-none" />
        
        <div className="relative">
          {/* Header Bar */}
          <div className="border-b border-border/50 bg-background/80 backdrop-blur sticky top-0 z-10">
            <div className="container max-w-7xl mx-auto px-4 py-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20">
                    </div>
                    <div>
                      <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        AI Chat
                      </h1>
                      <p className="text-xs text-muted-foreground">Powered by ISIS Intelligence</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="hidden sm:flex items-center gap-1">
                    <Bot className="h-3 w-3" />
                    Multi-Model AI
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => router.push('/')}
                    className="button-press"
                  >
                    <Home className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Home</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => router.push('/dashboard')}
                    className="button-press"
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