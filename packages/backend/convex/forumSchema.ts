import { defineTable } from 'convex/server';
import { v } from 'convex/values';

// Additional schema tables for enhanced forum features
// These should be added to the main schema.ts file

export const forumEnhancementTables = {
  // Real-time notifications for forum activities
  forumNotifications: defineTable({
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
    isRead: v.boolean(),
    createdAt: v.number(),
  })
    .index('by_user', ['userId', 'createdAt'])
    .index('by_user_unread', ['userId', 'isRead', 'createdAt']),

  // User reputation and karma system
  userReputation: defineTable({
    userId: v.id('users'),
    totalPoints: v.number(),
    level: v.number(),
    badges: v.array(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_user', ['userId']),

  // Reputation change history
  reputationHistory: defineTable({
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
    createdAt: v.number(),
  })
    .index('by_user', ['userId', 'createdAt'])
    .index('by_action', ['action', 'createdAt']),

  // Enhanced forum flags with AI analysis
  forumFlagsEnhanced: defineTable({
    postId: v.optional(v.id('posts')),
    replyId: v.optional(v.id('replies')),
    reportedBy: v.id('users'),
    reason: v.union(
      v.literal('spam'),
      v.literal('inappropriate'),
      v.literal('harassment'),
      v.literal('misinformation'),
      v.literal('copyright'),
      v.literal('other')
    ),
    note: v.optional(v.string()),
    status: v.union(
      v.literal('open'),
      v.literal('resolved'),
      v.literal('dismissed'),
      v.literal('escalated')
    ),
    aiAnalysis: v.optional(v.object({
      isToxic: v.boolean(),
      confidence: v.number(),
      category: v.string(),
      explanation: v.string(),
    })),
    moderatorId: v.optional(v.id('users')),
    moderatorNotes: v.optional(v.string()),
    createdAt: v.number(),
    resolvedAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  })
    .index('by_target', ['postId', 'replyId', 'createdAt'])
    .index('by_reporter', ['reportedBy', 'createdAt'])
    .index('by_status', ['status', 'createdAt'])
    .index('by_moderator', ['moderatorId', 'createdAt']),

  // User following system
  userFollows: defineTable({
    followerId: v.id('users'),
    followingId: v.id('users'),
    createdAt: v.number(),
  })
    .index('by_follower', ['followerId', 'createdAt'])
    .index('by_following', ['followingId', 'createdAt']),

  // Forum categories and sections management
  forumCategories: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    order: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_order', ['order', 'isActive']),

  forumSections: defineTable({
    categoryId: v.id('forumCategories'),
    name: v.string(),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    order: v.number(),
    isActive: v.boolean(),
    requiresPermission: v.optional(v.boolean()),
    allowedRoles: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_category', ['categoryId', 'order'])
    .index('by_active', ['isActive', 'order']),

  // Post bookmarks
  postBookmarks: defineTable({
    userId: v.id('users'),
    postId: v.id('posts'),
    createdAt: v.number(),
  }).index('by_user_post', ['userId', 'postId']),

  // Forum analytics
  forumAnalytics: defineTable({
    date: v.string(), // YYYY-MM-DD format
    metric: v.union(
      v.literal('daily_active_users'),
      v.literal('posts_created'),
      v.literal('replies_created'),
      v.literal('likes_given'),
      v.literal('views_total')
    ),
    value: v.number(),
    metadata: v.optional(v.record(v.string(), v.union(v.string(), v.number()))),
    createdAt: v.number(),
  })
    .index('by_date_metric', ['date', 'metric'])
    .index('by_metric_date', ['metric', 'date']),

  // Social sharing tracking
  socialShares: defineTable({
    postId: v.id('posts'),
    userId: v.id('users'),
    platform: v.union(
      v.literal('twitter'),
      v.literal('facebook'),
      v.literal('linkedin'),
      v.literal('discord'),
      v.literal('telegram'),
      v.literal('copy_link')
    ),
    createdAt: v.number(),
  })
    .index('by_post', ['postId', 'createdAt'])
    .index('by_user', ['userId', 'createdAt'])
    .index('by_platform', ['platform', 'createdAt']),
};

// Instructions for adding to main schema.ts:
/*
To integrate these tables into your main schema.ts file, add the following tables
to the defineSchema object:

import { forumEnhancementTables } from './forumSchema';

export default defineSchema({
  // ... existing tables ...
  
  // Add forum enhancement tables
  ...forumEnhancementTables,
  
  // ... rest of existing tables ...
});
*/
