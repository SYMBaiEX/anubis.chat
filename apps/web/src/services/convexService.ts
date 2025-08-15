import { api } from '@convex/_generated/api';
import type { Id, Doc } from '@convex/_generated/dataModel';
import { ConvexClient } from 'convex/browser';
import { createModuleLogger } from '@/lib/utils/logger';

const log = createModuleLogger('convexService');

interface ConvexConfig {
  url: string;
  maxRetries?: number;
  retryDelay?: number;
}

type ChatWithMessageCount = Doc<'chats'> & { messageCount: number };

/**
 * Service layer for Convex operations with error handling and retry logic
 */
export class ConvexService {
  private client: ConvexClient;
  private maxRetries: number;
  private retryDelay: number;

  constructor(config: ConvexConfig) {
    this.client = new ConvexClient(config.url);
    this.maxRetries = config.maxRetries || 3;
    this.retryDelay = config.retryDelay || 1000;
  }

  /**
   * Execute a query with retry logic
   */
  async query<T>(
    query: any,
    args?: any,
    options?: { retries?: number }
  ): Promise<T | null> {
    const maxRetries = options?.retries ?? this.maxRetries;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.client.query(query, args);
        return result as T;
      } catch (error) {
        log.error(`Query failed (attempt ${attempt + 1}/${maxRetries + 1})`, {
          error: error instanceof Error ? error.message : String(error),
          query: query.name,
        });

        if (attempt < maxRetries) {
          const delay = this.retryDelay * 2 ** attempt;
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          throw error;
        }
      }
    }

    return null;
  }

  /**
   * Execute a mutation with retry logic
   */
  async mutation<T>(
    mutation: any,
    args?: any,
    options?: { retries?: number }
  ): Promise<T | null> {
    const maxRetries = options?.retries ?? this.maxRetries;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.client.mutation(mutation, args);
        return result as T;
      } catch (error) {
        log.error(
          `Mutation failed (attempt ${attempt + 1}/${maxRetries + 1})`,
          {
            error: error instanceof Error ? error.message : String(error),
            mutation: mutation.name,
          }
        );

        if (attempt < maxRetries) {
          const delay = this.retryDelay * 2 ** attempt;
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          throw error;
        }
      }
    }

    return null;
  }

  /**
   * Subscribe to a query
   */
  subscribe<T>(query: any, args: any, callback: (data: T) => void): () => void {
    // Note: subscribe method needs to be implemented
    // For now, return a no-op unsubscribe function
    console.warn('Subscribe not implemented yet');
    return () => {};
  }
}

/**
 * Message service for chat operations
 */
export class MessageService {
  constructor(private convex: ConvexService) {}

  /**
   * Get messages for a chat
   */
  async getMessages(chatId: Id<'chats'>) {
    return this.convex.query(api.messages.getByChatId, { chatId, limit: 100 });
  }

  /**
   * Send a message
   */
  async sendMessage(chatId: Id<'chats'>, content: string) {
    return this.convex.mutation(api.messages.create, {
      chatId,
      content,
      role: 'user' as const,
    });
  }

  /**
   * Update a message
   */
  async updateMessage(messageId: Id<'messages'>, content: string) {
    return this.convex.mutation(api.messages.editMessage, {
      messageId,
      content,
    });
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId: Id<'messages'>) {
    return this.convex.mutation(api.messages.remove, { messageId });
  }

  /**
   * Subscribe to message updates
   */
  subscribeToMessages(
    chatId: Id<'chats'>,
    callback: (messages: any[]) => void
  ) {
    return this.convex.subscribe(
      api.messages.getByChatId,
      { chatId, limit: 100 },
      callback
    );
  }
}

/**
 * Chat service for chat management
 */
export class ChatService {
  constructor(private convex: ConvexService) {}

  /**
   * Get all chats
   */
  async getChats(ownerId: string) {
    return this.convex.query(api.chats.getByOwner, { ownerId });
  }

  /**
   * Get a specific chat
   */
  async getChat(chatId: Id<'chats'>) {
    return this.convex.query(api.chats.getById, { id: chatId });
  }

  /**
   * Create a new chat
   */
  async createChat(params: { title: string; ownerId: string; model: string; systemPrompt?: string; agentPrompt?: string; agentId?: Id<'agents'>; temperature?: number; maxTokens?: number; }) {
    return this.convex.mutation(api.chats.create, params);
  }

  /**
   * Update chat
   */
  async updateChat(
    chatId: Id<'chats'>,
    ownerId: string,
    updates: { title?: string; model?: string; systemPrompt?: string; agentPrompt?: string; agentId?: Id<'agents'>; temperature?: number; maxTokens?: number; isActive?: boolean }
  ) {
    return this.convex.mutation(api.chats.update, {
      id: chatId,
      ownerId,
      ...updates,
    });
  }

  /**
   * Delete chat
   */
  async deleteChat(chatId: Id<'chats'>, ownerId: string) {
    return this.convex.mutation(api.chats.remove, {
      id: chatId,
      ownerId,
    });
  }

  /**
   * Subscribe to chat updates
   */
  subscribeToChats(ownerId: string, callback: (chats: ChatWithMessageCount[]) => void) {
    return this.convex.subscribe(api.chats.getByOwner, { ownerId }, callback);
  }
}

/**
 * Create service instances
 */
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!;

export const convexService = new ConvexService({ url: convexUrl });
export const messageService = new MessageService(convexService);
export const chatService = new ChatService(convexService);
