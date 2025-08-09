'use client';

import { Bot, MessageSquare, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ChatWelcomeProps {
  onCreateChat: () => void;
  isCreating?: boolean;
}

export function ChatWelcome({ onCreateChat, isCreating }: ChatWelcomeProps) {
  const features = [
    {
      icon: <Zap className="h-5 w-5 text-yellow-500" />,
      title: 'Real-time Streaming',
      description: 'Get instant responses with live streaming',
    },
    {
      icon: <Bot className="h-5 w-5 text-blue-500" />,
      title: 'Multiple AI Models',
      description: 'Choose from 14+ cutting-edge AI models',
    },
    {
      icon: <Sparkles className="h-5 w-5 text-purple-500" />,
      title: 'Smart Context',
      description: 'Maintains conversation context intelligently',
    },
  ];

  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="max-w-2xl space-y-6">
        {/* Welcome Header */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20">
            <MessageSquare className="h-8 w-8 text-primary" />
          </div>
          <h1 className="mb-2 text-3xl font-bold">Welcome to ISIS Chat</h1>
          <p className="text-muted-foreground">
            Start a conversation with advanced AI models powered by real-time streaming
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          {features.map((feature, index) => (
            <Card key={index} className="p-4">
              <div className="mb-2">{feature.icon}</div>
              <h3 className="mb-1 font-medium text-sm">{feature.title}</h3>
              <p className="text-muted-foreground text-xs">{feature.description}</p>
            </Card>
          ))}
        </div>

        {/* CTA Button */}
        <div className="text-center">
          <Button
            size="lg"
            onClick={onCreateChat}
            disabled={isCreating}
            className="button-press"
          >
            {isCreating ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Creating Chat...
              </>
            ) : (
              <>
                <MessageSquare className="mr-2 h-4 w-4" />
                Start Your First Chat
              </>
            )}
          </Button>
        </div>

        {/* Quick Tips */}
        <div className="rounded-lg bg-muted/50 p-4">
          <h3 className="mb-2 font-medium text-sm">Quick Tips:</h3>
          <ul className="space-y-1 text-muted-foreground text-xs">
            <li>• Select different AI models from the dropdown above</li>
            <li>• Use Shift+Enter for multiline messages</li>
            <li>• Your chat history is saved automatically</li>
          </ul>
        </div>
      </div>
    </div>
  );
}