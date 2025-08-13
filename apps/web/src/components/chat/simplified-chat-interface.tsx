'use client';

import { MessageSquare } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { EmptyState } from '@/components/data/empty-states';
import { useAuthContext } from '@/components/providers/auth-provider';
import { useEnhancedChat } from '@/hooks/use-enhanced-chat';
import { cn } from '@/lib/utils';
import type { FontSize } from '@/lib/utils/font-sizes';
import { createModuleLogger } from '@/lib/utils/logger';
import { ChatHeader } from './chat-header';
import { MessageInput } from './message-input';
import { MessageList } from './message-list';

interface SimplifiedChatInterfaceProps {
  className?: string;
}

/**
 * Simplified Chat Interface using AI SDK's useChat properly
 * Reduces complexity while maintaining all features
 */
export function SimplifiedChatInterface({
  className,
}: SimplifiedChatInterfaceProps) {
  const log = createModuleLogger('simplified-chat');
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
      log.error('Chat error', { error: err.message });
      // Handle error (show toast, etc.)
    },
  });

  // Handle message send with proper async handling
  const handleSendMessage = async (
    content: string,
    useReasoning?: boolean,
    attachments?: Array<{
      fileId: string;
      url?: string;
      mimeType: string;
      size: number;
      type: 'image' | 'file' | 'video';
    }>
  ) => {
    if (!(isReady && content.trim())) return;

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
          description="Please sign in to use the chat"
          icon={<MessageSquare className="h-12 w-12" />}
          title="Authentication Required"
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
            chat={{
              title: 'Chat',
              _id: chatId || '',
              model: 'gpt-5-nano',
              updatedAt: Date.now(),
            }}
            onDelete={() => {}}
            onGenerateTitle={() => {}}
            onRename={() => {}}
          />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <MessageList
          fontSize={fontSize}
          isTyping={false}
          messages={messages}
          onMessageRegenerate={handleRegenerate}
        />
      </div>

      {/* Status indicator */}
      {isLoading && !isStreaming && (
        <div className="border-t bg-muted/50 px-4 py-2 text-center text-muted-foreground text-sm">
          Sending message...
        </div>
      )}

      {/* Input */}
      <div className="border-t bg-card/30 backdrop-blur">
        <div className="mx-auto max-w-4xl p-4">
          <MessageInput
            disabled={!isReady}
            fontSize={fontSize}
            onSend={handleSendMessage}
            placeholder={
              isStreaming
                ? 'AI is responding...'
                : isLoading
                  ? 'Sending...'
                  : 'Type your message...'
            }
          />
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="-translate-x-1/2 absolute bottom-20 left-1/2 rounded-lg bg-destructive/90 px-4 py-2 text-destructive-foreground">
          {error.message}
        </div>
      )}
    </div>
  );
}
