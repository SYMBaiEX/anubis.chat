/**
 * Embedding Generation Service for RAG System
 * Handles text embedding generation using OpenAI's API
 */

import { v } from 'convex/values';
import { api } from './_generated/api';
import { action, mutation } from './_generated/server';

// OpenAI embedding model configuration
const EMBEDDING_MODEL = 'text-embedding-3-small'; // Cost-effective, high-quality embeddings
const EMBEDDING_DIMENSIONS = 1536; // Dimensions for text-embedding-3-small
const MAX_BATCH_SIZE = 100; // OpenAI's max batch size
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

/**
 * Generate embeddings for a single text input
 * Must be an action because Convex vector search requires it
 */
export const generateEmbedding = action({
  args: {
    text: v.string(),
  },
  handler: async (
    _ctx,
    args
  ): Promise<{ embedding: number[]; model: string; dimensions: number }> => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    // Clean and prepare text
    const cleanedText = args.text.trim().slice(0, 8192); // OpenAI limit

    if (!cleanedText) {
      throw new Error('Text cannot be empty');
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: EMBEDDING_MODEL,
            input: cleanedText,
            dimensions: EMBEDDING_DIMENSIONS,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(
            `OpenAI API error: ${error.error?.message || response.statusText}`
          );
        }

        const data = await response.json();
        const embedding: number[] = data.data[0].embedding;

        if (!embedding || embedding.length !== EMBEDDING_DIMENSIONS) {
          throw new Error(
            `Invalid embedding dimensions: expected ${EMBEDDING_DIMENSIONS}, got ${embedding?.length}`
          );
        }

        return {
          embedding,
          model: EMBEDDING_MODEL,
          dimensions: EMBEDDING_DIMENSIONS,
        };
      } catch (error) {
        lastError = error as Error;

        // Rate limiting - wait longer
        if (error instanceof Error && error.message.includes('429')) {
          await new Promise((resolve) =>
            setTimeout(resolve, RETRY_DELAY * 2 ** attempt)
          );
        } else if (attempt < MAX_RETRIES - 1) {
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
        }
      }
    }

    throw lastError || new Error('Failed to generate embedding after retries');
  },
});

/**
 * Generate embeddings for multiple texts in batch
 * Efficient for processing multiple messages or memories
 */
export const generateBatchEmbeddings = action({
  args: {
    texts: v.array(v.string()),
  },
  handler: async (
    _ctx,
    args
  ): Promise<
    Array<{ embedding: number[]; model: string; dimensions: number }>
  > => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    if (args.texts.length === 0) {
      return [];
    }

    // Process in batches
    const results: Array<{
      embedding: number[];
      model: string;
      dimensions: number;
    }> = [];

    for (let i = 0; i < args.texts.length; i += MAX_BATCH_SIZE) {
      const batch = args.texts.slice(i, i + MAX_BATCH_SIZE);
      const cleanedBatch = batch.map((text) => text.trim().slice(0, 8192));

      let lastError: Error | null = null;

      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          const response = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: EMBEDDING_MODEL,
              input: cleanedBatch,
              dimensions: EMBEDDING_DIMENSIONS,
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(
              `OpenAI API error: ${error.error?.message || response.statusText}`
            );
          }

          const data = await response.json();

          for (const item of data.data) {
            results.push({
              embedding: item.embedding as number[],
              model: EMBEDDING_MODEL,
              dimensions: EMBEDDING_DIMENSIONS,
            });
          }

          break; // Success, exit retry loop
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

      if (lastError && results.length < i + batch.length) {
        throw lastError;
      }

      // Small delay between batches to avoid rate limiting
      if (i + MAX_BATCH_SIZE < args.texts.length) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    return results;
  },
});

/**
 * Mutations for updating embeddings and inserting document chunks
 */
export const setMessageEmbedding = mutation({
  args: {
    messageId: v.id('messages'),
    embedding: v.array(v.number()),
  },
  handler: async (ctx, args): Promise<void> => {
    await ctx.db.patch(args.messageId, {
      embedding: args.embedding,
    });
  },
});

export const setMemoryEmbedding = mutation({
  args: {
    memoryId: v.id('memories'),
    embedding: v.array(v.number()),
  },
  handler: async (ctx, args): Promise<void> => {
    await ctx.db.patch(args.memoryId, {
      embedding: args.embedding,
      updatedAt: Date.now(),
    });
  },
});

export const insertDocumentChunk = mutation({
  args: {
    documentId: v.id('documents'),
    chunkIndex: v.number(),
    content: v.string(),
    embedding: v.array(v.number()),
    metadata: v.object({
      startOffset: v.number(),
      endOffset: v.number(),
      wordCount: v.number(),
      overlap: v.optional(v.number()),
    }),
    createdAt: v.number(),
  },
  handler: async (ctx, args): Promise<void> => {
    await ctx.db.insert('documentChunks', {
      documentId: args.documentId,
      chunkIndex: args.chunkIndex,
      content: args.content,
      embedding: args.embedding,
      metadata: args.metadata,
      createdAt: args.createdAt,
    });
  },
});

/**
 * Generate embedding for a message and prepare for storage
 */
export const generateMessageEmbedding = action({
  args: {
    messageId: v.id('messages'),
    content: v.string(),
  },
  handler: async (
    ctx,
    args
  ): Promise<{ success: true; embedding: number[] }> => {
    // Generate embedding
    const result = await ctx.runAction(api.embeddings.generateEmbedding, {
      text: args.content,
    });

    // Update message with embedding
    await ctx.runMutation(api.embeddings.setMessageEmbedding, {
      messageId: args.messageId,
      embedding: result.embedding,
    });

    return {
      success: true,
      embedding: result.embedding,
    };
  },
});

/**
 * Generate embedding for a memory entry
 */
export const generateMemoryEmbedding = action({
  args: {
    memoryId: v.id('memories'),
    content: v.string(),
  },
  handler: async (
    ctx,
    args
  ): Promise<{ success: true; embedding: number[] }> => {
    // Generate embedding
    const result = await ctx.runAction(api.embeddings.generateEmbedding, {
      text: args.content,
    });

    // Update memory with embedding
    await ctx.runMutation(api.embeddings.setMemoryEmbedding, {
      memoryId: args.memoryId,
      embedding: result.embedding,
    });

    return {
      success: true,
      embedding: result.embedding,
    };
  },
});

/**
 * Generate embeddings for document chunks
 */
export const generateDocumentChunkEmbeddings = action({
  args: {
    documentId: v.id('documents'),
    chunks: v.array(
      v.object({
        content: v.string(),
        chunkIndex: v.number(),
      })
    ),
  },
  handler: async (
    ctx,
    args
  ): Promise<{ success: true; chunksProcessed: number }> => {
    // Generate embeddings for all chunks
    const texts = args.chunks.map((chunk) => chunk.content);
    const embeddings: Array<{
      embedding: number[];
      model: string;
      dimensions: number;
    }> = await ctx.runAction(api.embeddings.generateBatchEmbeddings, { texts });

    // Store chunks with embeddings
    for (let i = 0; i < args.chunks.length; i++) {
      const chunk = args.chunks[i];
      const embedding = embeddings[i].embedding;

      await ctx.runMutation(api.embeddings.insertDocumentChunk, {
        documentId: args.documentId,
        chunkIndex: chunk.chunkIndex,
        content: chunk.content,
        embedding,
        metadata: {
          startOffset: 0, // Would be calculated based on actual document
          endOffset: chunk.content.length,
          wordCount: chunk.content.split(/\s+/).length,
        },
        createdAt: Date.now(),
      });
    }

    return {
      success: true,
      chunksProcessed: args.chunks.length,
    };
  },
});

/**
 * Calculate cosine similarity between two embeddings
 * Used for ranking search results
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Embeddings must have the same dimensions');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}
