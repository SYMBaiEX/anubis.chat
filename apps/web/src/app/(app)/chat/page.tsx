'use client';

import { Suspense } from 'react';
import { ChatInterface } from '@/components/chat/chat-interface';
import { ChatSkeleton } from '@/components/chat/chat-skeleton';
import { useAuthContext } from '@/components/providers/auth-provider';

export default function ChatPage() {
  const { isLoading } = useAuthContext();

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-b from-primary/5 dark:from-primary/10">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-hidden bg-gradient-to-b from-primary/5 dark:from-primary/10">
      {/* Chat Interface with Suspense boundary for better streaming */}
      <div className="relative h-full w-full overflow-hidden">
        <Suspense fallback={<ChatSkeleton />}>
          <ChatInterface />
        </Suspense>
      </div>
    </div>
  );
}
