'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Bot, Sparkles } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAIChat } from '@/hooks/use-ai-chat';
import { cn } from '@/lib/utils';
import { AISuggestions } from './ai-suggestions';
import { Composer } from './composer';
import { Thread } from './thread';

interface AIChatInterfaceProps {
  chatId?: string;
  className?: string;
  initialMessages?: any[];
  model?: string;
  maxSteps?: number;
  showSuggestions?: boolean;
  enableTools?: boolean;
}

export function AIChatInterface({
  chatId,
  className,
  initialMessages = [],
  model = 'gpt-4',
  maxSteps = 5,
  showSuggestions = true,
  enableTools = true,
}: AIChatInterfaceProps) {
  const [selectedModel, setSelectedModel] = useState(model);
  const [showModelSelector, setShowModelSelector] = useState(false);

  const {
    messages,
    input,
    setInput,
    sendMessage,
    reload,
    stop,
    isLoading,
    error,
    attachments,
    handleFileUpload,
    removeAttachment,
    clearAttachments,
    generateSuggestions,
  } = useAIChat({
    chatId,
    initialMessages,
    maxSteps,
    experimental_toolCallStreaming: enableTools,
    onFinish: (message) => {
      console.log('Message finished:', message);
    },
    onError: (error) => {
      console.error('Chat error:', error);
    },
  });

  const suggestions = generateSuggestions();

  const handleSendMessage = useCallback(
    (content: string, messageAttachments?: any[]) => {
      sendMessage(content, messageAttachments || attachments);
    },
    [sendMessage, attachments]
  );

  const handleSuggestionSelect = useCallback(
    (suggestion: string) => {
      setInput(suggestion);
      sendMessage(suggestion);
    },
    [setInput, sendMessage]
  );

  const handleMessageRegenerate = useCallback(
    (messageId: string) => {
      const messageIndex = messages.findIndex((m) => m.id === messageId);
      if (messageIndex >= 0) {
        reload();
      }
    },
    [messages, reload]
  );

  const handleMessageFeedback = useCallback(
    (messageId: string, type: 'positive' | 'negative') => {
      console.log('Feedback for message:', messageId, type);
      // Implement feedback logic here
    },
    []
  );

  const availableModels = [
    { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI' },
    { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'Anthropic' },
    { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', provider: 'Anthropic' },
  ];

  return (
    <div className={cn('flex h-full flex-col', className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">AI Assistant</h2>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Model selector */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowModelSelector(!showModelSelector)}
          >
            <Sparkles className="mr-1 h-3 w-3" />
            {availableModels.find((m) => m.id === selectedModel)?.name || 'Model'}
          </Button>
        </div>
      </div>

      {/* Model selector dropdown */}
      <AnimatePresence>
        {showModelSelector && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-b bg-muted/50"
          >
            <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-4">
              {availableModels.map((modelOption) => (
                <Card
                  key={modelOption.id}
                  className={cn(
                    'cursor-pointer p-3 transition-all hover:shadow-md',
                    selectedModel === modelOption.id && 'border-primary bg-primary/5'
                  )}
                  onClick={() => {
                    setSelectedModel(modelOption.id);
                    setShowModelSelector(false);
                  }}
                >
                  <div className="text-sm font-medium">{modelOption.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {modelOption.provider}
                  </div>
                </Card>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error display */}
      {error && (
        <Alert variant="destructive" className="m-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      {/* Messages thread */}
      <div className="flex-1 overflow-hidden">
        <Thread
          messages={messages}
          isLoading={isLoading}
          suggestions={showSuggestions && messages.length === 0 ? suggestions : []}
          onSuggestionSelect={handleSuggestionSelect}
          onMessageRegenerate={handleMessageRegenerate}
          onMessageFeedback={handleMessageFeedback}
        />
      </div>

      {/* Quick suggestions when not empty */}
      {showSuggestions && messages.length > 0 && suggestions.length > 0 && (
        <div className="border-t px-4 py-2">
          <AISuggestions
            suggestions={suggestions}
            onSelect={handleSuggestionSelect}
            variant="chip"
          />
        </div>
      )}

      {/* Composer */}
      <div className="border-t p-4">
        <Composer
          value={input}
          onChange={setInput}
          onSubmit={handleSendMessage}
          onStop={isLoading ? stop : undefined}
          attachments={attachments}
          onAttachmentsChange={(newAttachments) => {
            // Clear and set new attachments
            clearAttachments();
            newAttachments.forEach((a) => {
              // The attachments are already in state
            });
          }}
          onFileUpload={handleFileUpload}
          isLoading={isLoading}
          placeholder="Ask me anything..."
          suggestions={messages.length === 0 ? suggestions.slice(0, 2) : []}
          onSuggestionSelect={handleSuggestionSelect}
        />
      </div>
    </div>
  );
}