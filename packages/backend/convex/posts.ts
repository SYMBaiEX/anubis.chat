import { paginationOptsValidator } from 'convex/server';
import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireAuth } from './authHelpers';

export const list = query({
  args: {
    category: v.string(),
    section: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, { category, section, paginationOpts }) => {
    return await ctx.db
      .query('posts')
      .withIndex('by_section', (q) =>
        q.eq('category', category).eq('section', section)
      )
      .order('desc')
      .paginate(paginationOpts);
  },
});

export const get = query({
  args: { id: v.id('posts') },
  handler: async (ctx, { id }) => ctx.db.get(id),
});

export const create = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    tags: v.optional(v.array(v.string())),
    category: v.string(),
    section: v.string(),
  },
  handler: async (ctx, { title, content, tags, category, section }) => {
    const { user } = await requireAuth(ctx);
    const now = Date.now();
    const postId = await ctx.db.insert('posts', {
      authorId: user._id,
      title,
      content,
      tags: (tags ?? []).slice(0, 16),
      category,
      section,
      views: 0,
      likes: 0,
      createdAt: now,
    });
    return await ctx.db.get(postId);
  },
});

export const like = mutation({
  args: { postId: v.id('posts') },
  handler: async (ctx, { postId }) => {
    const { user } = await requireAuth(ctx);
    const existing = await ctx.db
      .query('likes')
      .withIndex('by_post_user', (q) => q.eq('postId', postId).eq('userId', user._id))
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      const post = await ctx.db.get(postId);
      await ctx.db.patch(postId, { likes: Math.max(0, (post?.likes ?? 1) - 1) });
    } else {
      await ctx.db.insert('likes', { postId, userId: user._id, createdAt: Date.now() });
      const post = await ctx.db.get(postId);
      await ctx.db.patch(postId, { likes: (post?.likes ?? 0) + 1 });
    }
    return await ctx.db.get(postId);
  },
});

export const incrementView = mutation({
  args: { id: v.id('posts'), ident: v.string() },
  handler: async (ctx, { id, ident }) => {
    const post = await ctx.db.get(id);
    if (!post) throw new Error('Not found');
    const views = (post.views ?? 0) + 1;
    await ctx.db.patch(id, { views });

    // Update daily metrics
    const d = new Date();
    const date = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
    await ctx.db.insert('metrics_daily', {
      date,
      section: post.section,
      postId: id,
      views: 1,
      likes: 0,
      replies: 0,
    });
    return { views };
  },
});

export const listByTag = query({
  args: { tag: v.string(), paginationOpts: paginationOptsValidator },
  handler: async (ctx, { tag, paginationOpts }) => {
    const all = await ctx.db.query('posts').collect();
    const filtered = all.filter((p) => (p.tags ?? []).includes(tag));
    const start = paginationOpts.cursor ? Number(paginationOpts.cursor) : 0;
    const page = filtered.slice(start, start + paginationOpts.numItems);
    const next = start + paginationOpts.numItems < filtered.length ? String(start + paginationOpts.numItems) : null;
    return { page, isDone: next === null, continueCursor: next };
  },
});

export const listBySectionLikes = query({
  args: { category: v.string(), section: v.string(), limit: v.number() },
  handler: async (ctx, { category, section, limit }) => {
    const rows = await ctx.db
      .query('posts')
      .withIndex('by_section', (q) => q.eq('category', category).eq('section', section))
      .collect();
    return rows
      .sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0))
      .slice(0, Math.max(1, Math.min(100, limit)));
  },
});


