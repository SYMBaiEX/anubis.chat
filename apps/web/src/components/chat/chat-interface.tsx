'use client';

import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import {
  Bot,
  Brain,
  Globe,
  MessageSquare,
  Monitor,
  Moon,
  Palette,
  Plus,
  Settings,
  Sidebar,
  Sun,
  Volume2,
  X,
  Zap,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { FeatureGate } from '@/components/auth/feature-gate';
import { UpgradePrompt } from '@/components/auth/upgrade-prompt';
import { EmptyState } from '@/components/data/empty-states';
import { LoadingStates } from '@/components/data/loading-states';
import {
  useAuthContext,
  useCanSendMessage,
  useSubscriptionLimits,
  useUpgradePrompt,
} from '@/components/providers/auth-provider';
import { useSolanaAgent } from '@/components/providers/solana-agent-provider';
import { AgentGrid } from '@/components/ui/agent-grid';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ModelGrid } from '@/components/ui/model-grid';
import { type GridSetting, SettingsGrid } from '@/components/ui/settings-grid';
import { useConvexChat } from '@/hooks/use-convex-chat';
import { useTypingIndicator } from '@/hooks/use-typing-indicator';
import { AI_MODELS, DEFAULT_MODEL } from '@/lib/constants/ai-models';
import type { Chat, StreamingMessage } from '@/lib/types/api';
import type { MinimalMessage } from '@/lib/types/components';
import { cn } from '@/lib/utils';
import { createModuleLogger } from '@/lib/utils/logger';
import { AgentSelectorDialog } from './agent-selector-dialog';
import { ChatHeader } from './chat-header';
import { ChatList } from './chat-list';
import { ChatSettingsDialog } from './chat-settings-dialog';
import { ChatWelcome } from './chat-welcome';
import { MessageInput } from './message-input';
import { MessageList } from './message-list';
import { ModelSelector } from './model-selector';
import { UsageIndicator } from './usage-indicator';

const log = createModuleLogger('components/chat/chat-interface');

type ChatSettings = {
  // Model Settings
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;

  // Behavior Settings
  systemPrompt: string;
  streamResponses: boolean;
  enableMemory: boolean;

  // Interface Settings
  theme: 'light' | 'dark' | 'system';
  language: string;
  soundEnabled: boolean;
  autoScroll: boolean;

  // Advanced Settings
  saveHistory: boolean;
  contextWindow: number;
  responseFormat: 'text' | 'markdown' | 'json';
};

interface ChatInterfaceProps {
  className?: string;
}

/**
 * ChatInterface - Main chat application component
 * Provides modern AI chat experience with sidebar navigation and message handling
 */
export function ChatInterface({ className }: ChatInterfaceProps) {
  const { user, isAuthenticated, token } = useAuthContext();
  const userWalletAddress = user?.walletAddress;
  const limits = useSubscriptionLimits();
  const upgradePrompt = useUpgradePrompt();
  const canSendMessage = useCanSendMessage();
  const { agents, selectedAgent, selectAgent, isInitialized } =
    useSolanaAgent();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get chat ID from URL
  const urlChatId = searchParams.get('chatId');
  const [selectedChatId, setSelectedChatId] = useState<string | undefined>(
    urlChatId || undefined
  );
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_MODEL.id);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  // Mobile dialog states
  const [showMobileModelSelector, setShowMobileModelSelector] = useState(false);
  const [showMobileAgentSelector, setShowMobileAgentSelector] = useState(false);
  const [showMobileSettings, setShowMobileSettings] = useState(false);

  // Chat settings state - complete configuration
  const [chatSettings, setChatSettings] = useState<ChatSettings>({
    // Model Settings
    model: DEFAULT_MODEL.id,
    temperature: 0.7,
    maxTokens: 2000,
    topP: 0.9,
    frequencyPenalty: 0,
    presencePenalty: 0,

    // Behavior Settings
    systemPrompt:
      selectedAgent?.systemPrompt ||
      'You are ISIS, a helpful AI assistant with access to Solana blockchain operations.',
    streamResponses: true,
    enableMemory: true,

    // Interface Settings
    theme: 'system' as const,
    language: 'en',
    soundEnabled: true,
    autoScroll: true,

    // Advanced Settings
    saveHistory: true,
    contextWindow: 10,
    responseFormat: 'markdown' as const,
  });

  // Debug logging
  useEffect(() => {
    console.log('ChatInterface - Auth state:', {
      isAuthenticated,
      user,
      walletAddress: user?.walletAddress,
    });
  }, [isAuthenticated, user]);

  // Convex queries and mutations - using authenticated queries
  const chats = useQuery(
    api.chatsAuth.getMyChats,
    isAuthenticated ? {} : 'skip'
  );

  const currentChatQuery = useQuery(
    api.chatsAuth.getMyChat,
    selectedChatId && isAuthenticated
      ? { id: selectedChatId as Id<'chats'> }
      : 'skip'
  );

  const createChat = useMutation(api.chatsAuth.createMyChat);
  const updateChat = useMutation(api.chatsAuth.updateMyChat);
  const deleteChat = useMutation(api.chatsAuth.deleteMyChat);

  // Use our new Convex chat hook for real-time streaming
  const { messages, sendMessage, isStreaming, streamingMessage } =
    useConvexChat(selectedChatId);

  // Use typing indicators
  const { typingUsers, startTyping, stopTyping, isAnyoneTyping } =
    useTypingIndicator(selectedChatId, userWalletAddress);

  // Use the dedicated query for the current chat instead of filtering from the list
  const currentChat = currentChatQuery as
    | (Pick<
        Chat,
        | 'title'
        | 'model'
        | 'lastMessageAt'
        | 'updatedAt'
        | 'systemPrompt'
        | 'temperature'
      > & {
        _id: string;
      })
    | undefined;

  // Sync URL parameter with selected chat ID
  useEffect(() => {
    if (urlChatId && urlChatId !== selectedChatId) {
      setSelectedChatId(urlChatId);
    }
  }, [urlChatId]);

  // Auto-select first chat on load if no chat is selected
  useEffect(() => {
    if (chats && chats.length > 0 && !selectedChatId) {
      const firstChatId = chats[0]._id;
      setSelectedChatId(firstChatId);
      // Update URL to include the chat ID
      router.push(`/chat?chatId=${firstChatId}`);
    }
  }, [chats, selectedChatId, router]);

  // Update selected model and settings when chat changes
  useEffect(() => {
    if (currentChat && currentChat.model) {
      setSelectedModel(currentChat.model);
      setChatSettings((prev) => ({
        ...prev,
        model: currentChat.model,
        systemPrompt: currentChat.systemPrompt || prev.systemPrompt,
        temperature: currentChat.temperature || prev.temperature,
      }));
    }
  }, [currentChat]);

  // Update system prompt when agent changes
  useEffect(() => {
    if (selectedAgent?.systemPrompt) {
      setChatSettings((prev) => ({
        ...prev,
        systemPrompt: selectedAgent.systemPrompt || prev.systemPrompt,
      }));
    }
  }, [selectedAgent]);

  const handleChatSelect = (chatId: string) => {
    setSelectedChatId(chatId);
    router.push(`/chat?chatId=${chatId}`);
  };

  const handleCreateChat = async () => {
    if (!isAuthenticated) {
      console.error('Cannot create chat: User is not authenticated');
      return;
    }

    setIsCreatingChat(true);
    try {
      const newChat = await createChat({
        title: `New Chat ${new Date().toLocaleTimeString()}`,
        model: selectedModel || DEFAULT_MODEL.id,
        systemPrompt:
          selectedAgent?.systemPrompt ||
          'You are ISIS, a helpful AI assistant with access to Solana blockchain operations.',
      });
      // The create mutation returns the full chat document, extract the _id
      if (newChat && newChat._id) {
        setSelectedChatId(newChat._id);
        // Update URL to include the new chat ID
        router.push(`/chat?chatId=${newChat._id}`);
      }
    } catch (error) {
      console.error('Failed to create chat:', error);
    } finally {
      setIsCreatingChat(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!(selectedChatId && user && userWalletAddress)) {
      console.error('Missing requirements for sending message:', {
        selectedChatId,
        user: !!user,
      });
      return;
    }

    // Check if user can send messages
    if (!canSendMessage) {
      setShowUpgradePrompt(true);
      return;
    }

    try {
      // Use the new Convex streaming function with selected model
      await sendMessage(content, userWalletAddress, selectedModel);
    } catch (error: any) {
      log.error('Failed to send message', { error: error?.message });
      // If error is about limits, show upgrade prompt
      if (
        error?.message?.includes('limit') ||
        error?.message?.includes('quota')
      ) {
        setShowUpgradePrompt(true);
      }
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      await deleteChat({
        id: chatId as Id<'chats'>,
      });
      if (selectedChatId === chatId) {
        const remainingChats = chats?.filter((chat) => chat._id !== chatId);
        setSelectedChatId(remainingChats?.[0]?._id);
      }
    } catch (error: any) {
      log.error('Failed to delete chat', { error: error?.message });
    }
  };

  const handleModelChange = async (newModel: string) => {
    setSelectedModel(newModel);
    setChatSettings((prev) => ({ ...prev, model: newModel }));

    // Update the chat's model in the database
    if (selectedChatId && isAuthenticated) {
      try {
        await updateChat({
          id: selectedChatId as Id<'chats'>,
          model: newModel,
        });
      } catch (error: any) {
        log.error('Failed to update chat model', { error: error?.message });
      }
    }
  };

  const handleSettingsChange = (newSettings: ChatSettings) => {
    setChatSettings(newSettings);

    // Update selected model if it changed
    if (newSettings.model !== selectedModel) {
      setSelectedModel(newSettings.model);
    }

    // Update chat model in database if needed
    if (
      selectedChatId &&
      isAuthenticated &&
      newSettings.model !== chatSettings.model
    ) {
      updateChat({
        id: selectedChatId as Id<'chats'>,
        model: newSettings.model,
      }).catch((error: any) => {
        log.error('Failed to update chat model from settings', {
          error: error?.message,
        });
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <EmptyState
          description="Please connect your wallet and sign in to access the chat interface"
          icon={<MessageSquare className="h-12 w-12 text-muted-foreground" />}
          title="Authentication Required"
        />
      </div>
    );
  }

  return (
    <div className={cn('flex h-full min-h-0 bg-background', className)}>
      {/* Main Chat Area */}
      <div className="flex min-h-0 flex-1 flex-col">
        {/* Top Bar */}
        <div className="flex h-14 items-center justify-between border-border/50 border-b bg-card/30 px-3 backdrop-blur sm:px-4 lg:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            {!sidebarOpen && (
              <Button
                className="button-press flex-shrink-0"
                onClick={() => setSidebarOpen(true)}
                size="sm"
                variant="ghost"
              >
                <Sidebar className="h-4 w-4" />
              </Button>
            )}

            {currentChat ? (
              <div className="min-w-0 flex-1">
                <ChatHeader
                  chat={currentChat}
                  onAgentSelectorClick={() => setShowMobileAgentSelector(true)}
                  onClearHistory={() => {
                    // TODO: Implement clear chat history
                    console.log('Clear history for chat:', currentChat._id);
                  }}
                  onDelete={() => {
                    if (selectedChatId) {
                      handleDeleteChat(selectedChatId);
                    }
                  }}
                  onModelSelectorClick={() => setShowMobileModelSelector(true)}
                  onRename={(newTitle) => {
                    if (selectedChatId && isAuthenticated) {
                      updateChat({
                        id: selectedChatId as Id<'chats'>,
                        title: newTitle,
                      }).catch((error: any) => {
                        log.error('Failed to rename chat', {
                          error: error?.message,
                        });
                      });
                    }
                  }}
                  onSettingsClick={() => setShowMobileSettings(true)}
                />
              </div>
            ) : (
              <div className="flex min-w-0 items-center gap-2">
                <MessageSquare className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                <span className="truncate font-medium text-muted-foreground text-sm sm:text-base">
                  Select a chat to begin
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-shrink-0 items-center gap-1 sm:gap-2">
            {/* Model Selector - responsive width */}
            {currentChat && (
              <div className="hidden w-40 sm:block md:w-48 lg:w-56">
                <ModelSelector
                  disabled={isStreaming}
                  onValueChange={handleModelChange}
                  value={selectedModel}
                />
              </div>
            )}

            {/* Agent Selector - hide on mobile */}
            {isInitialized && (
              <div className="hidden lg:block">
                <AgentSelectorDialog />
              </div>
            )}

            <Button
              className="button-press"
              disabled={isCreatingChat}
              onClick={handleCreateChat}
              size="sm"
              variant="outline"
            >
              <Plus className="h-4 w-4" />
              <span className="ml-1 hidden sm:inline-block">New Chat</span>
            </Button>

            <ChatSettingsDialog
              className="hidden sm:flex"
              onSettingsChange={handleSettingsChange}
              settings={chatSettings}
            />
          </div>
        </div>

        {/* Chat Content */}
        {currentChat ? (
          <div className="flex min-h-0 flex-1 flex-col bg-gradient-to-br from-background via-muted/10 to-background">
            {/* Message List */}
            <div className="relative flex-1 overflow-hidden">
              {messages === undefined ? (
                <div className="flex h-full items-center justify-center">
                  <LoadingStates
                    size="lg"
                    text="Loading messages..."
                    variant="spinner"
                  />
                </div>
              ) : (
                <MessageList
                  isTyping={isAnyoneTyping}
                  messages={(messages || []).map((m) => {
                    if ((m as StreamingMessage).isStreaming) {
                      return m as StreamingMessage;
                    }
                    const doc = m as {
                      _id: unknown;
                      content: string;
                      role: 'user' | 'assistant' | 'system';
                      createdAt?: number;
                      _creationTime?: number;
                    };
                    const normalized: MinimalMessage = {
                      _id: String(doc._id),
                      content: doc.content,
                      role: doc.role,
                      createdAt:
                        doc.createdAt ?? doc._creationTime ?? Date.now(),
                    };
                    return normalized;
                  })}
                  onMessageRegenerate={(messageId) => {
                    // TODO: Implement message regeneration
                    console.log('Regenerate message:', messageId);
                  }}
                />
              )}
            </div>

            {/* Upgrade Prompt */}
            {upgradePrompt.shouldShow && upgradePrompt.urgency === 'high' && (
              <div className="border-border/50 border-t bg-card/30 p-3 sm:p-4">
                <div className="mx-auto max-w-3xl lg:max-w-5xl xl:max-w-6xl">
                  <UpgradePrompt
                    onDismiss={() => setShowUpgradePrompt(false)}
                    prompt={upgradePrompt}
                    variant="inline"
                  />
                </div>
              </div>
            )}

            {/* Message Input */}
            <div className="border-border/50 border-t bg-card/30 backdrop-blur">
              <div className="p-3 sm:p-4 lg:p-6">
                <div className="mx-auto max-w-3xl lg:max-w-5xl xl:max-w-6xl">
                  <MessageInput
                    disabled={
                      !selectedChatId ||
                      messages === undefined ||
                      isStreaming ||
                      !canSendMessage
                    }
                    onSend={handleSendMessage}
                    onTyping={startTyping}
                    placeholder={
                      canSendMessage
                        ? isStreaming
                          ? 'ISIS is responding...'
                          : 'Ask ISIS anything...'
                        : 'Message limit reached - Upgrade to continue'
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background">
            {chats?.length === 0 ? (
              <ChatWelcome
                isCreating={isCreatingChat}
                onCreateChat={handleCreateChat}
              />
            ) : (
              <EmptyState
                description="Select a chat from the sidebar to continue"
                icon={
                  <MessageSquare className="h-12 w-12 text-muted-foreground" />
                }
                title="No Chat Selected"
              />
            )}
          </div>
        )}
      </div>

      {/* Mobile Model Selector Dialog */}
      <Dialog
        onOpenChange={setShowMobileModelSelector}
        open={showMobileModelSelector}
      >
        <DialogContent className="max-h-[80vh] max-w-6xl overflow-hidden">
          <DialogHeader>
            <DialogTitle>Select AI Model</DialogTitle>
            <DialogDescription>
              Choose an AI model for your conversation
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto">
            <ModelGrid
              columns={2}
              models={AI_MODELS}
              onModelSelect={(model) => {
                handleModelChange(model.id);
                setShowMobileModelSelector(false);
              }}
              selectedModelId={selectedModel}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Mobile Agent Selector Dialog */}
      <Dialog
        onOpenChange={setShowMobileAgentSelector}
        open={showMobileAgentSelector}
      >
        <DialogContent className="max-h-[80vh] max-w-6xl overflow-hidden">
          <DialogHeader>
            <DialogTitle>Select AI Agent</DialogTitle>
            <DialogDescription>
              Choose a specialized agent for your blockchain tasks
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto">
            {agents && (
              <AgentGrid
                agents={agents}
                columns={2}
                onAgentSelect={(agent) => {
                  selectAgent(agent._id);
                  setShowMobileAgentSelector(false);
                }}
                selectedAgentId={selectedAgent?._id}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Mobile Settings Dialog */}
      <Dialog onOpenChange={setShowMobileSettings} open={showMobileSettings}>
        <DialogContent className="max-h-[85vh] max-w-6xl overflow-hidden">
          <DialogHeader>
            <DialogTitle>Chat Settings</DialogTitle>
            <DialogDescription>
              Configure AI model behavior and interface preferences
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[65vh] overflow-y-auto">
            <SettingsGrid
              columns={2}
              compact={false}
              settings={[
                // Model Settings
                {
                  id: 'model',
                  title: 'AI Model',
                  description: 'Select the AI model to use for responses',
                  type: 'select',
                  value: chatSettings.model,
                  onChange: (value) =>
                    handleSettingsChange({ ...chatSettings, model: value }),
                  options: AI_MODELS.map((model) => ({
                    value: model.id,
                    label: model.name,
                    badge: model.provider,
                  })),
                  icon: <Brain className="h-4 w-4" />,
                  category: 'model',
                },
                {
                  id: 'temperature',
                  title: 'Temperature',
                  description:
                    'Controls randomness: Lower is more focused, higher is more creative',
                  type: 'slider',
                  value: chatSettings.temperature,
                  onChange: (value) =>
                    handleSettingsChange({
                      ...chatSettings,
                      temperature: value,
                    }),
                  min: 0,
                  max: 2,
                  step: 0.1,
                  icon: <Zap className="h-4 w-4" />,
                  category: 'model',
                },
                {
                  id: 'maxTokens',
                  title: 'Max Tokens',
                  description: 'Maximum length of the response',
                  type: 'slider',
                  value: chatSettings.maxTokens,
                  onChange: (value) =>
                    handleSettingsChange({ ...chatSettings, maxTokens: value }),
                  min: 100,
                  max: 4000,
                  step: 100,
                  icon: <Brain className="h-4 w-4" />,
                  category: 'model',
                },
                // Behavior Settings
                {
                  id: 'systemPrompt',
                  title: 'System Prompt',
                  description:
                    "Instructions that define the AI's behavior and personality",
                  type: 'textarea',
                  value: chatSettings.systemPrompt,
                  onChange: (value) =>
                    handleSettingsChange({
                      ...chatSettings,
                      systemPrompt: value,
                    }),
                  placeholder: 'You are a helpful AI assistant...',
                  rows: 4,
                  icon: <Settings className="h-4 w-4" />,
                  category: 'behavior',
                },
                {
                  id: 'streamResponses',
                  title: 'Stream Responses',
                  description: "Show responses as they're generated",
                  type: 'switch',
                  value: chatSettings.streamResponses,
                  onChange: (value) =>
                    handleSettingsChange({
                      ...chatSettings,
                      streamResponses: value,
                    }),
                  icon: <Zap className="h-4 w-4" />,
                  category: 'behavior',
                },
                {
                  id: 'enableMemory',
                  title: 'Enable Memory',
                  description: 'Remember context across conversations',
                  type: 'switch',
                  value: chatSettings.enableMemory,
                  onChange: (value) =>
                    handleSettingsChange({
                      ...chatSettings,
                      enableMemory: value,
                    }),
                  icon: <Brain className="h-4 w-4" />,
                  category: 'behavior',
                },
                // Interface Settings
                {
                  id: 'theme',
                  title: 'Theme',
                  description: 'Choose your preferred color scheme',
                  type: 'select',
                  value: chatSettings.theme,
                  onChange: (value) =>
                    handleSettingsChange({ ...chatSettings, theme: value }),
                  options: [
                    {
                      value: 'light',
                      label: 'Light',
                      icon: <Sun className="h-4 w-4" />,
                    },
                    {
                      value: 'dark',
                      label: 'Dark',
                      icon: <Moon className="h-4 w-4" />,
                    },
                    {
                      value: 'system',
                      label: 'System',
                      icon: <Monitor className="h-4 w-4" />,
                    },
                  ],
                  icon: <Palette className="h-4 w-4" />,
                  category: 'interface',
                },
                {
                  id: 'language',
                  title: 'Language',
                  description: 'Select your preferred language',
                  type: 'select',
                  value: chatSettings.language,
                  onChange: (value) =>
                    handleSettingsChange({ ...chatSettings, language: value }),
                  options: [
                    { value: 'en', label: 'English' },
                    { value: 'es', label: 'Spanish' },
                    { value: 'fr', label: 'French' },
                    { value: 'de', label: 'German' },
                    { value: 'zh', label: 'Chinese' },
                    { value: 'ja', label: 'Japanese' },
                  ],
                  icon: <Globe className="h-4 w-4" />,
                  category: 'interface',
                },
                {
                  id: 'soundEnabled',
                  title: 'Sound Effects',
                  description: 'Play sounds for notifications',
                  type: 'switch',
                  value: chatSettings.soundEnabled,
                  onChange: (value) =>
                    handleSettingsChange({
                      ...chatSettings,
                      soundEnabled: value,
                    }),
                  icon: <Volume2 className="h-4 w-4" />,
                  category: 'interface',
                },
                {
                  id: 'autoScroll',
                  title: 'Auto-scroll',
                  description: 'Automatically scroll to new messages',
                  type: 'switch',
                  value: chatSettings.autoScroll,
                  onChange: (value) =>
                    handleSettingsChange({
                      ...chatSettings,
                      autoScroll: value,
                    }),
                  icon: <Monitor className="h-4 w-4" />,
                  category: 'interface',
                },
                // Advanced Settings
                {
                  id: 'topP',
                  title: 'Top P',
                  description:
                    'Nucleus sampling: Higher values = more diverse responses',
                  type: 'slider',
                  value: chatSettings.topP,
                  onChange: (value) =>
                    handleSettingsChange({ ...chatSettings, topP: value }),
                  min: 0,
                  max: 1,
                  step: 0.1,
                  icon: <Settings className="h-4 w-4" />,
                  category: 'advanced',
                },
                {
                  id: 'frequencyPenalty',
                  title: 'Frequency Penalty',
                  description: 'Reduce repetitive responses',
                  type: 'slider',
                  value: chatSettings.frequencyPenalty,
                  onChange: (value) =>
                    handleSettingsChange({
                      ...chatSettings,
                      frequencyPenalty: value,
                    }),
                  min: -2,
                  max: 2,
                  step: 0.1,
                  icon: <Settings className="h-4 w-4" />,
                  category: 'advanced',
                },
                {
                  id: 'presencePenalty',
                  title: 'Presence Penalty',
                  description: 'Encourage talking about new topics',
                  type: 'slider',
                  value: chatSettings.presencePenalty,
                  onChange: (value) =>
                    handleSettingsChange({
                      ...chatSettings,
                      presencePenalty: value,
                    }),
                  min: -2,
                  max: 2,
                  step: 0.1,
                  icon: <Settings className="h-4 w-4" />,
                  category: 'advanced',
                },
                {
                  id: 'saveHistory',
                  title: 'Save History',
                  description: 'Store conversation history locally',
                  type: 'switch',
                  value: chatSettings.saveHistory,
                  onChange: (value) =>
                    handleSettingsChange({
                      ...chatSettings,
                      saveHistory: value,
                    }),
                  icon: <Settings className="h-4 w-4" />,
                  category: 'advanced',
                },
                {
                  id: 'contextWindow',
                  title: 'Context Window',
                  description:
                    'Number of previous messages to include in context',
                  type: 'slider',
                  value: chatSettings.contextWindow,
                  onChange: (value) =>
                    handleSettingsChange({
                      ...chatSettings,
                      contextWindow: value,
                    }),
                  min: 1,
                  max: 50,
                  step: 1,
                  icon: <Brain className="h-4 w-4" />,
                  category: 'advanced',
                },
                {
                  id: 'responseFormat',
                  title: 'Response Format',
                  description: 'Format for AI responses',
                  type: 'select',
                  value: chatSettings.responseFormat,
                  onChange: (value) =>
                    handleSettingsChange({
                      ...chatSettings,
                      responseFormat: value,
                    }),
                  options: [
                    { value: 'text', label: 'Plain Text' },
                    { value: 'markdown', label: 'Markdown' },
                    { value: 'json', label: 'JSON' },
                  ],
                  icon: <Settings className="h-4 w-4" />,
                  category: 'advanced',
                },
              ]}
            />
          </div>

          <div className="flex justify-end border-t pt-4">
            <Button onClick={() => setShowMobileSettings(false)}>Done</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upgrade Prompt Modal */}
      {showUpgradePrompt && upgradePrompt.suggestedTier && (
        <UpgradePrompt
          onDismiss={() => setShowUpgradePrompt(false)}
          prompt={upgradePrompt}
          variant="modal"
        />
      )}
    </div>
  );
}

export default ChatInterface;
