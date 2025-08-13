'use client';

import { useChat } from '@ai-sdk/react';
import type { UIMessage } from 'ai';
import { DefaultChatTransport } from 'ai';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Bot, Sparkles } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { AIMessage } from '@/hooks/use-ai-chat';
import { cn } from '@/lib/utils';
import { createModuleLogger } from '@/lib/utils/logger';
import { AISuggestions } from './ai-suggestions';
import { Composer } from './composer';
import { Thread } from './thread';

interface AIChatInterfaceProps {
  chatId?: string;
  className?: string;
  initialMessages?: UIMessage[];
  model?: string;
  maxSteps?: number;
  showSuggestions?: boolean;
  enableTools?: boolean;
}

// Helper function to convert UIMessage to AIMessage format
function convertToAIMessage(uiMessage: UIMessage): AIMessage {
  // Extract text content from parts array
  const content =
    uiMessage.parts
      ?.filter((part: any) => part.type === 'text')
      .map((part: any) => part.text)
      .join('') || '';

  return {
    ...uiMessage,
    content,
    createdAt: Date.now(), // Add createdAt if not present
    toolInvocations: [], // In AI SDK v5, toolInvocations are handled differently
  } as AIMessage;
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
  const log = createModuleLogger('ai-chat-interface');
  const [selectedModel, setSelectedModel] = useState(model);
  const [showModelSelector, setShowModelSelector] = useState(false);

  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { messages, sendMessage, stop, error, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: { chatId, model: selectedModel, maxSteps },
    }),
    onFinish: async ({ message }) => {
      log.info('Message finished', { id: message.id });
    },
    onError: (error) => {
      log.error('Chat error', { error: error.message });
    },
  });

  const handleFileUpload = useCallback(async (files: File[]) => {
    // Simplified file upload logic - convert to MessageAttachment format
    const newAttachments = files.map((file) => ({
      fileId: `${Date.now()}-${file.name}`,
      mimeType: file.type,
      size: file.size,
      type: file.type.startsWith('image/')
        ? ('image' as const)
        : file.type.startsWith('video/')
          ? ('video' as const)
          : ('file' as const),
      url: URL.createObjectURL(file),
    }));
    setAttachments((prev) => [...prev, ...newAttachments]);
    return newAttachments;
  }, []);

  const _removeAttachment = useCallback((fileId: string) => {
    setAttachments((prev) => prev.filter((att) => att.fileId !== fileId));
  }, []);

  const clearAttachments = useCallback(() => {
    setAttachments([]);
  }, []);

  const generateSuggestions = useCallback(() => {
    if (!messages || messages.length === 0) {
      return [
        'What can you help me with?',
        'Tell me about your capabilities',
        'How do I get started?',
        'Explain your features',
      ];
    }
    return [
      'Can you explain that in more detail?',
      'What are the alternatives?',
      'How can I implement this?',
      'Show me an example',
    ];
  }, [messages]);

  const suggestions = generateSuggestions();

  const handleSendMessage = useCallback(
    async (content: string, _messageAttachments?: any[]) => {
      if (!content.trim()) {
        return;
      }

      setIsLoading(true);
      try {
        // Send message with AI SDK v5 format
        await sendMessage({
          role: 'user',
          parts: [{ type: 'text', text: content }],
        });

        setInput('');
        clearAttachments();
      } catch (error) {
        log.error('Failed to send message', { error });
      } finally {
        setIsLoading(false);
      }
    },
    [sendMessage, clearAttachments, log]
  );

  const handleSuggestionSelect = useCallback(
    async (suggestion: string) => {
      setInput(suggestion);
      setIsLoading(true);
      try {
        await sendMessage({
          role: 'user',
          parts: [{ type: 'text', text: suggestion }],
        });
        setInput('');
      } catch (error) {
        log.error('Failed to send suggestion', { error });
      } finally {
        setIsLoading(false);
      }
    },
    [sendMessage, log]
  );

  const handleMessageRegenerate = useCallback(
    (messageId: string) => {
      // In AI SDK v5, reload is not available, we'll need to implement regeneration differently
      // For now, just show a message that this feature needs to be implemented
      log.info('Message regeneration requested', { messageId });
      // TODO: Implement regeneration by finding the last user message and resending it
    },
    [log]
  );

  const handleMessageFeedback = useCallback(
    (messageId: string, type: 'positive' | 'negative') => {
      log.info('Feedback for message', { messageId, type });
      // Implement feedback logic here
    },
    [log]
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
            onClick={() => setShowModelSelector(!showModelSelector)}
            size="sm"
            variant="outline"
          >
            <Sparkles className="mr-1 h-3 w-3" />
            {availableModels.find((m) => m.id === selectedModel)?.name ||
              'Model'}
          </Button>
        </div>
      </div>

      {/* Model selector dropdown */}
      <AnimatePresence>
        {showModelSelector && (
          <motion.div
            animate={{ opacity: 1, height: 'auto' }}
            className="border-b bg-muted/50"
            exit={{ opacity: 0, height: 0 }}
            initial={{ opacity: 0, height: 0 }}
          >
            <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-4">
              {availableModels.map((modelOption) => (
                <Card
                  className={cn(
                    'cursor-pointer p-3 transition-all hover:shadow-md',
                    selectedModel === modelOption.id &&
                      'border-primary bg-primary/5'
                  )}
                  key={modelOption.id}
                  onClick={() => {
                    setSelectedModel(modelOption.id);
                    setShowModelSelector(false);
                  }}
                >
                  <div className="font-medium text-sm">{modelOption.name}</div>
                  <div className="text-muted-foreground text-xs">
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
        <Alert className="m-4" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      {/* Messages thread */}
      <div className="flex-1 overflow-hidden">
        <Thread
          isLoading={isLoading}
          messages={messages.map(convertToAIMessage)}
          onMessageFeedback={handleMessageFeedback}
          onMessageRegenerate={handleMessageRegenerate}
          onSuggestionSelect={handleSuggestionSelect}
          suggestions={
            showSuggestions && messages.length === 0 ? suggestions : []
          }
        />
      </div>

      {/* Quick suggestions when not empty */}
      {showSuggestions && messages.length > 0 && suggestions.length > 0 && (
        <div className="border-t px-4 py-2">
          <AISuggestions
            onSelect={handleSuggestionSelect}
            suggestions={suggestions}
            variant="chip"
          />
        </div>
      )}

      {/* Composer */}
      <div className="border-t p-4">
        <Composer
          attachments={attachments}
          isLoading={isLoading}
          onAttachmentsChange={(newAttachments) => {
            setAttachments(newAttachments);
          }}
          onChange={setInput}
          onFileUpload={handleFileUpload}
          onStop={isLoading ? stop : undefined}
          onSubmit={handleSendMessage}
          onSuggestionSelect={handleSuggestionSelect}
          placeholder="Ask me anything..."
          suggestions={messages.length === 0 ? suggestions.slice(0, 2) : []}
          value={input}
        />
      </div>
    </div>
  );
}
