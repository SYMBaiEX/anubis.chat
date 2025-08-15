import { api } from '@packages/backend';
import type { Id } from '@packages/backend/convex/_generated/dataModel';
import { ConvexClient } from 'convex/browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChatService, MessageService } from '../convexService';

// Mock Convex client
vi.mock('convex/browser', () => ({
  ConvexClient: vi.fn(() => ({
    query: vi.fn(),
    mutation: vi.fn(),
  })),
}));

describe('ConvexService', () => {
  let convexClient: any;
  let messageService: MessageService;
  let chatService: ChatService;

  beforeEach(() => {
    convexClient = new ConvexClient('mock-url');
    messageService = new MessageService(convexClient);
    chatService = new ChatService(convexClient);
    vi.clearAllMocks();
  });

  describe('MessageService', () => {
    describe('getMessages', () => {
      it('should fetch messages for a chat', async () => {
        const mockMessages = [
          { _id: '1', content: 'Hello', timestamp: Date.now() },
          { _id: '2', content: 'Hi there', timestamp: Date.now() },
        ];

        convexClient.query.mockResolvedValueOnce(mockMessages);

        const chatId = 'chat123' as Id<'chats'>;
        const result = await messageService.getMessages(chatId);

        expect(convexClient.query).toHaveBeenCalledWith(
          api.messages.getByChatId,
          { chatId, limit: 100 }
        );
        expect(result).toEqual(mockMessages);
      });

      it('should handle query errors', async () => {
        const error = new Error('Query failed');
        convexClient.query.mockRejectedValueOnce(error);

        const chatId = 'chat123' as Id<'chats'>;

        await expect(messageService.getMessages(chatId)).rejects.toThrow(
          'Query failed'
        );
      });
    });

    describe('sendMessage', () => {
      it('should send a message successfully', async () => {
        const mockMessageId = 'msg123';
        convexClient.mutation.mockResolvedValueOnce(mockMessageId);

        const chatId = 'chat123' as Id<'chats'>;
        const content = 'Test message';

        const result = await messageService.sendMessage(chatId, content);

        expect(convexClient.mutation).toHaveBeenCalledWith(api.messages.send, {
          chatId,
          content,
        });
        expect(result).toBe(mockMessageId);
      });

      it('should handle empty content', async () => {
        const chatId = 'chat123' as Id<'chats'>;

        await expect(messageService.sendMessage(chatId, '')).rejects.toThrow(
          'Content cannot be empty'
        );
      });
    });

    describe('updateMessage', () => {
      it('should update a message', async () => {
        convexClient.mutation.mockResolvedValueOnce(undefined);

        const messageId = 'msg123' as Id<'messages'>;
        const newContent = 'Updated content';

        await messageService.updateMessage(messageId, newContent);

        expect(convexClient.mutation).toHaveBeenCalledWith(
          api.messages.update,
          { messageId, content: newContent }
        );
      });
    });

    describe('deleteMessage', () => {
      it('should delete a message', async () => {
        convexClient.mutation.mockResolvedValueOnce(undefined);

        const messageId = 'msg123' as Id<'messages'>;

        await messageService.deleteMessage(messageId);

        expect(convexClient.mutation).toHaveBeenCalledWith(
          api.messages.remove,
          { messageId }
        );
      });
    });

    describe('searchMessages', () => {
      it('should search messages with query', async () => {
        const mockResults = [
          { _id: '1', content: 'Hello world', timestamp: Date.now() },
        ];

        convexClient.query.mockResolvedValueOnce(mockResults);

        const chatId = 'chat123' as Id<'chats'>;
        const query = 'world';

        const results = await messageService.searchMessages(chatId, query);

        expect(convexClient.query).toHaveBeenCalledWith(api.messages.search, {
          chatId,
          query,
        });
        expect(results).toEqual(mockResults);
      });
    });
  });

  describe('ChatService', () => {
    describe('getChats', () => {
      it('should fetch all chats', async () => {
        const mockChats = [
          { _id: 'chat1', name: 'General', createdAt: Date.now() },
          { _id: 'chat2', name: 'Random', createdAt: Date.now() },
        ];

        convexClient.query.mockResolvedValueOnce(mockChats);

        const result = await chatService.getChats();

        expect(convexClient.query).toHaveBeenCalledWith(api.chats.getAll);
        expect(result).toEqual(mockChats);
      });
    });

    describe('getChatById', () => {
      it('should fetch a specific chat', async () => {
        const mockChat = {
          _id: 'chat1',
          name: 'General',
          createdAt: Date.now(),
        };

        convexClient.query.mockResolvedValueOnce(mockChat);

        const chatId = 'chat1' as Id<'chats'>;
        const result = await chatService.getChatById(chatId);

        expect(convexClient.query).toHaveBeenCalledWith(api.chats.getById, {
          chatId,
        });
        expect(result).toEqual(mockChat);
      });

      it('should handle chat not found', async () => {
        convexClient.query.mockResolvedValueOnce(null);

        const chatId = 'nonexistent' as Id<'chats'>;
        const result = await chatService.getChatById(chatId);

        expect(result).toBeNull();
      });
    });

    describe('createChat', () => {
      it('should create a new chat', async () => {
        const mockChatId = 'chat123';
        convexClient.mutation.mockResolvedValueOnce(mockChatId);

        const name = 'New Chat';
        const description = 'A new chat room';

        const result = await chatService.createChat(name, description);

        expect(convexClient.mutation).toHaveBeenCalledWith(api.chats.create, {
          name,
          description,
        });
        expect(result).toBe(mockChatId);
      });

      it('should create chat without description', async () => {
        const mockChatId = 'chat123';
        convexClient.mutation.mockResolvedValueOnce(mockChatId);

        const result = await chatService.createChat('New Chat');

        expect(convexClient.mutation).toHaveBeenCalledWith(api.chats.create, {
          name: 'New Chat',
          description: undefined,
        });
        expect(result).toBe(mockChatId);
      });
    });

    describe('updateChat', () => {
      it('should update chat details', async () => {
        convexClient.mutation.mockResolvedValueOnce(undefined);

        const chatId = 'chat123' as Id<'chats'>;
        const updates = {
          name: 'Updated Name',
          description: 'New description',
        };

        await chatService.updateChat(chatId, updates);

        expect(convexClient.mutation).toHaveBeenCalledWith(api.chats.update, {
          chatId,
          ...updates,
        });
      });
    });

    describe('deleteChat', () => {
      it('should delete a chat', async () => {
        convexClient.mutation.mockResolvedValueOnce(undefined);

        const chatId = 'chat123' as Id<'chats'>;

        await chatService.deleteChat(chatId);

        expect(convexClient.mutation).toHaveBeenCalledWith(api.chats.remove, {
          chatId,
        });
      });
    });

    describe('archiveChat', () => {
      it('should archive a chat', async () => {
        convexClient.mutation.mockResolvedValueOnce(undefined);

        const chatId = 'chat123' as Id<'chats'>;

        await chatService.archiveChat(chatId);

        expect(convexClient.mutation).toHaveBeenCalledWith(api.chats.archive, {
          chatId,
        });
      });
    });

    describe('unarchiveChat', () => {
      it('should unarchive a chat', async () => {
        convexClient.mutation.mockResolvedValueOnce(undefined);

        const chatId = 'chat123' as Id<'chats'>;

        await chatService.unarchiveChat(chatId);

        expect(convexClient.mutation).toHaveBeenCalledWith(
          api.chats.unarchive,
          { chatId }
        );
      });
    });
  });
});
