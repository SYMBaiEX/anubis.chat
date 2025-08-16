import { v } from 'convex/values';
import { mutation, query, action } from './_generated/server';
import { requireAuth } from './authHelpers';
import { api } from './_generated/api';
import { internal } from './_generated/api';

// Real-time notifications for forum activities
export const createNotification = mutation({
  args: {
    userId: v.id('users'),
    type: v.union(
      v.literal('post_reply'),
      v.literal('post_like'),
      v.literal('mention'),
      v.literal('follow'),
      v.literal('moderator_action')
    ),
    title: v.string(),
    content: v.string(),
    relatedPostId: v.optional(v.id('posts')),
    relatedReplyId: v.optional(v.id('replies')),
    actionUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Check if similar notification already exists (prevent spam)
    const existingNotification = await ctx.db
      .query('forumNotifications')
      .filter((q) => 
        q.and(
          q.eq(q.field('userId'), args.userId),
          q.eq(q.field('type'), args.type),
          q.eq(q.field('relatedPostId'), args.relatedPostId),
          q.gte(q.field('createdAt'), now - 60000) // Within last minute
        )
      )
      .first();
    
    if (existingNotification) {
      return existingNotification._id;
    }
    
    const notificationId = await ctx.db.insert('forumNotifications', {
      userId: args.userId,
      type: args.type,
      title: args.title,
      content: args.content,
      relatedPostId: args.relatedPostId,
      relatedReplyId: args.relatedReplyId,
      actionUrl: args.actionUrl,
      isRead: false,
      createdAt: now,
    });
    
    return notificationId;
  },
});

// Get user notifications
export const getUserNotifications = query({
  args: {
    userId: v.id('users'),
    limit: v.optional(v.number()),
    unreadOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, { userId, limit = 20, unreadOnly = false }) => {
    let query = ctx.db
      .query('forumNotifications')
      .filter((q) => q.eq(q.field('userId'), userId));
    
    if (unreadOnly) {
      query = query.filter((q) => q.eq(q.field('isRead'), false));
    }
    
    const notifications = await query
      .order('desc')
      .take(limit);
    
    return notifications;
  },
});

// Mark notifications as read
export const markNotificationsRead = mutation({
  args: {
    notificationIds: v.array(v.id('forumNotifications')),
  },
  handler: async (ctx, { notificationIds }) => {
    const { user } = await requireAuth(ctx);
    
    for (const id of notificationIds) {
      const notification = await ctx.db.get(id);
      if (notification && notification.userId === user._id) {
        await ctx.db.patch(id, { isRead: true });
      }
    }
    
    return true;
  },
});

// User reputation system
export const updateUserReputation = mutation({
  args: {
    userId: v.id('users'),
    action: v.union(
      v.literal('post_created'),
      v.literal('post_liked'),
      v.literal('reply_created'),
      v.literal('reply_liked'),
      v.literal('post_featured'),
      v.literal('helpful_reply'),
      v.literal('spam_reported'),
      v.literal('content_removed')
    ),
    points: v.number(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, { userId, action, points, reason }) => {
    const user = await ctx.db.get(userId);
    if (!user) return;
    
    // Get or create reputation record
    let reputation = await ctx.db
      .query('userReputation')
      .filter((q) => q.eq(q.field('userId'), userId))
      .first();
    
    if (!reputation) {
      const reputationId = await ctx.db.insert('userReputation', {
        userId,
        totalPoints: points,
        level: 1,
        badges: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      reputation = await ctx.db.get(reputationId);
    } else {
      const newTotal = reputation.totalPoints + points;
      const newLevel = Math.floor(newTotal / 100) + 1; // Level up every 100 points
      
      await ctx.db.patch(reputation._id, {
        totalPoints: newTotal,
        level: newLevel,
        updatedAt: Date.now(),
      });
    }
    
    // Log reputation change
    await ctx.db.insert('reputationHistory', {
      userId,
      action,
      points,
      reason,
      createdAt: Date.now(),
    });
    
    return reputation;
  },
});

// Get user reputation
export const getUserReputation = query({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    const reputation = await ctx.db
      .query('userReputation')
      .filter((q) => q.eq(q.field('userId'), userId))
      .first();
    
    if (!reputation) {
      return {
        totalPoints: 0,
        level: 1,
        badges: [],
        rank: 'Newcomer',
      };
    }
    
    // Calculate rank based on level
    let rank = 'Newcomer';
    if (reputation.level >= 10) rank = 'Contributor';
    if (reputation.level >= 25) rank = 'Expert';
    if (reputation.level >= 50) rank = 'Master';
    if (reputation.level >= 100) rank = 'Legend';
    
    return {
      ...reputation,
      rank,
    };
  },
});

// Advanced content moderation
export const reportContent = mutation({
  args: {
    postId: v.optional(v.id('posts')),
    replyId: v.optional(v.id('replies')),
    reason: v.union(
      v.literal('spam'),
      v.literal('inappropriate'),
      v.literal('harassment'),
      v.literal('misinformation'),
      v.literal('copyright'),
      v.literal('other')
    ),
    description: v.optional(v.string()),
  },
  handler: async (ctx, { postId, replyId, reason, description }) => {
    const { user } = await requireAuth(ctx);
    
    // Check if user already reported this content
    const existingReport = await ctx.db
      .query('forumFlags')
      .filter((q) => 
        q.and(
          q.eq(q.field('reportedBy'), user._id),
          postId ? q.eq(q.field('postId'), postId) : q.eq(q.field('replyId'), replyId)
        )
      )
      .first();
    
    if (existingReport) {
      throw new Error('You have already reported this content');
    }
    
    const reportId = await ctx.db.insert('forumFlags', {
      postId,
      replyId,
      reportedBy: user._id,
      reason,
      note: description,
      status: 'open',
      createdAt: Date.now(),
    });
    
    // Auto-moderate based on AI analysis
    await ctx.scheduler.runAfter(0, internal.forumEnhancements.analyzeReportedContent, {
      reportId,
      postId,
      replyId,
    });
    
    return reportId;
  },
});

// AI-powered content analysis
export const analyzeReportedContent = action({
  args: {
    reportId: v.id('forumFlags'),
    postId: v.optional(v.id('posts')),
    replyId: v.optional(v.id('replies')),
  },
  handler: async (ctx, { reportId, postId, replyId }) => {
    try {
      let content = '';
      
      if (postId) {
        const post = await ctx.runQuery(api.posts.get, { id: postId });
        content = `${post?.title || ''} ${post?.content || ''}`;
      } else if (replyId) {
        const reply = await ctx.runQuery(api.replies.list, { postId: replyId });
        // This is a simplified approach - in reality you'd get the specific reply
        content = reply?.[0]?.content || '';
      }
      
      if (!content) return;
      
      // Use AI to analyze content toxicity
      const analysis = await analyzeContentToxicity(content);
      
      // Update report with AI analysis
      await ctx.runMutation(internal.forumEnhancements.updateReportAnalysis, {
        reportId,
        aiAnalysis: analysis,
      });
      
      // Auto-action if confidence is high
      if (analysis.confidence > 0.8 && analysis.isToxic) {
        await ctx.runMutation(internal.forumEnhancements.autoModerateContent, {
          postId,
          replyId,
          reason: analysis.category,
        });
      }
      
    } catch (error) {
      console.error('Error analyzing reported content:', error);
    }
  },
});

// Update report with AI analysis
export const updateReportAnalysis = mutation({
  args: {
    reportId: v.id('forumFlags'),
    aiAnalysis: v.object({
      isToxic: v.boolean(),
      confidence: v.number(),
      category: v.string(),
      explanation: v.string(),
    }),
  },
  handler: async (ctx, { reportId, aiAnalysis }) => {
    await ctx.db.patch(reportId, {
      aiAnalysis,
      updatedAt: Date.now(),
    });
  },
});

// Auto-moderate content
export const autoModerateContent = mutation({
  args: {
    postId: v.optional(v.id('posts')),
    replyId: v.optional(v.id('replies')),
    reason: v.string(),
  },
  handler: async (ctx, { postId, replyId, reason }) => {
    if (postId) {
      // Hide the post
      await ctx.db.patch(postId, {
        locked: true,
        updatedAt: Date.now(),
      });
      
      // Notify post author
      const post = await ctx.db.get(postId);
      if (post) {
        await ctx.runMutation(api.forumEnhancements.createNotification, {
          userId: post.authorId,
          type: 'moderator_action',
          title: 'Post Moderated',
          content: `Your post "${post.title}" has been automatically moderated due to: ${reason}`,
          relatedPostId: postId,
        });
      }
    }
    
    if (replyId) {
      // Remove the reply
      await ctx.db.delete(replyId);
      
      // Note: In a production system, you'd want to soft-delete and notify the user
    }
  },
});

// Get trending topics
export const getTrendingTopics = query({
  args: {
    timeframe: v.optional(v.union(v.literal('day'), v.literal('week'), v.literal('month'))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { timeframe = 'week', limit = 10 }) => {
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
    
    // Get posts from timeframe
    const posts = await ctx.db
      .query('posts')
      .filter((q) => q.gte(q.field('createdAt'), startTime))
      .collect();
    
    // Count tag occurrences
    const tagCounts: Record<string, { count: number; engagement: number }> = {};
    
    for (const post of posts) {
      if (post.tags) {
        const engagement = (post.likes || 0) + (post.views || 0);
        for (const tag of post.tags) {
          if (!tagCounts[tag]) {
            tagCounts[tag] = { count: 0, engagement: 0 };
          }
          tagCounts[tag].count += 1;
          tagCounts[tag].engagement += engagement;
        }
      }
    }
    
    // Sort by engagement score
    const trending = Object.entries(tagCounts)
      .map(([tag, data]) => ({
        tag,
        posts: data.count,
        engagement: data.engagement,
        score: data.count * Math.log(data.engagement + 1), // Weighted score
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
    
    return trending;
  },
});

// Helper function for AI content analysis (simplified)
async function analyzeContentToxicity(content: string) {
  // In a real implementation, this would call an AI service like Perspective API
  // For now, we'll use simple keyword detection
  const toxicKeywords = ['spam', 'scam', 'hate', 'abuse', 'harassment'];
  const lowerContent = content.toLowerCase();
  
  const foundKeywords = toxicKeywords.filter(keyword => 
    lowerContent.includes(keyword)
  );
  
  const isToxic = foundKeywords.length > 0;
  const confidence = foundKeywords.length > 0 ? 0.7 : 0.1;
  
  return {
    isToxic,
    confidence,
    category: foundKeywords.length > 0 ? foundKeywords[0] : 'clean',
    explanation: foundKeywords.length > 0 
      ? `Content contains potentially problematic keywords: ${foundKeywords.join(', ')}`
      : 'Content appears to be clean',
  };
}
