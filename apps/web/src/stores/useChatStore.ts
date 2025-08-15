import type { UIMessage as Message } from 'ai';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface ChatMessage extends Message {
  timestamp: number;
  edited?: boolean;
  editedAt?: number;
  reactions?: string[];
  threadId?: string;
  metadata?: Record<string, any>;
}

interface Chat {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  archived?: boolean;
  pinned?: boolean;
  tags?: string[];
}

interface ChatState {
  // Chats data
  chats: Map<string, Chat>;
  activeChat: Chat | null;

  // Message state
  streamingMessageId: string | null;
  pendingMessage: string;
  typingUsers: Set<string>;

  // Search and filters
  searchQuery: string;
  selectedTags: string[];
  showArchived: boolean;

  // Actions
  createChat: (title?: string) => Chat;
  deleteChat: (id: string) => void;
  archiveChat: (id: string) => void;
  pinChat: (id: string) => void;
  setActiveChat: (id: string) => void;

  // Message actions
  addMessage: (chatId: string, message: ChatMessage) => void;
  updateMessage: (
    chatId: string,
    messageId: string,
    updates: Partial<ChatMessage>
  ) => void;
  deleteMessage: (chatId: string, messageId: string) => void;
  addReaction: (chatId: string, messageId: string, emoji: string) => void;

  // UI actions
  setStreamingMessageId: (id: string | null) => void;
  setPendingMessage: (message: string) => void;
  addTypingUser: (userId: string) => void;
  removeTypingUser: (userId: string) => void;

  // Search and filter actions
  setSearchQuery: (query: string) => void;
  toggleTag: (tag: string) => void;
  setShowArchived: (show: boolean) => void;

  // Utility actions
  clearAllChats: () => void;
  exportChat: (id: string) => string;
  importChat: (data: string) => void;
}

export const useChatStore = create<ChatState>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      chats: new Map(),
      activeChat: null,
      streamingMessageId: null,
      pendingMessage: '',
      typingUsers: new Set(),
      searchQuery: '',
      selectedTags: [],
      showArchived: false,

      // Chat actions
      createChat: (title) => {
        const chat: Chat = {
          id: `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: title || 'New Chat',
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        set((state) => {
          state.chats.set(chat.id, chat);
          state.activeChat = chat;
        });

        return chat;
      },

      deleteChat: (id) =>
        set((state) => {
          state.chats.delete(id);
          if (state.activeChat?.id === id) {
            state.activeChat = null;
          }
        }),

      archiveChat: (id) =>
        set((state) => {
          const chat = state.chats.get(id);
          if (chat) {
            chat.archived = !chat.archived;
            chat.updatedAt = Date.now();
          }
        }),

      pinChat: (id) =>
        set((state) => {
          const chat = state.chats.get(id);
          if (chat) {
            chat.pinned = !chat.pinned;
            chat.updatedAt = Date.now();
          }
        }),

      setActiveChat: (id) =>
        set((state) => {
          const chat = state.chats.get(id);
          if (chat) {
            state.activeChat = chat;
          }
        }),

      // Message actions
      addMessage: (chatId, message) =>
        set((state) => {
          const chat = state.chats.get(chatId);
          if (chat) {
            chat.messages.push(message);
            chat.updatedAt = Date.now();
          }
        }),

      updateMessage: (chatId, messageId, updates) =>
        set((state) => {
          const chat = state.chats.get(chatId);
          if (chat) {
            const messageIndex = chat.messages.findIndex(
              (m) => m.id === messageId
            );
            if (messageIndex !== -1) {
              Object.assign(chat.messages[messageIndex], updates);
              if (updates.content) {
                chat.messages[messageIndex].edited = true;
                chat.messages[messageIndex].editedAt = Date.now();
              }
              chat.updatedAt = Date.now();
            }
          }
        }),

      deleteMessage: (chatId, messageId) =>
        set((state) => {
          const chat = state.chats.get(chatId);
          if (chat) {
            chat.messages = chat.messages.filter((m) => m.id !== messageId);
            chat.updatedAt = Date.now();
          }
        }),

      addReaction: (chatId, messageId, emoji) =>
        set((state) => {
          const chat = state.chats.get(chatId);
          if (chat) {
            const message = chat.messages.find((m) => m.id === messageId);
            if (message) {
              if (!message.reactions) {
                message.reactions = [];
              }
              if (message.reactions.includes(emoji)) {
                message.reactions = message.reactions.filter(
                  (e) => e !== emoji
                );
              } else {
                message.reactions.push(emoji);
              }
              chat.updatedAt = Date.now();
            }
          }
        }),

      // UI actions
      setStreamingMessageId: (id) =>
        set((state) => {
          state.streamingMessageId = id;
        }),

      setPendingMessage: (message) =>
        set((state) => {
          state.pendingMessage = message;
        }),

      addTypingUser: (userId) =>
        set((state) => {
          state.typingUsers.add(userId);
        }),

      removeTypingUser: (userId) =>
        set((state) => {
          state.typingUsers.delete(userId);
        }),

      // Search and filter actions
      setSearchQuery: (query) =>
        set((state) => {
          state.searchQuery = query;
        }),

      toggleTag: (tag) =>
        set((state) => {
          const index = state.selectedTags.indexOf(tag);
          if (index === -1) {
            state.selectedTags.push(tag);
          } else {
            state.selectedTags.splice(index, 1);
          }
        }),

      setShowArchived: (show) =>
        set((state) => {
          state.showArchived = show;
        }),

      // Utility actions
      clearAllChats: () =>
        set((state) => {
          state.chats.clear();
          state.activeChat = null;
        }),

      exportChat: (id) => {
        const chat = get().chats.get(id);
        if (!chat) return '';

        return JSON.stringify(chat, null, 2);
      },

      importChat: (data) => {
        try {
          const chat = JSON.parse(data) as Chat;
          if (chat.id && chat.messages && chat.title) {
            set((state) => {
              state.chats.set(chat.id, chat);
            });
          }
        } catch (error) {
          console.error('Failed to import chat:', error);
        }
      },
    }))
  )
);
