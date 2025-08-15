import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireAdmin, requireAuth } from './authHelpers';

export const create = mutation({
  args: {
    postId: v.optional(v.id('posts')),
    replyId: v.optional(v.id('replies')),
    reason: v.string(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, { postId, replyId, reason, note }) => {
    const { user } = await requireAuth(ctx);
    const id = await ctx.db.insert('forumFlags', {
      postId: postId as any,
      replyId: replyId as any,
      reportedBy: user._id,
      reason,
      note,
      status: 'open',
      createdAt: Date.now(),
    });
    return { id };
  },
});

export const listOpen = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query('forumFlags').collect();
    return rows.filter((r) => r.status === 'open').sort((a, b) => a.createdAt - b.createdAt);
  },
});

export const resolve = mutation({
  args: { id: v.id('forumFlags'), status: v.string() },
  handler: async (ctx, { id, status }) => {
    await requireAdmin(ctx, 'admin');
    if (!['resolved', 'dismissed'].includes(status)) throw new Error('Invalid status');
    await ctx.db.patch(id, { status, resolvedAt: Date.now() });
    return { ok: true };
  },
});


