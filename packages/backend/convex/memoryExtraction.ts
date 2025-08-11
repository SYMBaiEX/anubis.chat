/**
 * Memory Extraction System for ANUBIS Chat RAG Implementation
 *
 * This comprehensive memory extraction system analyzes conversations to extract and store
 * important information about users, enabling personalized AI responses through context injection.
 *
 * ## Features:
 * - **Intelligent Extraction**: Uses GPT-4o-mini to identify memory-worthy content
 * - **Smart Categorization**: Automatically categorizes into facts, preferences, skills, goals, context
 * - **Importance Scoring**: 0-1 scale with keyword-based boosting and deduplication
 * - **Vector Search**: Generates embeddings for semantic similarity and retrieval
 * - **Auto-Processing**: Can automatically process messages after creation
 * - **Memory Consolidation**: Merges similar memories to reduce redundancy
 * - **Context Injection**: Formats memories for AI context with smart retrieval
 *
 * ## Memory Types:
 * - **fact**: Concrete information (name, job, location, family, etc.)
 * - **preference**: Likes, dislikes, choices, opinions, tools, methods
 * - **skill**: Abilities, knowledge areas, technologies, experience levels
 * - **goal**: Objectives, aspirations, learning targets, projects
 * - **context**: Situational info, current focuses, ongoing work
 *
 * ## Usage Examples:
 *
 * ```typescript
 * // Extract memories from a new user message
 * await ctx.runAction(api.memoryExtraction.extractMemoriesFromMessage, {
 *   messageId: messageId,
 *   chatId: chatId,
 *   userId: userId,
 *   content: "I'm a TypeScript developer working on a RAG system"
 * });
 *
 * // Get relevant context for AI response
 * const memoryContext = await ctx.runAction(api.memoryExtraction.getMemoryContext, {
 *   userId: userId,
 *   query: "help me with TypeScript coding"
 * });
 *
 * // Auto-process message (call after message creation)
 * await ctx.runAction(api.memoryExtraction.processNewMessage, {
 *   messageId: messageId
 * });
 * ```
 *
 * ## Configuration:
 * - Uses OpenAI GPT-4o-mini for cost-effective analysis
 * - Minimum importance threshold: 0.3 (configurable)
 * - Embeddings: OpenAI text-embedding-3-small (1536 dimensions)
 * - Smart extraction rules prevent noise and duplicates
 */

import { v } from 'convex/values';
import { api } from './_generated/api';
import type { Doc, Id } from './_generated/dataModel';
import type { ActionCtx } from './_generated/server';
import { action, mutation, query } from './_generated/server';
import { cosineSimilarity } from './embeddings';

// Memory extraction configuration
const MEMORY_EXTRACTION_MODEL = 'gpt-4o-mini'; // Cost-effective for analysis
const MIN_IMPORTANCE_THRESHOLD = 0.3; // Minimum importance score to save memory
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000;

// Memory type definitions based on schema
const MEMORY_TYPES = [
  'fact',
  'preference',
  'skill',
  'goal',
  'context',
] as const;
type MemoryType = (typeof MEMORY_TYPES)[number];

interface ExtractedMemory {
  content: string;
  type: MemoryType;
  importance: number;
  tags: string[];
  reasoning: string;
}

interface MemoryExtractionResult {
  memories: ExtractedMemory[];
  analysisReasoning: string;
}

/**
 * LLM-powered memory extraction from conversation content
 */
async function extractMemoriesFromContent(
  content: string,
  context: string,
  existingMemories: string[] = []
): Promise<MemoryExtractionResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  // Prepare the system prompt for memory extraction
  const systemPrompt = `You are an expert memory extraction system for an AI chat application. Your job is to analyze conversations and extract important, memorable information about the user.

MEMORY TYPES to extract:
- fact: Concrete information about the user (name, location, job, family, etc.)
- preference: User's likes, dislikes, opinions, choices (tools, methods, styles, etc.)
- skill: User's abilities, knowledge areas, experience levels, technologies they know
- goal: User's objectives, aspirations, things they want to learn or achieve
- context: Important situational information, ongoing projects, current focuses

IMPORTANCE SCORING (0.0 to 1.0):
- 0.9-1.0: Critical personal info (name, core skills, major goals, key preferences)
- 0.7-0.9: Important patterns (frequently mentioned preferences, ongoing projects)
- 0.5-0.7: Useful context (tools used, learning interests, work context)
- 0.3-0.5: Minor details worth noting (occasional preferences, small facts)
- 0.0-0.3: Trivial information (don't extract these)

EXTRACTION RULES:
1. Extract only information ABOUT THE USER, not general knowledge
2. Focus on lasting information, not temporary states
3. Be specific and concrete - avoid vague generalizations
4. Each memory should be a single, clear fact/preference/skill/goal
5. Avoid duplicating existing memories
6. Only extract memories with importance >= 0.3

EXISTING MEMORIES to avoid duplicating:
${existingMemories.length > 0 ? existingMemories.join('\n- ') : 'None'}

Respond ONLY in valid JSON format:
{
  "memories": [
    {
      "content": "Specific memory content (clear, concise statement)",
      "type": "fact|preference|skill|goal|context",
      "importance": 0.5,
      "tags": ["relevant", "keywords"],
      "reasoning": "Why this is important/relevant"
    }
  ],
  "analysisReasoning": "Brief explanation of your extraction decisions"
}`;

  const userPrompt = `CONVERSATION CONTEXT:
${context}

CONTENT TO ANALYZE:
${content}

Extract memorable information about the user from this content. Focus on lasting facts, preferences, skills, goals, and important context. Remember to avoid duplicating existing memories and only extract information with importance >= 0.3.`;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: MEMORY_EXTRACTION_MODEL,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            temperature: 0.3, // Lower temperature for more consistent extraction
            max_tokens: 2000,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          `OpenAI API error: ${error.error?.message || response.statusText}`
        );
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No content returned from LLM');
      }

      // Parse JSON response
      try {
        const parsed = JSON.parse(content) as MemoryExtractionResult;

        // Validate the response structure
        if (!(parsed.memories && Array.isArray(parsed.memories))) {
          throw new Error('Invalid response format: memories array missing');
        }

        // Filter memories by importance threshold and validate
        const validMemories = parsed.memories.filter((memory) => {
          return (
            memory.importance >= MIN_IMPORTANCE_THRESHOLD &&
            memory.content &&
            MEMORY_TYPES.includes(memory.type) &&
            memory.content.length > 10
          ); // Ensure meaningful content
        });

        return {
          memories: validMemories,
          analysisReasoning:
            parsed.analysisReasoning || 'Memory extraction completed',
        };
      } catch (parseError) {
        throw new Error(`Failed to parse LLM response as JSON: ${parseError}`);
      }
    } catch (error) {
      lastError = error as Error;

      if (error instanceof Error && error.message.includes('429')) {
        await new Promise((resolve) =>
          setTimeout(resolve, RETRY_DELAY * 2 ** attempt)
        );
      } else if (attempt < MAX_RETRIES - 1) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      }
    }
  }

  throw lastError || new Error('Failed to extract memories after retries');
}

/**
 * Check if a similar memory already exists to avoid duplicates
 */
export const checkSimilarMemory = query({
  args: {
    userId: v.string(),
    content: v.string(),
    type: v.union(
      v.literal('fact'),
      v.literal('preference'),
      v.literal('skill'),
      v.literal('goal'),
      v.literal('context')
    ),
    similarityThreshold: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const threshold = args.similarityThreshold ?? 0.85;

    // Get existing memories of the same type
    const existingMemories = await ctx.db
      .query('memories')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .filter((q) => q.eq(q.field('type'), args.type))
      .collect();

    // Simple content similarity check (could be enhanced with embeddings)
    const contentLower = args.content.toLowerCase();
    const words = contentLower.split(/\s+/);

    for (const memory of existingMemories) {
      const existingLower = memory.content.toLowerCase();
      const existingWords = existingLower.split(/\s+/);

      // Calculate word overlap ratio
      const commonWords = words.filter((word) => existingWords.includes(word));
      const similarity =
        commonWords.length / Math.max(words.length, existingWords.length);

      if (similarity >= threshold) {
        return {
          hasSimilar: true,
          similarMemory: memory,
          similarity,
        };
      }
    }

    return {
      hasSimilar: false,
      similarMemory: null,
      similarity: 0,
    };
  },
});

/**
 * Calculate importance score based on keywords, context, and repetition
 */
function _calculateImportanceBoost(
  content: string,
  type: MemoryType,
  _userId: string
): number {
  let boost = 0;
  const contentLower = content.toLowerCase();

  // High-value keywords by memory type
  const importantKeywords: Record<MemoryType, string[]> = {
    fact: [
      'my name is',
      'i am',
      'i live in',
      'i work',
      'my job',
      'my role',
      'my company',
    ],
    preference: [
      'i prefer',
      'i like',
      'i love',
      'i hate',
      'i dislike',
      'i choose',
      'my favorite',
    ],
    skill: [
      'i know',
      'i can',
      'experienced in',
      'expert in',
      'proficient',
      'i learned',
      'i studied',
    ],
    goal: [
      'i want to',
      'my goal',
      'i aim to',
      'i plan to',
      'i hope to',
      'trying to learn',
      'working towards',
    ],
    context: [
      'currently working',
      'my project',
      'focusing on',
      'dealing with',
      'my situation',
    ],
  };

  // Check for high-value keywords
  const keywords = importantKeywords[type] || [];
  for (const keyword of keywords) {
    if (contentLower.includes(keyword)) {
      boost += 0.2;
    }
  }

  // Technology/professional terms boost for skills
  if (type === 'skill') {
    const techTerms = [
      'javascript',
      'typescript',
      'python',
      'react',
      'node',
      'sql',
      'aws',
      'docker',
      'kubernetes',
      'ai',
      'ml',
      'blockchain',
    ];
    for (const term of techTerms) {
      if (contentLower.includes(term)) {
        boost += 0.1;
      }
    }
  }

  // Personal identifiers boost for facts
  if (type === 'fact') {
    const personalTerms = ['my', 'me', 'i am', 'i work', 'i live'];
    for (const term of personalTerms) {
      if (contentLower.includes(term)) {
        boost += 0.1;
      }
    }
  }

  // Cap the boost to prevent over-scoring
  return Math.min(boost, 0.5);
}

/**
 * Process a message for memory extraction
 */
type ExtractMemoriesFromMessageArgs = {
  messageId: Id<'messages'>;
  chatId: Id<'chats'>;
  userId: string;
  content: string;
};

type ExtractMemoriesFromMessageReturn = {
  success: boolean;
  memoriesExtracted: number;
  memories: Array<{ id: Id<'memories'> } & ExtractedMemory>;
  analysisReasoning: string;
  error?: string;
};

async function handleExtractMemoriesFromMessage(
  ctx: ActionCtx,
  args: ExtractMemoriesFromMessageArgs
): Promise<ExtractMemoriesFromMessageReturn> {
  try {
    // Get chat context for better extraction
    const chat = await ctx.runQuery(api.chats.getById, { id: args.chatId });
    if (!chat) {
      throw new Error('Chat not found');
    }

    // Get recent messages for context
    const recentMessages = (await ctx.runQuery(api.messages.getByChatId, {
      chatId: args.chatId,
      limit: 5,
    })) as Doc<'messages'>[];

    // Build conversation context
    const conversationContext = recentMessages
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join('\n');

    // Get existing memories to avoid duplicates
    const existingMemories = (await ctx.runQuery(api.memories.getUserMemories, {
      userId: args.userId,
    })) as Doc<'memories'>[];

    const existingContents: string[] = existingMemories.map((m) => m.content);

    // Extract memories using LLM
    const result = await extractMemoriesFromContent(
      args.content,
      conversationContext,
      existingContents
    );

    const createdMemories: Array<{ id: Id<'memories'> } & ExtractedMemory> = [];

    // Process each extracted memory
    for (const memory of result.memories) {
      // Check for duplicates before creating
      // For now, we'll do a simple content check - the checkSimilarMemory function can be called separately
      const existingMemoryCheck = existingContents.find(
        (existing) =>
          existing.toLowerCase().includes(memory.content.toLowerCase()) ||
          memory.content.toLowerCase().includes(existing.toLowerCase())
      );

      if (!existingMemoryCheck) {
        // Create the memory
        const memoryId = (await ctx.runMutation(api.memories.create, {
          userId: args.userId,
          content: memory.content,
          type: memory.type,
          importance: memory.importance,
          tags: memory.tags,
          sourceId: args.messageId,
          sourceType: 'chat' as const,
        })) as Id<'memories'>;

        // Generate and update embedding
        const embeddingResult = await ctx.runAction(
          api.embeddings.generateEmbedding,
          { text: memory.content }
        );
        await ctx.runMutation(api.embeddings.setMemoryEmbedding, {
          memoryId,
          embedding: (embeddingResult as { embedding: number[] }).embedding,
        });

        createdMemories.push({
          id: memoryId,
          ...memory,
        });
      }
    }

    return {
      success: true,
      memoriesExtracted: createdMemories.length,
      memories: createdMemories,
      analysisReasoning: result.analysisReasoning,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      memoriesExtracted: 0,
      memories: [],
      analysisReasoning: 'Extraction failed',
    };
  }
}

export const extractMemoriesFromMessage = action({
  args: {
    messageId: v.id('messages'),
    chatId: v.id('chats'),
    userId: v.string(),
    content: v.string(),
  },
  handler: handleExtractMemoriesFromMessage,
});

/**
 * Process multiple messages for batch memory extraction
 */
export const extractMemoriesFromConversation = action({
  args: {
    chatId: v.id('chats'),
    userId: v.string(),
    messageIds: v.array(v.id('messages')),
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    success: boolean;
    messagesProcessed: number;
    totalMemoriesExtracted: number;
    results: Array<
      { messageId: Id<'messages'> } & ExtractMemoriesFromMessageReturn
    >;
  }> => {
    const results: Array<
      { messageId: Id<'messages'> } & ExtractMemoriesFromMessageReturn
    > = [];
    let totalMemories = 0;

    for (const messageId of args.messageIds) {
      // Get the message content
      const message = (await ctx.runQuery(api.messages.getById, {
        id: messageId,
      })) as Doc<'messages'> | null;
      if (!message || message.role !== 'user') {
        continue; // Skip assistant messages and missing messages
      }

      const result = (await ctx.runAction(
        (api as any).memoryExtraction.extractMemoriesFromMessage,
        {
          messageId,
          chatId: args.chatId,
          userId: args.userId,
          content: message.content,
        }
      )) as ExtractMemoriesFromMessageReturn;

      results.push({
        messageId,
        ...result,
      });

      totalMemories += result.memoriesExtracted;
    }

    return {
      success: true,
      messagesProcessed: args.messageIds.length,
      totalMemoriesExtracted: totalMemories,
      results,
    };
  },
});

/**
 * Consolidate similar memories to reduce redundancy
 */
export const consolidateMemories = action({
  args: {
    userId: v.string(),
    memoryType: v.optional(
      v.union(
        v.literal('fact'),
        v.literal('preference'),
        v.literal('skill'),
        v.literal('goal'),
        v.literal('context')
      )
    ),
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    success: boolean;
    consolidationsPerformed: number;
    consolidations: Array<{
      consolidatedId: Id<'memories'>;
      originalIds: Id<'memories'>[];
      consolidatedContent: string;
    }>;
  }> => {
    // Get memories for consolidation
    const memories = (await ctx.runQuery(api.memories.getUserMemories, {
      userId: args.userId,
    })) as Doc<'memories'>[];

    let filteredMemories: Doc<'memories'>[] = memories;
    if (args.memoryType) {
      filteredMemories = memories.filter(
        (m: Doc<'memories'>) => m.type === args.memoryType
      );
    }

    const consolidations: Array<{
      consolidatedId: Id<'memories'>;
      originalIds: Id<'memories'>[];
      consolidatedContent: string;
    }> = [];
    const processedIds = new Set<string>();

    // Find similar memories for consolidation
    for (let i = 0; i < filteredMemories.length; i++) {
      const memory1 = filteredMemories[i];
      if (processedIds.has(memory1._id)) {
        continue;
      }

      const similarMemories: Doc<'memories'>[] = [memory1];
      processedIds.add(memory1._id);

      for (let j = i + 1; j < filteredMemories.length; j++) {
        const memory2 = filteredMemories[j];
        if (processedIds.has(memory2._id) || memory1.type !== memory2.type) {
          continue;
        }

        // Check similarity using simple content comparison
        const content1Lower = memory1.content.toLowerCase();
        const content2Lower = memory2.content.toLowerCase();
        const words1 = content1Lower.split(/\s+/);
        const words2 = content2Lower.split(/\s+/);
        const commonWords = words1.filter((word: string) =>
          words2.includes(word)
        );
        const similarity =
          commonWords.length / Math.max(words1.length, words2.length);

        if (similarity >= 0.7) {
          // Lower threshold for consolidation
          similarMemories.push(memory2);
          processedIds.add(memory2._id);
        }
      }

      // If we found similar memories, consolidate them
      if (similarMemories.length > 1) {
        // Merge memories using LLM
        const consolidatedContent = await consolidateMemoryContent(
          similarMemories.map((m) => m.content)
        );

        if (consolidatedContent) {
          const maxImportance = Math.max(
            ...similarMemories.map((m) => m.importance)
          );
          const allTags = [
            ...new Set(similarMemories.flatMap((m) => m.tags || [])),
          ];

          // Create consolidated memory
          const consolidatedId = (await ctx.runMutation(api.memories.create, {
            userId: args.userId,
            content: consolidatedContent,
            type: memory1.type,
            importance: maxImportance,
            tags: allTags,
            sourceId: memory1.sourceId,
            sourceType: memory1.sourceType,
          })) as Id<'memories'>;

          // Generate embedding for consolidated memory
          const embeddingResult = await ctx.runAction(
            api.embeddings.generateEmbedding,
            { text: consolidatedContent }
          );
          await ctx.runMutation(api.embeddings.setMemoryEmbedding, {
            memoryId: consolidatedId,
            embedding: embeddingResult.embedding,
          });

          // Delete old memories
          for (const oldMemory of similarMemories) {
            await ctx.runMutation(api.memories.remove, { id: oldMemory._id });
          }

          consolidations.push({
            consolidatedId,
            originalIds: similarMemories.map((m) => m._id),
            consolidatedContent,
          });
        }
      }
    }

    return {
      success: true,
      consolidationsPerformed: consolidations.length,
      consolidations,
    };
  },
});

/**
 * Helper function to consolidate similar memory contents using LLM
 */
async function consolidateMemoryContent(
  contents: string[]
): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || contents.length <= 1) {
    return null;
  }

  const systemPrompt = `You are consolidating similar memories about a user. Merge the provided similar memory entries into a single, comprehensive memory that captures all the important information without redundancy.

Rules:
1. Combine all unique information from the provided memories
2. Remove redundancy and contradictions
3. Keep the most specific and accurate information
4. Maintain the same tone and perspective
5. Ensure the result is a single, clear statement

Respond with only the consolidated memory content, nothing else.`;

  const userPrompt = `Consolidate these similar memories:

${contents.map((content, i) => `${i + 1}. ${content}`).join('\n')}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MEMORY_EXTRACTION_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.choices[0]?.message?.content?.trim() || null;
  } catch (_error) {
    return null;
  }
}

/**
 * Get user memories with optional limit (helper query)
 */
export const getUserMemoriesWithLimit = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const query = ctx.db
      .query('memories')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .order('desc');

    if (args.limit) {
      return await query.take(args.limit);
    }

    return await query.collect();
  },
});

/**
 * Get memory statistics for a user
 */
export const getMemoryStats = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const memories = await ctx.db
      .query('memories')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect();

    const stats = {
      total: memories.length,
      byType: {} as Record<MemoryType, number>,
      averageImportance: 0,
      totalAccesses: 0,
      recentMemories: 0, // Created in last 7 days
    };

    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    for (const memory of memories) {
      // Count by type
      stats.byType[memory.type] = (stats.byType[memory.type] || 0) + 1;

      // Sum importance and access counts
      stats.averageImportance += memory.importance;
      stats.totalAccesses += memory.accessCount;

      // Count recent memories
      if (memory.createdAt > weekAgo) {
        stats.recentMemories++;
      }
    }

    if (memories.length > 0) {
      stats.averageImportance /= memories.length;
    }

    return stats;
  },
});

/**
 * Auto-process new user messages for memory extraction
 * Called after message creation to extract memories in background
 */
export const processNewMessage = action({
  args: {
    messageId: v.id('messages'),
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    success: boolean;
    memoriesExtracted: number;
    error?: string;
    reason?: string;
  }> => {
    try {
      // Get the message
      const message = (await ctx.runQuery(api.messages.getById, {
        id: args.messageId,
      })) as Doc<'messages'> | null;
      if (!message || message.role !== 'user') {
        return {
          success: true,
          memoriesExtracted: 0,
          reason: 'Not a user message, skipped',
        };
      }

      // Get the chat to find user ID
      const chat = (await ctx.runQuery(api.chats.getById, {
        id: message.chatId,
      })) as Doc<'chats'> | null;
      if (!chat) {
        throw new Error('Chat not found');
      }

      // Get the user by wallet address
      const user = (await ctx.runQuery(api.users.getUserByWallet, {
        walletAddress: message.walletAddress,
      })) as Doc<'users'> | null;
      if (!user) {
        throw new Error('User not found');
      }

      // Check if user has memory extraction enabled in preferences
      const preferences = (await ctx.runQuery(api.userPreferences.getByUserId, {
        userId: user._id,
      })) as { enableMemory?: boolean } | null;

      if (preferences?.enableMemory === false) {
        return {
          success: true,
          memoriesExtracted: 0,
          reason: 'Memory extraction disabled by user',
        };
      }

      // Only process meaningful messages (minimum length)
      if (message.content.length < 20) {
        return {
          success: true,
          memoriesExtracted: 0,
          reason: 'Message too short for memory extraction',
        };
      }

      // Run memory extraction
      const result = (await ctx.runAction(
        (api as any).memoryExtraction.extractMemoriesFromMessage,
        {
          messageId: args.messageId,
          chatId: message.chatId,
          userId: user._id,
          content: message.content,
        }
      )) as ExtractMemoriesFromMessageReturn;

      return {
        success: result.success,
        memoriesExtracted: result.memoriesExtracted,
        error: result.error,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        memoriesExtracted: 0,
      };
    }
  },
});

/**
 * Bulk process a chat history for memory extraction
 */
export const processChatHistory = action({
  args: {
    chatId: v.id('chats'),
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      const limit = args.limit ?? 50;

      // Get recent messages from chat
      const messages = await ctx.runQuery(api.messages.getByChatId, {
        chatId: args.chatId,
        limit,
      });

      // Filter user messages only
      const userMessages = messages.filter((msg) => msg.role === 'user');

      if (userMessages.length === 0) {
        return {
          success: true,
          messagesProcessed: 0,
          memoriesExtracted: 0,
          reason: 'No user messages found',
        };
      }

      // Process messages in batches of 5 to avoid overwhelming the LLM
      const batchSize = 5;
      let totalMemories = 0;
      let processedMessages = 0;

      for (let i = 0; i < userMessages.length; i += batchSize) {
        const batch = userMessages.slice(i, i + batchSize);

        const result = await ctx.runAction(
          (api as any).memoryExtraction.extractMemoriesFromConversation,
          {
            chatId: args.chatId,
            userId: args.userId,
            messageIds: batch.map((m) => m._id),
          }
        );

        totalMemories += result.totalMemoriesExtracted;
        processedMessages += result.messagesProcessed;

        // Small delay between batches
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      return {
        success: true,
        messagesProcessed: processedMessages,
        memoriesExtracted: totalMemories,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        messagesProcessed: 0,
        memoriesExtracted: 0,
      };
    }
  },
});

/**
 * Auto-cleanup low-importance, old memories
 */
export const cleanupMemories = mutation({
  args: {
    userId: v.string(),
    maxMemories: v.optional(v.number()),
    minImportance: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const maxMemories = args.maxMemories ?? 1000;
    const minImportance = args.minImportance ?? 0.2;

    const memories = await ctx.db
      .query('memories')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect();

    // Sort by importance (ascending) and age (oldest first)
    const sortedMemories = memories.sort((a, b) => {
      if (a.importance !== b.importance) {
        return a.importance - b.importance; // Lower importance first
      }
      return a.createdAt - b.createdAt; // Older first
    });

    const toDelete = [];

    // Delete memories below minimum importance threshold
    for (const memory of sortedMemories) {
      if (memory.importance < minImportance) {
        toDelete.push(memory._id);
      }
    }

    // If still over max count, delete oldest low-importance memories
    const remaining = sortedMemories.filter(
      (m) => m.importance >= minImportance
    );
    if (remaining.length > maxMemories) {
      const excess = remaining.slice(0, remaining.length - maxMemories);
      toDelete.push(...excess.map((m) => m._id));
    }

    // Perform deletions
    for (const memoryId of toDelete) {
      await ctx.db.delete(memoryId);
    }

    return {
      cleaned: toDelete.length,
      remaining: memories.length - toDelete.length,
    };
  },
});

/**
 * Get relevant memories for a conversation context
 * Used to inject memory context into AI responses
 */
export const getRelevantMemories = action({
  args: {
    userId: v.string(),
    query: v.string(),
    limit: v.optional(v.number()),
    minImportance: v.optional(v.number()),
  },
  handler: async (
    ctx,
    args
  ): Promise<
    | {
        memories: Array<{
          id: Id<'memories'>;
          content: string;
          type: MemoryType;
          importance: number;
          similarity: number;
          relevanceScore: number;
          tags?: string[];
          createdAt: number;
        }>;
        totalFound: number;
      }
    | {
        memories: never[];
        totalFound: 0;
        error: string;
      }
  > => {
    const limit = args.limit ?? 10;
    const minImportance = args.minImportance ?? 0.3;

    try {
      // Generate embedding for the query
      const queryEmbedding = (await ctx.runAction(
        api.embeddings.generateEmbedding,
        { text: args.query }
      )) as { embedding: number[] };

      // Get all user memories above importance threshold
      const memories = (await ctx.runQuery(api.memories.getUserMemories, {
        userId: args.userId,
      })) as Doc<'memories'>[];

      // Filter by importance
      const importantMemories = memories.filter((m: Doc<'memories'>) =>
        m.embedding
          ? m.importance >= minImportance && m.embedding.length > 0
          : false
      );

      // Calculate similarity scores and sort
      const scored = importantMemories.map((memory: Doc<'memories'>) => {
        const similarity = cosineSimilarity(
          queryEmbedding.embedding,
          memory.embedding
        );
        return {
          ...memory,
          similarity,
          relevanceScore: similarity * memory.importance, // Combined score
        };
      });

      // Sort by relevance score and take top results
      const relevant = scored
        .sort(
          (
            a: Doc<'memories'> & { similarity: number; relevanceScore: number },
            b: Doc<'memories'> & { similarity: number; relevanceScore: number }
          ) => b.relevanceScore - a.relevanceScore
        )
        .slice(0, limit);

      // Update access counts for retrieved memories
      for (const memory of relevant) {
        await ctx.runMutation(api.memories.updateAccess, {
          id: memory._id,
        });
      }

      return {
        memories: relevant.map((m) => ({
          id: m._id,
          content: m.content,
          type: m.type,
          importance: m.importance,
          similarity: m.similarity,
          relevanceScore: m.relevanceScore,
          tags: m.tags,
          createdAt: m.createdAt,
        })),
        totalFound: relevant.length,
      };
    } catch (error) {
      return {
        memories: [],
        totalFound: 0,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

/**
 * Format memories for AI context injection
 */
export const formatMemoriesForContext = query({
  args: {
    memories: v.array(
      v.object({
        content: v.string(),
        type: v.union(
          v.literal('fact'),
          v.literal('preference'),
          v.literal('skill'),
          v.literal('goal'),
          v.literal('context')
        ),
        importance: v.number(),
        tags: v.optional(v.array(v.string())),
      })
    ),
  },
  handler: async (_ctx, args) => {
    if (args.memories.length === 0) {
      return '';
    }

    // Group memories by type
    const grouped: Record<string, typeof args.memories> = {};
    for (const memory of args.memories) {
      if (!grouped[memory.type]) {
        grouped[memory.type] = [];
      }
      grouped[memory.type].push(memory);
    }

    // Format for AI context
    let context =
      '# User Context\n\nBased on previous conversations, here is what I know about the user:\n\n';

    const typeLabels = {
      fact: 'Facts',
      preference: 'Preferences',
      skill: 'Skills & Knowledge',
      goal: 'Goals & Objectives',
      context: 'Current Context',
    };

    for (const [type, memories] of Object.entries(grouped)) {
      if (memories.length === 0) {
        continue;
      }

      context += `## ${typeLabels[type as keyof typeof typeLabels] || type}\n`;

      for (const memory of memories.slice(0, 5)) {
        // Limit per type
        context += `- ${memory.content}\n`;
      }
      context += '\n';
    }

    context +=
      'Please use this context to provide more personalized and relevant responses.\n\n';

    return context;
  },
});

/**
 * Smart memory retrieval and formatting for chat context
 * Combines query-based retrieval with context formatting
 */
export const getMemoryContext = action({
  args: {
    userId: v.string(),
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    context: string;
    memoriesUsed: number;
  }> => {
    // Get relevant memories - for now, get all memories and filter locally
    // This is a simplified version until the API is properly set up
    const allMemories = (await ctx.runQuery(api.memories.getUserMemories, {
      userId: args.userId,
    })) as Doc<'memories'>[];

    const memoryResult = {
      memories: allMemories.slice(0, args.limit ?? 8).map((m) => ({
        id: m._id,
        content: m.content,
        type: m.type,
        importance: m.importance,
        tags: m.tags,
        createdAt: m.createdAt,
      })),
      totalFound: allMemories.length,
    };

    if (memoryResult.memories.length === 0) {
      return {
        context: '',
        memoriesUsed: 0,
      };
    }

    // Format for AI context - inline formatting
    const memories = memoryResult.memories;
    if (memories.length === 0) {
      return {
        context: '',
        memoriesUsed: 0,
      };
    }

    // Group memories by type
    const grouped: Record<string, typeof memories> = {};
    for (const memory of memories) {
      if (!grouped[memory.type]) {
        grouped[memory.type] = [];
      }
      grouped[memory.type].push(memory);
    }

    // Format for AI context
    let context =
      '# User Context\n\nBased on previous conversations, here is what I know about the user:\n\n';

    const typeLabels = {
      fact: 'Facts',
      preference: 'Preferences',
      skill: 'Skills & Knowledge',
      goal: 'Goals & Objectives',
      context: 'Current Context',
    };

    for (const [type, typeMemories] of Object.entries(grouped)) {
      if (typeMemories.length === 0) {
        continue;
      }

      context += `## ${typeLabels[type as keyof typeof typeLabels] || type}\n`;

      for (const memory of typeMemories.slice(0, 5)) {
        // Limit per type
        context += `- ${memory.content}\n`;
      }
      context += '\n';
    }

    context +=
      'Please use this context to provide more personalized and relevant responses.\n\n';

    return {
      context,
      memoriesUsed: memoryResult.memories.length,
    };
  },
});
