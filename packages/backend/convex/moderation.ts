import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireAdmin, requireAuth } from './authHelpers';

export const contentSoftDelete = mutation({
  args: { kind: v.string(), id: v.string(), reason: v.optional(v.string()) },
  handler: async (ctx, { kind, id, reason }) => {
    await requireAdmin(ctx, 'admin');
    if (!['post', 'reply'].includes(kind)) throw new Error('Invalid kind');
    if (kind === 'post') {
      const post = await ctx.db.get(id as any);
      if (!post) throw new Error('Not found');
      await ctx.db.patch(id as any, { title: '[removed]', content: '[removed]', updatedAt: Date.now() });
      await ctx.db.insert('soft_deletes', { kind, targetId: id, deletedBy: (post as any).authorId, reason, createdAt: Date.now() });
    } else {
      const reply = await ctx.db.get(id as any);
      if (!reply) throw new Error('Not found');
      await ctx.db.patch(id as any, { content: '[removed]' });
      await ctx.db.insert('soft_deletes', { kind, targetId: id, deletedBy: (reply as any).authorId, reason, createdAt: Date.now() });
    }
    return { ok: true };
  },
});

export const contentRestore = mutation({
  args: { kind: v.string(), id: v.string() },
  handler: async (ctx, { kind, id }) => {
    await requireAdmin(ctx, 'admin');
    // Minimal restore: clear '[removed]' marker.
    if (kind === 'post') {
      await ctx.db.patch(id as any, { content: 'Restored', updatedAt: Date.now() });
    } else {
      await ctx.db.patch(id as any, { content: 'Restored' });
    }
    return { ok: true };
  },
});


