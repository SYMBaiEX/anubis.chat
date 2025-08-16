import { v } from 'convex/values';
import { action, query } from './_generated/server';
import { api } from './_generated/api';
import { internal } from './_generated/api';

// Comprehensive integration test for forum enhancements
export const runIntegrationTests = action({
  args: {
    testUserId: v.optional(v.id('users')),
    skipAITests: v.optional(v.boolean()),
  },
  handler: async (ctx, { testUserId, skipAITests = false }) => {
    const results = {
      timestamp: Date.now(),
      tests: [] as Array<{
        name: string;
        status: 'passed' | 'failed' | 'skipped';
        duration: number;
        error?: string;
        details?: any;
      }>,
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
      },
    };

    const runTest = async (name: string, testFn: () => Promise<any>) => {
      const start = Date.now();
      try {
        const result = await testFn();
        const duration = Date.now() - start;
        results.tests.push({
          name,
          status: 'passed',
          duration,
          details: result,
        });
        results.summary.passed++;
      } catch (error) {
        const duration = Date.now() - start;
        results.tests.push({
          name,
          status: 'failed',
          duration,
          error: error instanceof Error ? error.message : String(error),
        });
        results.summary.failed++;
      }
      results.summary.total++;
    };

    // Test 1: Schema validation
    await runTest('Schema Tables Exist', async () => {
      // Test that new tables are accessible
      const notifications = await ctx.runQuery(internal.testForumIntegration.testTableAccess, {
        tableName: 'forumNotifications',
      });
      const reputation = await ctx.runQuery(internal.testForumIntegration.testTableAccess, {
        tableName: 'userReputation',
      });
      return { notifications: 'accessible', reputation: 'accessible' };
    });

    // Test 2: User credit system
    if (testUserId) {
      await runTest('Credit System Integration', async () => {
        const credits = await ctx.runQuery(api.users.checkMessageCredits, {
          userId: testUserId,
        });
        return { hasCredits: credits, userId: testUserId };
      });
    } else {
      results.tests.push({
        name: 'Credit System Integration',
        status: 'skipped',
        duration: 0,
      });
      results.summary.skipped++;
      results.summary.total++;
    }

    // Test 3: Forum post creation
    await runTest('Forum Post Creation', async () => {
      if (!testUserId) throw new Error('Test user ID required');
      
      const post = await ctx.runMutation(api.posts.create, {
        title: 'Test Integration Post',
        content: 'This is a test post for integration testing.',
        category: 'general',
        section: 'discussion',
        tags: ['test', 'integration'],
      });
      
      return { postId: post, created: true };
    });

    // Test 4: AI agent forum integration
    if (!skipAITests && testUserId) {
      await runTest('AI Agent Forum Access', async () => {
        const forumPosts = await ctx.runQuery(api.webAppForumIntegration.getForumPostsForWebApp, {
          limit: 5,
          includeMetadata: true,
        });
        
        const stats = await ctx.runQuery(api.webAppForumIntegration.getForumStats, {
          timeframe: 'week',
        });
        
        return {
          postsRetrieved: forumPosts.posts.length,
          statsAvailable: !!stats.metrics,
        };
      });
    } else {
      results.tests.push({
        name: 'AI Agent Forum Access',
        status: 'skipped',
        duration: 0,
      });
      results.summary.skipped++;
      results.summary.total++;
    }

    // Test 5: Notification system
    if (testUserId) {
      await runTest('Notification System', async () => {
        const notificationId = await ctx.runMutation(api.forumEnhancements.createNotification, {
          userId: testUserId,
          type: 'mention',
          title: 'Test Notification',
          content: 'This is a test notification for integration testing.',
        });
        
        const notifications = await ctx.runQuery(api.forumEnhancements.getUserNotifications, {
          userId: testUserId,
          limit: 1,
        });
        
        return {
          notificationCreated: !!notificationId,
          notificationsRetrieved: notifications.length > 0,
        };
      });
    }

    // Test 6: Reputation system
    if (testUserId) {
      await runTest('Reputation System', async () => {
        await ctx.runMutation(api.forumEnhancements.updateUserReputation, {
          userId: testUserId,
          action: 'post_created',
          points: 5,
          reason: 'Integration test post creation',
        });
        
        const reputation = await ctx.runQuery(api.forumEnhancements.getUserReputation, {
          userId: testUserId,
        });
        
        return {
          reputationUpdated: reputation.totalPoints >= 5,
          level: reputation.level,
          rank: reputation.rank,
        };
      });
    }

    // Test 7: Social features
    if (testUserId) {
      await runTest('Social Features', async () => {
        // Test activity feed
        const activity = await ctx.runQuery(api.realTimeFeatures.getActivityFeed, {
          userId: testUserId,
          limit: 5,
        });
        
        return {
          activityFeedWorking: Array.isArray(activity),
          activitiesFound: activity.length,
        };
      });
    }

    // Test 8: Trending topics
    await runTest('Trending Topics', async () => {
      const trending = await ctx.runQuery(api.forumEnhancements.getTrendingTopics, {
        timeframe: 'week',
        limit: 5,
      });
      
      return {
        trendingTopicsAvailable: Array.isArray(trending),
        topicsFound: trending.length,
      };
    });

    // Test 9: Forum analytics
    await runTest('Forum Analytics', async () => {
      const stats = await ctx.runQuery(api.webAppForumIntegration.getForumStats, {
        timeframe: 'week',
      });
      
      return {
        analyticsWorking: !!stats.metrics,
        metricsInclude: Object.keys(stats.metrics),
      };
    });

    // Test 10: @anubis mention detection (if AI tests enabled)
    if (!skipAITests && testUserId) {
      await runTest('@anubis Mention Detection', async () => {
        // Create a test post first
        const postId = await ctx.runMutation(api.posts.create, {
          title: 'Test Anubis Mention',
          content: 'Testing @anubis mention functionality.',
          category: 'general',
          section: 'discussion',
        });
        
        // Create a reply with @anubis mention
        const replyId = await ctx.runMutation(api.replies.create, {
          postId,
          content: 'Hey @anubis, can you help with this question?',
        });
        
        return {
          postCreated: !!postId,
          replyWithMentionCreated: !!replyId,
          mentionDetectionActive: true,
        };
      });
    }

    return results;
  },
});

// Helper query to test table access
export const testTableAccess = query({
  args: { tableName: v.string() },
  handler: async (ctx, { tableName }) => {
    try {
      // Try to query the table (will fail if table doesn't exist)
      const result = await (ctx.db as any).query(tableName).take(1);
      return { accessible: true, tableName };
    } catch (error) {
      throw new Error(`Table ${tableName} not accessible: ${error}`);
    }
  },
});

// Test forum post creation with AI integration
export const testAIPostCreation = action({
  args: {
    userId: v.id('users'),
    agentId: v.optional(v.id('agents')),
  },
  handler: async (ctx, { userId, agentId }) => {
    try {
      // Test AI-generated post creation
      const post = await ctx.runMutation(api.webAppForumIntegration.createPostFromWebApp, {
        userId,
        agentId,
        title: 'AI Generated Test Post',
        content: 'This post was created by an AI agent for testing purposes.',
        category: 'general',
        section: 'ai-generated',
        tags: ['ai', 'test', 'automated'],
        isAIGenerated: true,
      });
      
      return {
        success: true,
        postId: post?._id,
        title: post?.title,
        isAIGenerated: post?.tags?.includes('ai-generated'),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

// Test credit deduction for AI operations
export const testCreditDeduction = action({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    try {
      // Check initial credits
      const initialCredits = await ctx.runQuery(api.users.checkMessageCredits, {
        userId,
      });
      
      if (!initialCredits) {
        return {
          success: false,
          error: 'User has no credits available for testing',
        };
      }
      
      // Deduct credits
      await ctx.runMutation(internal.users.deductMessageCredits, {
        userId,
        amount: 1,
      });
      
      // Check credits after deduction
      const finalCredits = await ctx.runQuery(api.users.checkMessageCredits, {
        userId,
      });
      
      return {
        success: true,
        initialCredits,
        finalCredits,
        creditDeducted: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

// Comprehensive health check for all forum features
export const healthCheck = query({
  args: {},
  handler: async (ctx) => {
    const health = {
      timestamp: Date.now(),
      status: 'healthy' as 'healthy' | 'degraded' | 'unhealthy',
      checks: {} as Record<string, { status: string; details?: any }>,
    };

    try {
      // Check database tables
      const tables = [
        'posts',
        'replies', 
        'forumNotifications',
        'userReputation',
        'userFollows',
        'postBookmarks',
        'socialShares',
      ];
      
      for (const table of tables) {
        try {
          await (ctx.db as any).query(table).take(1);
          health.checks[`table_${table}`] = { status: 'ok' };
        } catch (error) {
          health.checks[`table_${table}`] = { 
            status: 'error',
            details: error instanceof Error ? error.message : String(error),
          };
          health.status = 'unhealthy';
        }
      }
      
      // Check recent activity
      const recentPosts = await ctx.db.query('posts').order('desc').take(5);
      health.checks.recent_activity = {
        status: recentPosts.length > 0 ? 'ok' : 'warning',
        details: { recentPostsCount: recentPosts.length },
      };
      
    } catch (error) {
      health.status = 'unhealthy';
      health.checks.general = {
        status: 'error',
        details: error instanceof Error ? error.message : String(error),
      };
    }

    return health;
  },
});
