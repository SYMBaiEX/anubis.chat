'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { MessageSquare } from 'lucide-react';
import { useAuthContext } from '@/components/providers/auth-provider';
import { useEnhancedChat } from '@/hooks/use-enhanced-chat';
import { MessageList } from './message-list';
import { MessageInput } from './message-input';
import { ChatHeader } from './chat-header';
import { EmptyState } from '@/components/data/empty-states';
import { cn } from '@/lib/utils';
import type { FontSize } from '@/lib/utils/font-sizes';

interface SimplifiedChatInterfaceProps {
  className?: string;
}

/**
 * Simplified Chat Interface using AI SDK's useChat properly
 * Reduces complexity while maintaining all features
 */
export function SimplifiedChatInterface({ className }: SimplifiedChatInterfaceProps) {
  const { user, isAuthenticated } = useAuthContext();
  const searchParams = useSearchParams();
  const chatId = searchParams.get('chatId');
  const [fontSize, setFontSize] = useState<FontSize>('medium');
  
  // Use the enhanced chat hook with AI SDK
  const {
    messages,
    input,
    setInput,
    sendMessage,
    regenerate,
    stop,
    isStreaming,
    isLoading,
    isReady,
    error,
  } = useEnhancedChat({
    chatId: chatId || undefined,
    walletAddress: user?.walletAddress,
    onError: (err) => {
      console.error('Chat error:', err);
      // Handle error (show toast, etc.)
    },
  });

  // Handle message send with proper async handling
  const handleSendMessage = async (
    content: string,
    useReasoning?: boolean,
    attachments?: any[]
  ) => {
    if (!isReady || !content.trim()) return;
    
    try {
      await sendMessage(
        content,
        'gpt-4', // or selected model
        useReasoning,
        attachments
      );
    } catch (err) {
      // Error is already logged in the hook
    }
  };

  // Handle regenerate
  const handleRegenerate = (messageId: string) => {
    regenerate();
  };

  if (!isAuthenticated) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          icon={<MessageSquare className="h-12 w-12" />}
          title="Authentication Required"
          description="Please sign in to use the chat"
        />
      </div>
    );
  }

  return (
    <div className={cn('flex h-full flex-col overflow-hidden', className)}>
      {/* Header */}
      <div className="border-b bg-card/30 backdrop-blur">
        <div className="flex h-14 items-center justify-between px-4">
          <ChatHeader
            chat={{ title: 'Chat', _id: chatId || '' }}
            onGenerateTitle={() => {}}
            onDelete={() => {}}
            onRename={() => {}}
          />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <MessageList
          messages={messages}
          fontSize={fontSize}
          isTyping={false}
          onMessageRegenerate={handleRegenerate}
        />
      </div>

      {/* Status indicator */}
      {isLoading && !isStreaming && (
        <div className="border-t bg-muted/50 px-4 py-2 text-center text-sm text-muted-foreground">
          Sending message...
        </div>
      )}

      {/* Input */}
      <div className="border-t bg-card/30 backdrop-blur">
        <div className="mx-auto max-w-4xl p-4">
          <MessageInput
            onSend={handleSendMessage}
            disabled={!isReady}
            placeholder={
              isStreaming
                ? 'AI is responding...'
                : isLoading
                ? 'Sending...'
                : 'Type your message...'
            }
            fontSize={fontSize}
          />
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 rounded-lg bg-destructive/90 px-4 py-2 text-destructive-foreground">
          {error.message}
        </div>
      )}
    </div>
  );
}