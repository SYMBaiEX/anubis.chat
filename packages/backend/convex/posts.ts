import { paginationOptsValidator } from 'convex/server';
import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireAuth } from './authHelpers';
import { api } from './_generated/api';

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

// AI Agent Integration - Get posts for AI agents to retrieve
export const getPostsForAI = query({
  args: {
    limit: v.optional(v.number()),
    category: v.optional(v.string()),
    section: v.optional(v.string()),
    searchQuery: v.optional(v.string()),
    includeReplies: v.optional(v.boolean()),
  },
  handler: async (ctx, { limit = 50, category, section, searchQuery, includeReplies = false }) => {
    let postsQuery = ctx.db.query('posts');
    
    if (category && section) {
      postsQuery = postsQuery.withIndex('by_section', (q) => 
        q.eq('category', category).eq('section', section)
      );
    }
    
    let posts = await postsQuery.order('desc').take(limit);
    
    // Filter by search query if provided
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      posts = posts.filter(post => 
        post.title.toLowerCase().includes(query) ||
        post.content.toLowerCase().includes(query) ||
        (post.tags && post.tags.some(tag => tag.toLowerCase().includes(query)))
      );
    }
    
    // Enrich with author information
    const enrichedPosts = await Promise.all(
      posts.map(async (post) => {
        const author = await ctx.db.get(post.authorId);
        let replies = [];
        
        if (includeReplies) {
          replies = await ctx.db
            .query('replies')
            .withIndex('by_post', (q) => q.eq('postId', post._id))
            .collect();
          
          // Enrich replies with author info
          replies = await Promise.all(
            replies.map(async (reply) => {
              const replyAuthor = await ctx.db.get(reply.authorId);
              return {
                ...reply,
                author: {
                  displayName: replyAuthor?.displayName || 'Anonymous',
                  walletAddress: replyAuthor?.walletAddress,
                }
              };
            })
          );
        }
        
        return {
          ...post,
          author: {
            displayName: author?.displayName || 'Anonymous',
            walletAddress: author?.walletAddress,
          },
          replies,
          replyCount: replies.length,
        };
      })
    );
    
    return enrichedPosts;
  },
});

// Search posts with advanced filtering
export const searchPosts = query({
  args: {
    query: v.string(),
    category: v.optional(v.string()),
    section: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    authorId: v.optional(v.id('users')),
    sortBy: v.optional(v.union(v.literal('recent'), v.literal('popular'), v.literal('views'))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { query, category, section, tags, authorId, sortBy = 'recent', limit = 20 }) => {
    let posts = await ctx.db.query('posts').collect();
    
    // Apply filters
    const searchTerm = query.toLowerCase();
    posts = posts.filter(post => {
      const matchesQuery = post.title.toLowerCase().includes(searchTerm) ||
                          post.content.toLowerCase().includes(searchTerm);
      const matchesCategory = !category || post.category === category;
      const matchesSection = !section || post.section === section;
      const matchesAuthor = !authorId || post.authorId === authorId;
      const matchesTags = !tags || tags.some(tag => 
        post.tags && post.tags.some(postTag => postTag.toLowerCase().includes(tag.toLowerCase()))
      );
      
      return matchesQuery && matchesCategory && matchesSection && matchesAuthor && matchesTags;
    });
    
    // Sort posts
    switch (sortBy) {
      case 'popular':
        posts.sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0));
        break;
      case 'views':
        posts.sort((a, b) => (b.views ?? 0) - (a.views ?? 0));
        break;
      case 'recent':
      default:
        posts.sort((a, b) => b.createdAt - a.createdAt);
        break;
    }
    
    return posts.slice(0, limit);
  },
});


