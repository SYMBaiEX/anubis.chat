/**
 * Example component demonstrating Convex integration with Result patterns
 * Shows proper error handling, loading states, and real-time updates
 */

'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Convex integration imports
import {
  ChatListSkeleton,
  ConvexErrorBoundary,
  isSuccess,
  QueryStateIndicator,
  type Result,
  useChats,
  useCreateChat,
  useUpdateUserPreferences,
  useUser,
} from '@/hooks/convex';

interface ConvexIntegrationExampleProps {
  walletAddress: string;
}

export function ConvexIntegrationExample({
  walletAddress,
}: ConvexIntegrationExampleProps) {
  const [chatTitle, setChatTitle] = useState('');
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  // Real-time data queries with Result pattern
  const userQuery = useUser(walletAddress);
  const chatsQuery = useChats(walletAddress, { limit: 10 });

  // Mutations with error handling
  const { mutate: createChat } = useCreateChat();
  const { mutate: updatePreferences } = useUpdateUserPreferences();

  // =============================================================================
  // Event Handlers with Result Pattern
  // =============================================================================

  const handleCreateChat = async () => {
    if (!chatTitle.trim()) {
      toast.error('Please enter a chat title');
      return;
    }

    setIsCreatingChat(true);

    try {
      const result = await createChat({
        title: chatTitle.trim(),
        ownerId: walletAddress,
        model: 'gpt-4o',
        temperature: 0.7,
        maxTokens: 4000,
      });

      if (isSuccess(result)) {
        toast.success(`Chat "${result.data.title}" created successfully!`);
        setChatTitle('');
      } else {
        toast.error(`Failed to create chat: ${result.error.message}`);
      }
    } catch (error) {
      toast.error('Unexpected error creating chat');
    } finally {
      setIsCreatingChat(false);
    }
  };

  const handleToggleTheme = async () => {
    if (!userQuery.data) return;

    const newTheme =
      userQuery.data.preferences.theme === 'light' ? 'dark' : 'light';

    const result = await updatePreferences({
      walletAddress,
      preferences: {
        ...userQuery.data.preferences,
        theme: newTheme,
      },
    });

    if (isSuccess(result)) {
      toast.success(`Theme changed to ${newTheme}`);
    } else {
      toast.error(`Failed to update theme: ${result.error.message}`);
    }
  };

  // =============================================================================
  // Render Helpers
  // =============================================================================

  const renderUserInfo = () => {
    if (userQuery.isLoading) {
      return (
        <div className="text-muted-foreground text-sm">
          Loading user data...
        </div>
      );
    }

    if (userQuery.error) {
      return (
        <div className="text-red-500 text-sm">
          Error: {userQuery.error.message}
        </div>
      );
    }

    if (!userQuery.data) {
      return (
        <div className="text-muted-foreground text-sm">No user data found</div>
      );
    }

    const { data: user } = userQuery;

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-medium">
            {user.displayName || 'Anonymous User'}
          </span>
          <Badge variant="secondary">{user.subscription.tier}</Badge>
        </div>
        <div className="text-muted-foreground text-sm">
          Theme: {user.preferences.theme} | Model: {user.preferences.aiModel}
        </div>
        <div className="text-muted-foreground text-sm">
          Tokens: {user.subscription.tokensUsed.toLocaleString()} /{' '}
          {user.subscription.tokensLimit.toLocaleString()}
        </div>
        <Button onClick={handleToggleTheme} size="sm" variant="outline">
          Toggle Theme
        </Button>
      </div>
    );
  };

  const renderChatList = () => {
    if (chatsQuery.isLoading) {
      return <ChatListSkeleton />;
    }

    return (
      <>
        <QueryStateIndicator
          emptyText="No chats found. Create your first chat!"
          errorText={chatsQuery.error?.message || 'Failed to load chats'}
          hasError={!!chatsQuery.error}
          isEmpty={!chatsQuery.data || chatsQuery.data.length === 0}
          isLoading={chatsQuery.isLoading}
          loadingText="Loading chats..."
        />
        {chatsQuery.data && chatsQuery.data.length > 0 && (
          <div className="space-y-2">
            {chatsQuery.data.map((chat: any) => (
              <Card className="p-3" key={chat._id}>
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium">{chat.title}</h4>
                    <p className="text-muted-foreground text-sm">
                      {chat.messageCount} messages • {chat.model}
                    </p>
                  </div>
                  <Badge variant={chat.isActive ? 'default' : 'secondary'}>
                    {chat.isActive ? 'Active' : 'Archived'}
                  </Badge>
                </div>
                <div className="mt-2 text-muted-foreground text-xs">
                  Created: {new Date(chat.createdAt).toLocaleDateString()}
                </div>
              </Card>
            ))}
          </div>
        )}
      </>
    );
  };

  // =============================================================================
  // Main Render
  // =============================================================================

  return (
    <ConvexErrorBoundary showDetails={process.env.NODE_ENV === 'development'}>
      <div className="space-y-6">
        {/* User Information Section */}
        <Card>
          <CardHeader>
            <CardTitle>User Profile</CardTitle>
            <CardDescription>
              Real-time user data with Convex integration
            </CardDescription>
          </CardHeader>
          <CardContent>{renderUserInfo()}</CardContent>
        </Card>

        {/* Create Chat Section */}
        <Card>
          <CardHeader>
            <CardTitle>Create New Chat</CardTitle>
            <CardDescription>
              Create a new chat with optimistic updates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="chatTitle">Chat Title</Label>
                <Input
                  disabled={isCreatingChat}
                  id="chatTitle"
                  onChange={(e) => setChatTitle(e.target.value)}
                  placeholder="Enter chat title..."
                  value={chatTitle}
                />
              </div>
              <div className="flex items-end">
                <Button
                  className="shrink-0"
                  disabled={isCreatingChat || !chatTitle.trim()}
                  onClick={handleCreateChat}
                >
                  {isCreatingChat ? 'Creating...' : 'Create Chat'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chats List Section */}
        <Card>
          <CardHeader>
            <CardTitle>Your Chats</CardTitle>
            <CardDescription>
              Real-time chat list with automatic updates
            </CardDescription>
          </CardHeader>
          <CardContent>{renderChatList()}</CardContent>
        </Card>

        {/* Integration Status */}
        <Card>
          <CardHeader>
            <CardTitle>Integration Status</CardTitle>
            <CardDescription>
              Current state of Convex integration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium">User Query</div>
                <div className="text-muted-foreground">
                  Loading: {userQuery.isLoading ? 'Yes' : 'No'} • Error:{' '}
                  {userQuery.error ? 'Yes' : 'No'}
                </div>
              </div>
              <div>
                <div className="font-medium">Chats Query</div>
                <div className="text-muted-foreground">
                  Loading: {chatsQuery.isLoading ? 'Yes' : 'No'} • Error:{' '}
                  {chatsQuery.error ? 'Yes' : 'No'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ConvexErrorBoundary>
  );
}

// =============================================================================
// Usage Example for the Component
// =============================================================================

export function ConvexIntegrationExampleUsage() {
  // This would typically come from your auth context
  const walletAddress = 'example-wallet-address';

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <h1 className="font-bold text-2xl">Convex Integration Example</h1>
        <p className="text-muted-foreground">
          Demonstrates real-time data, error handling, and optimistic updates
        </p>
      </div>
      <ConvexIntegrationExample walletAddress={walletAddress} />
    </div>
  );
}
