import { v } from 'convex/values';
import { action, mutation, query } from './_generated/server';
import { api } from './_generated/api';
import { internal } from './_generated/api';

// Generate AI response for forum @anubis mentions
export const generateForumResponse = action({
  args: {
    context: v.object({
      postTitle: v.string(),
      postContent: v.string(),
      userMessage: v.string(),
      userName: v.string(),
    }),
    userId: v.id('users'),
  },
  handler: async (ctx, { context, userId }) => {
    try {
      // Get user preferences and subscription info
      const user = await ctx.runQuery(api.users.getUserById, { userId });
      if (!user) {
        throw new Error('User not found');
      }

      // Prepare system prompt for forum context
      const systemPrompt = `You are Anubis AI, a helpful assistant integrated into the Anubis.chat community forum. 
      
You are responding to a user mention (@anubis) in a forum discussion. Here's the context:
- Post Title: "${context.postTitle}"
- Post Content: "${context.postContent}"
- User's Message: "${context.userMessage}"
- User's Name: ${context.userName}

Guidelines:
1. Be helpful, concise, and relevant to the forum discussion
2. Address the user by name when appropriate
3. Stay on topic and provide valuable insights
4. If the question is about Anubis.chat features, explain them clearly
5. If it's a technical question, provide accurate information
6. Keep responses conversational and community-friendly
7. If you need more context, ask clarifying questions

Respond as Anubis AI in a natural, helpful manner.`;

      // Use the existing AI system to generate response
      const response = await ctx.runAction(internal.agents.generateResponse, {
        prompt: context.userMessage,
        systemPrompt,
        userId,
        model: user.preferences?.aiModel || 'gpt-4o-mini',
        temperature: 0.7,
        maxTokens: 500,
      });

      return response;
    } catch (error) {
      console.error('Error generating forum AI response:', error);
      return "I apologize, but I'm having trouble generating a response right now. Please try again in a moment.";
    }
  },
});

// Get forum posts for AI agents to analyze and retrieve
export const getForumPostsForAgent = query({
  args: {
    agentId: v.optional(v.id('agents')),
    query: v.optional(v.string()),
    category: v.optional(v.string()),
    section: v.optional(v.string()),
    limit: v.optional(v.number()),
    includeReplies: v.optional(v.boolean()),
  },
  handler: async (ctx, { agentId, query, category, section, limit = 20, includeReplies = false }) => {
    // Use the existing posts query with AI-specific enhancements
    const posts = await ctx.runQuery(api.posts.getPostsForAI, {
      limit,
      category,
      section,
      searchQuery: query,
      includeReplies,
    });

    // Add metadata useful for AI agents
    const enrichedPosts = posts.map(post => ({
      ...post,
      metadata: {
        engagement: (post.likes || 0) + (post.views || 0) + (post.replyCount || 0),
        isPopular: (post.likes || 0) > 5,
        isRecent: Date.now() - post.createdAt < 24 * 60 * 60 * 1000, // Last 24 hours
        hasActiveDiscussion: (post.replyCount || 0) > 0,
      },
    }));

    return enrichedPosts;
  },
});

// Create a forum post via AI agent
export const createForumPostViaAgent = mutation({
  args: {
    agentId: v.id('agents'),
    userId: v.id('users'),
    title: v.string(),
    content: v.string(),
    category: v.string(),
    section: v.string(),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { agentId, userId, title, content, category, section, tags }) => {
    // Verify the agent exists and user has permission
    const agent = await ctx.db.get(agentId);
    const user = await ctx.db.get(userId);
    
    if (!agent || !user) {
      throw new Error('Agent or user not found');
    }

    // Check if user has credits for agent actions
    const hasCredits = await ctx.runQuery(internal.users.checkMessageCredits, { userId });
    if (!hasCredits) {
      throw new Error('Insufficient message credits for agent action');
    }

    // Deduct credits
    await ctx.runMutation(internal.users.deductMessageCredits, { userId, amount: 1 });

    // Create the post
    const postId = await ctx.db.insert('posts', {
      authorId: userId,
      title: `[${agent.name}] ${title}`,
      content: `${content}\n\n*This post was created by the ${agent.name} AI agent.*`,
      tags: tags ? [...tags, 'ai-generated'] : ['ai-generated'],
      category,
      section,
      views: 0,
      likes: 0,
      createdAt: Date.now(),
    });

    // Log the agent action
    await ctx.db.insert('agentToolExecutions', {
      sessionId: `forum-${Date.now()}`,
      chatId: undefined as any, // Forum posts don't have chat context
      agentId,
      userId: userId as any,
      toolName: 'createForumPost',
      input: JSON.stringify({ title, content, category, section, tags }),
      output: JSON.stringify({ postId }),
      status: 'completed',
      executionTimeMs: 0,
      createdAt: Date.now(),
    });

    return await ctx.db.get(postId);
  },
});

// Analyze forum sentiment and trends for AI agents
export const analyzeForumTrends = query({
  args: {
    timeframe: v.optional(v.union(v.literal('day'), v.literal('week'), v.literal('month'))),
    category: v.optional(v.string()),
    section: v.optional(v.string()),
  },
  handler: async (ctx, { timeframe = 'week', category, section }) => {
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
      default:
        startTime = now - 7 * 24 * 60 * 60 * 1000;
    }

    // Get posts in timeframe
    let posts = await ctx.db.query('posts').collect();
    posts = posts.filter(post => {
      const matchesTime = post.createdAt >= startTime;
      const matchesCategory = !category || post.category === category;
      const matchesSection = !section || post.section === section;
      return matchesTime && matchesCategory && matchesSection;
    });

    // Get replies for these posts
    const postIds = posts.map(p => p._id);
    const allReplies = await ctx.db.query('replies').collect();
    const replies = allReplies.filter(r => postIds.includes(r.postId));

    // Calculate trends
    const totalPosts = posts.length;
    const totalReplies = replies.length;
    const totalLikes = posts.reduce((sum, p) => sum + (p.likes || 0), 0);
    const totalViews = posts.reduce((sum, p) => sum + (p.views || 0), 0);

    // Popular tags
    const tagCounts: Record<string, number> = {};
    posts.forEach(post => {
      if (post.tags) {
        post.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });

    const popularTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    // Most active sections
    const sectionCounts: Record<string, number> = {};
    posts.forEach(post => {
      const key = `${post.category}/${post.section}`;
      sectionCounts[key] = (sectionCounts[key] || 0) + 1;
    });

    const activeSections = Object.entries(sectionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([section, count]) => ({ section, count }));

    return {
      timeframe,
      period: { start: startTime, end: now },
      metrics: {
        totalPosts,
        totalReplies,
        totalLikes,
        totalViews,
        avgLikesPerPost: totalPosts > 0 ? totalLikes / totalPosts : 0,
        avgRepliesPerPost: totalPosts > 0 ? totalReplies / totalPosts : 0,
      },
      popularTags,
      activeSections,
      topPosts: posts
        .sort((a, b) => (b.likes || 0) - (a.likes || 0))
        .slice(0, 5)
        .map(p => ({
          id: p._id,
          title: p.title,
          likes: p.likes || 0,
          views: p.views || 0,
          category: p.category,
          section: p.section,
        })),
    };
  },
});
