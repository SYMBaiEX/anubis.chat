import { v } from 'convex/values';
import { query, mutation, action } from './_generated/server';
import { api } from './_generated/api';
import { internal } from './_generated/api';

// Web App Forum Integration API
// This provides a unified interface for AI agents in the web app to interact with forum data

// Get forum posts for AI agents with advanced filtering and context
export const getForumPostsForWebApp = query({
  args: {
    // Search and filtering
    query: v.optional(v.string()),
    category: v.optional(v.string()),
    section: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    authorId: v.optional(v.id('users')),
    
    // Time filtering
    timeframe: v.optional(v.union(
      v.literal('hour'),
      v.literal('day'), 
      v.literal('week'),
      v.literal('month'),
      v.literal('all')
    )),
    
    // Sorting and pagination
    sortBy: v.optional(v.union(
      v.literal('recent'),
      v.literal('popular'),
      v.literal('trending'),
      v.literal('most_replies'),
      v.literal('most_views')
    )),
    limit: v.optional(v.number()),
    includeReplies: v.optional(v.boolean()),
    includeMetadata: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const {
      query,
      category,
      section,
      tags,
      authorId,
      timeframe = 'all',
      sortBy = 'recent',
      limit = 20,
      includeReplies = false,
      includeMetadata = true,
    } = args;

    // Get time filter
    const now = Date.now();
    let startTime = 0;
    
    switch (timeframe) {
      case 'hour':
        startTime = now - 60 * 60 * 1000;
        break;
      case 'day':
        startTime = now - 24 * 60 * 60 * 1000;
        break;
      case 'week':
        startTime = now - 7 * 24 * 60 * 60 * 1000;
        break;
      case 'month':
        startTime = now - 30 * 24 * 60 * 60 * 1000;
        break;
    }

    // Get all posts and apply filters
    let posts = await ctx.db.query('posts').collect();
    
    // Apply filters
    posts = posts.filter(post => {
      // Time filter
      if (timeframe !== 'all' && post.createdAt < startTime) return false;
      
      // Category/section filter
      if (category && post.category !== category) return false;
      if (section && post.section !== section) return false;
      
      // Author filter
      if (authorId && post.authorId !== authorId) return false;
      
      // Query filter
      if (query) {
        const searchTerm = query.toLowerCase();
        const matchesTitle = post.title.toLowerCase().includes(searchTerm);
        const matchesContent = post.content.toLowerCase().includes(searchTerm);
        const matchesTags = post.tags && post.tags.some(tag => 
          tag.toLowerCase().includes(searchTerm)
        );
        if (!matchesTitle && !matchesContent && !matchesTags) return false;
      }
      
      // Tags filter
      if (tags && tags.length > 0) {
        if (!post.tags || !tags.some(tag => 
          post.tags!.some(postTag => postTag.toLowerCase().includes(tag.toLowerCase()))
        )) return false;
      }
      
      return true;
    });

    // Sort posts
    switch (sortBy) {
      case 'popular':
        posts.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        break;
      case 'trending':
        // Trending = likes + views weighted by recency
        posts.sort((a, b) => {
          const aScore = ((a.likes || 0) + (a.views || 0)) * (1 + (now - a.createdAt) / (24 * 60 * 60 * 1000));
          const bScore = ((b.likes || 0) + (b.views || 0)) * (1 + (now - b.createdAt) / (24 * 60 * 60 * 1000));
          return bScore - aScore;
        });
        break;
      case 'most_replies':
        // We'll need to count replies for each post
        const replyCounts = new Map();
        const allReplies = await ctx.db.query('replies').collect();
        for (const reply of allReplies) {
          replyCounts.set(reply.postId, (replyCounts.get(reply.postId) || 0) + 1);
        }
        posts.sort((a, b) => (replyCounts.get(b._id) || 0) - (replyCounts.get(a._id) || 0));
        break;
      case 'most_views':
        posts.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
      case 'recent':
      default:
        posts.sort((a, b) => b.createdAt - a.createdAt);
        break;
    }

    // Limit results
    posts = posts.slice(0, limit);

    // Enrich with additional data
    const enrichedPosts = await Promise.all(
      posts.map(async (post) => {
        const author = await ctx.db.get(post.authorId);
        let replies = [];
        let replyCount = 0;
        
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
                  isAnubisAI: replyAuthor?.displayName === 'Anubis AI',
                },
              };
            })
          );
        } else {
          // Just get reply count
          const replyList = await ctx.db
            .query('replies')
            .withIndex('by_post', (q) => q.eq('postId', post._id))
            .collect();
          replyCount = replyList.length;
        }

        let metadata = {};
        if (includeMetadata) {
          // Get user reputation
          const reputation = await ctx.runQuery(api.forumEnhancements.getUserReputation, {
            userId: post.authorId,
          });
          
          metadata = {
            engagement: (post.likes || 0) + (post.views || 0) + replyCount,
            isPopular: (post.likes || 0) > 5,
            isRecent: now - post.createdAt < 24 * 60 * 60 * 1000,
            hasActiveDiscussion: replyCount > 0,
            authorReputation: reputation,
            ageInDays: Math.floor((now - post.createdAt) / (24 * 60 * 60 * 1000)),
          };
        }
        
        return {
          ...post,
          author: {
            displayName: author?.displayName || 'Anonymous',
            walletAddress: author?.walletAddress,
            avatar: author?.avatar,
          },
          replies: includeReplies ? replies : undefined,
          replyCount,
          metadata,
        };
      })
    );

    return {
      posts: enrichedPosts,
      totalFound: enrichedPosts.length,
      filters: {
        query,
        category,
        section,
        tags,
        timeframe,
        sortBy,
      },
    };
  },
});

// Get forum statistics for AI context
export const getForumStats = query({
  args: {
    timeframe: v.optional(v.union(v.literal('day'), v.literal('week'), v.literal('month'))),
  },
  handler: async (ctx, { timeframe = 'week' }) => {
    const now = Date.now();
    let startTime: number;
    
    switch (timeframe) {
      case 'day':
        startTime = now - 24 * 60 * 60 * 1000;
        break;
      case 'week':
        startTime = now - 7 * 24 * 60 * 60 * 1000;
        break;
      case 'month':
        startTime = now - 30 * 24 * 60 * 60 * 1000;
        break;
    }

    // Get posts and replies in timeframe
    const posts = await ctx.db
      .query('posts')
      .filter((q) => q.gte(q.field('createdAt'), startTime))
      .collect();
    
    const replies = await ctx.db
      .query('replies')
      .filter((q) => q.gte(q.field('createdAt'), startTime))
      .collect();

    // Calculate metrics
    const totalPosts = posts.length;
    const totalReplies = replies.length;
    const totalLikes = posts.reduce((sum, p) => sum + (p.likes || 0), 0);
    const totalViews = posts.reduce((sum, p) => sum + (p.views || 0), 0);
    
    // Get unique active users
    const activeUserIds = new Set([
      ...posts.map(p => p.authorId),
      ...replies.map(r => r.authorId),
    ]);

    // Popular categories/sections
    const categoryStats: Record<string, number> = {};
    const sectionStats: Record<string, number> = {};
    
    posts.forEach(post => {
      categoryStats[post.category] = (categoryStats[post.category] || 0) + 1;
      sectionStats[`${post.category}/${post.section}`] = 
        (sectionStats[`${post.category}/${post.section}`] || 0) + 1;
    });

    // Top contributors
    const userContributions: Record<string, number> = {};
    posts.forEach(post => {
      userContributions[post.authorId] = (userContributions[post.authorId] || 0) + 2; // Posts worth 2 points
    });
    replies.forEach(reply => {
      userContributions[reply.authorId] = (userContributions[reply.authorId] || 0) + 1; // Replies worth 1 point
    });

    const topContributors = Object.entries(userContributions)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    return {
      timeframe,
      period: { start: startTime, end: now },
      metrics: {
        totalPosts,
        totalReplies,
        totalLikes,
        totalViews,
        activeUsers: activeUserIds.size,
        avgLikesPerPost: totalPosts > 0 ? totalLikes / totalPosts : 0,
        avgRepliesPerPost: totalPosts > 0 ? totalReplies / totalPosts : 0,
        avgViewsPerPost: totalPosts > 0 ? totalViews / totalPosts : 0,
      },
      popularCategories: Object.entries(categoryStats)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([category, count]) => ({ category, posts: count })),
      popularSections: Object.entries(sectionStats)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([section, count]) => ({ section, posts: count })),
      topContributors: await Promise.all(
        topContributors.map(async ([userId, score]) => {
          const user = await ctx.db.get(userId as any);
          return {
            user: {
              displayName: user?.displayName || 'Anonymous',
              walletAddress: user?.walletAddress,
            },
            score,
          };
        })
      ),
    };
  },
});

// Create a forum post from web app AI agent
export const createPostFromWebApp = mutation({
  args: {
    userId: v.id('users'),
    agentId: v.optional(v.id('agents')),
    title: v.string(),
    content: v.string(),
    category: v.string(),
    section: v.string(),
    tags: v.optional(v.array(v.string())),
    isAIGenerated: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { userId, agentId, title, content, category, section, tags, isAIGenerated = false } = args;
    
    // Verify user exists
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // If AI generated, check credits
    if (isAIGenerated) {
      const hasCredits = await ctx.runQuery(internal.users.checkMessageCredits, { userId });
      if (!hasCredits) {
        throw new Error('Insufficient message credits for AI-generated content');
      }
      
      // Deduct credits
      await ctx.runMutation(internal.users.deductMessageCredits, { userId, amount: 1 });
    }

    // Create the post
    const postTags = tags ? [...tags] : [];
    if (isAIGenerated) {
      postTags.push('ai-generated');
    }

    const postId = await ctx.db.insert('posts', {
      authorId: userId,
      title: isAIGenerated ? `[AI] ${title}` : title,
      content: isAIGenerated ? `${content}\n\n*This post was generated by an AI agent.*` : content,
      tags: postTags,
      category,
      section,
      views: 0,
      likes: 0,
      createdAt: Date.now(),
    });

    // Log the action if from an agent
    if (agentId) {
      await ctx.db.insert('agentToolExecutions', {
        sessionId: `webapp-forum-${Date.now()}`,
        chatId: undefined as any,
        agentId,
        userId: userId as any,
        toolName: 'createForumPost',
        input: JSON.stringify({ title, content, category, section, tags }),
        output: JSON.stringify({ postId }),
        status: 'completed',
        executionTimeMs: 0,
        createdAt: Date.now(),
      });
    }

    // Update user reputation
    await ctx.runMutation(api.forumEnhancements.updateUserReputation, {
      userId,
      action: 'post_created',
      points: 5,
      reason: isAIGenerated ? 'AI-generated post created' : 'Post created',
    });

    return await ctx.db.get(postId);
  },
});

// Get forum context for AI agents (summarized information)
export const getForumContextForAI = query({
  args: {
    maxPosts: v.optional(v.number()),
    focusAreas: v.optional(v.array(v.string())), // Categories or topics to focus on
  },
  handler: async (ctx, { maxPosts = 10, focusAreas = [] }) => {
    // Get recent popular posts
    let posts = await ctx.db.query('posts').collect();
    
    // Filter by focus areas if specified
    if (focusAreas.length > 0) {
      posts = posts.filter(post => 
        focusAreas.includes(post.category) ||
        focusAreas.includes(post.section) ||
        (post.tags && post.tags.some(tag => focusAreas.includes(tag)))
      );
    }

    // Sort by engagement (likes + views + recent activity)
    const now = Date.now();
    posts.sort((a, b) => {
      const aScore = (a.likes || 0) + (a.views || 0) + (now - a.createdAt < 24 * 60 * 60 * 1000 ? 10 : 0);
      const bScore = (b.likes || 0) + (b.views || 0) + (now - b.createdAt < 24 * 60 * 60 * 1000 ? 10 : 0);
      return bScore - aScore;
    });

    posts = posts.slice(0, maxPosts);

    // Get trending topics
    const trending = await ctx.runQuery(api.forumEnhancements.getTrendingTopics, {
      timeframe: 'week',
      limit: 5,
    });

    // Get forum stats
    const stats = await ctx.runQuery(api.webAppForumIntegration.getForumStats, {
      timeframe: 'week',
    });

    // Summarize posts for AI context
    const postSummaries = await Promise.all(
      posts.map(async (post) => {
        const author = await ctx.db.get(post.authorId);
        const replyCount = await ctx.db
          .query('replies')
          .withIndex('by_post', (q) => q.eq('postId', post._id))
          .collect()
          .then(replies => replies.length);

        return {
          id: post._id,
          title: post.title,
          category: post.category,
          section: post.section,
          tags: post.tags || [],
          author: author?.displayName || 'Anonymous',
          likes: post.likes || 0,
          views: post.views || 0,
          replies: replyCount,
          createdAt: post.createdAt,
          summary: post.content.slice(0, 200) + (post.content.length > 200 ? '...' : ''),
        };
      })
    );

    return {
      recentPopularPosts: postSummaries,
      trendingTopics: trending,
      communityStats: stats,
      lastUpdated: now,
      focusAreas,
    };
  },
});
