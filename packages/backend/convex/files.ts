/**
 * File Management Functions
 * Handles file uploads, storage, and retrieval
 */

import { ConvexError, v } from 'convex/values';
import type { Id } from './_generated/dataModel';
import { mutation, query } from './_generated/server';

// =============================================================================
// Queries
// =============================================================================

/**
 * List files for a wallet address
 */
export const list = query({
  args: {
    walletAddress: v.string(),
    purpose: v.optional(
      v.union(
        v.literal('assistants'),
        v.literal('vision'),
        v.literal('batch'),
        v.literal('fine-tune')
      )
    ),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { walletAddress, purpose, limit = 20, cursor } = args;

    // Build query
    let dbQuery = ctx.db
      .query('files')
      .withIndex('by_wallet', (q) => q.eq('walletAddress', walletAddress));

    // Filter by purpose if specified
    if (purpose) {
      dbQuery = dbQuery.filter((q) => q.eq(q.field('purpose'), purpose));
    }

    // Apply cursor if provided
    if (cursor) {
      try {
        const cursorId = cursor as Id<'files'>;
        const cursorDoc = await ctx.db.get(cursorId);
        if (cursorDoc) {
          dbQuery = dbQuery.filter((q) =>
            q.lt(q.field('createdAt'), cursorDoc.createdAt)
          );
        }
      } catch (_error) {
        // ignore invalid cursor
      }
    }

    // Fetch items with limit + 1 to check for more
    const items = await dbQuery.order('desc').take(limit + 1);

    // Check if there are more items
    const hasMore = items.length > limit;
    const returnItems = hasMore ? items.slice(0, limit) : items;

    // Get next cursor
    const nextCursor = hasMore ? returnItems.at(-1)?._id : undefined;

    return {
      items: returnItems,
      hasMore,
      nextCursor,
    };
  },
});

/**
 * Get a specific file
 */
export const get = query({
  args: {
    fileId: v.string(),
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const { fileId, walletAddress } = args;

    const file = await ctx.db
      .query('files')
      .withIndex('by_fileId', (q) => q.eq('fileId', fileId))
      .first();

    // Check ownership
    if (!file || file.walletAddress !== walletAddress) {
      return null;
    }

    return file;
  },
});

/**
 * Get file content (base64 encoded)
 */
export const getContent = query({
  args: {
    fileId: v.string(),
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const { fileId, walletAddress } = args;

    const file = await ctx.db
      .query('files')
      .withIndex('by_fileId', (q) => q.eq('fileId', fileId))
      .first();

    // Check ownership
    if (!file || file.walletAddress !== walletAddress) {
      throw new ConvexError('File not found or access denied');
    }

    return {
      fileId: file.fileId,
      fileName: file.fileName,
      mimeType: file.mimeType,
      data: file.data, // Base64 encoded
    };
  },
});

// =============================================================================
// Mutations
// =============================================================================

/**
 * Upload a new file
 */
export const upload = mutation({
  args: {
    walletAddress: v.string(),
    fileId: v.string(),
    fileName: v.string(),
    mimeType: v.string(),
    size: v.number(),
    hash: v.string(),
    data: v.string(), // Base64 encoded
    purpose: v.union(
      v.literal('assistants'),
      v.literal('vision'),
      v.literal('batch'),
      v.literal('fine-tune')
    ),
    description: v.optional(v.string()),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if file with same hash already exists for this user
    const existingFile = await ctx.db
      .query('files')
      .withIndex('by_hash', (q) =>
        q.eq('hash', args.hash).eq('walletAddress', args.walletAddress)
      )
      .first();

    if (existingFile) {
      // Return existing file instead of creating duplicate
      return existingFile;
    }

    // Create file record
    const fileDoc = await ctx.db.insert('files', {
      walletAddress: args.walletAddress,
      fileId: args.fileId,
      fileName: args.fileName,
      mimeType: args.mimeType,
      size: args.size,
      hash: args.hash,
      data: args.data,
      purpose: args.purpose,
      description: args.description,
      tags: args.tags,
      status: 'processed',
      createdAt: now,
      updatedAt: now,
    });

    return await ctx.db.get(fileDoc);
  },
});

/**
 * Update file metadata
 */
export const updateMetadata = mutation({
  args: {
    fileId: v.string(),
    walletAddress: v.string(),
    description: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    purpose: v.optional(
      v.union(
        v.literal('assistants'),
        v.literal('vision'),
        v.literal('batch'),
        v.literal('fine-tune')
      )
    ),
  },
  handler: async (ctx, args) => {
    const { fileId, walletAddress, ...updates } = args;

    // Get existing file
    const file = await ctx.db
      .query('files')
      .withIndex('by_fileId', (q) => q.eq('fileId', fileId))
      .first();

    // Check ownership
    if (!file || file.walletAddress !== walletAddress) {
      throw new ConvexError('File not found or access denied');
    }

    // Update file
    await ctx.db.patch(file._id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Delete a file
 */
export const deleteFile = mutation({
  args: {
    fileId: v.string(),
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const { fileId, walletAddress } = args;

    // Get existing file
    const file = await ctx.db
      .query('files')
      .withIndex('by_fileId', (q) => q.eq('fileId', fileId))
      .first();

    // Check ownership
    if (!file || file.walletAddress !== walletAddress) {
      throw new ConvexError('File not found or access denied');
    }

    // Remove file associations from vector stores
    const vectorStoreFiles = await ctx.db
      .query('vectorStoreFiles')
      .withIndex('by_file', (q) => q.eq('fileId', fileId))
      .collect();

    await Promise.all(vectorStoreFiles.map((f) => ctx.db.delete(f._id)));

    // Delete the file
    await ctx.db.delete(file._id);

    return { deleted: true, fileId };
  },
});

/**
 * Get file statistics for a user
 */
export const getStats = query({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const files = await ctx.db
      .query('files')
      .withIndex('by_wallet', (q) => q.eq('walletAddress', args.walletAddress))
      .collect();

    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const byPurpose = files.reduce(
      (acc, file) => {
        acc[file.purpose] = (acc[file.purpose] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const byType = files.reduce(
      (acc, file) => {
        const type = file.mimeType.split('/')[0];
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      totalFiles: files.length,
      totalSize,
      averageSize: files.length > 0 ? totalSize / files.length : 0,
      byPurpose,
      byType,
      recentUploads: files
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 5)
        .map((f) => ({
          fileId: f.fileId,
          fileName: f.fileName,
          size: f.size,
          createdAt: f.createdAt,
        })),
    };
  },
});
