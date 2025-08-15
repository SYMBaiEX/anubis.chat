import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireAuth } from './authHelpers';

export const list = query({
  args: { postId: v.id('posts') },
  handler: async (ctx, { postId }) => {
    return await ctx.db.query('replies').withIndex('by_post', (q) => q.eq('postId', postId)).collect();
  },
});

export const create = mutation({
  args: { postId: v.id('posts'), content: v.string() },
  handler: async (ctx, { postId, content }) => {
    const { user } = await requireAuth(ctx);
    const now = Date.now();
    const id = await ctx.db.insert('replies', {
      postId,
      authorId: user._id,
      content,
      createdAt: now,
    });
    return await ctx.db.get(id);
  },
});


