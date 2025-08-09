'use client';

import { useAuthContext } from '@/components/providers/auth-provider';
import { ChatInterface } from '@/components/chat/chat-interface';

export default function ChatPage() {
  const { isLoading } = useAuthContext();

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-background">
      {/* Background Gradient */}
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-background" />
      
      {/* Chat Interface takes full height */}
      <div className="relative h-full">
        <ChatInterface />
      </div>
    </div>
  );
}
