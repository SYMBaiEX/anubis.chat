import { v } from 'convex/values';
import { mutation, query, action } from './_generated/server';
import { requireAuth } from './authHelpers';
import { api } from './_generated/api';
import { internal } from './_generated/api';

// Real-time features for modern forum experience

// User following system
export const followUser = mutation({
  args: { targetUserId: v.id('users') },
  handler: async (ctx, { targetUserId }) => {
    const { user } = await requireAuth(ctx);
    
    if (user._id === targetUserId) {
      throw new Error('Cannot follow yourself');
    }
    
    // Check if already following
    const existingFollow = await ctx.db
      .query('userFollows')
      .filter((q) => 
        q.and(
          q.eq(q.field('followerId'), user._id),
          q.eq(q.field('followingId'), targetUserId)
        )
      )
      .first();
    
    if (existingFollow) {
      throw new Error('Already following this user');
    }
    
    const followId = await ctx.db.insert('userFollows', {
      followerId: user._id,
      followingId: targetUserId,
      createdAt: Date.now(),
    });
    
    // Create notification for followed user
    await ctx.runMutation(api.forumEnhancements.createNotification, {
      userId: targetUserId,
      type: 'follow',
      title: 'New Follower',
      content: `${user.displayName || 'Someone'} started following you`,
    });
    
    return followId;
  },
});

export const unfollowUser = mutation({
  args: { targetUserId: v.id('users') },
  handler: async (ctx, { targetUserId }) => {
    const { user } = await requireAuth(ctx);
    
    const follow = await ctx.db
      .query('userFollows')
      .filter((q) => 
        q.and(
          q.eq(q.field('followerId'), user._id),
          q.eq(q.field('followingId'), targetUserId)
        )
      )
      .first();
    
    if (!follow) {
      throw new Error('Not following this user');
    }
    
    await ctx.db.delete(follow._id);
    return true;
  },
});

// Get user's followers and following
export const getUserFollows = query({
  args: { 
    userId: v.id('users'),
    type: v.union(v.literal('followers'), v.literal('following')),
  },
  handler: async (ctx, { userId, type }) => {
    let follows;
    
    if (type === 'followers') {
      follows = await ctx.db
        .query('userFollows')
        .filter((q) => q.eq(q.field('followingId'), userId))
        .collect();
    } else {
      follows = await ctx.db
        .query('userFollows')
        .filter((q) => q.eq(q.field('followerId'), userId))
        .collect();
    }
    
    // Enrich with user data
    const enrichedFollows = await Promise.all(
      follows.map(async (follow) => {
        const targetUserId = type === 'followers' ? follow.followerId : follow.followingId;
        const user = await ctx.db.get(targetUserId);
        return {
          ...follow,
          user: {
            id: targetUserId,
            displayName: user?.displayName || 'Anonymous',
            avatar: user?.avatar,
            walletAddress: user?.walletAddress,
          },
        };
      })
    );
    
    return enrichedFollows;
  },
});

// Bookmark posts
export const bookmarkPost = mutation({
  args: { postId: v.id('posts') },
  handler: async (ctx, { postId }) => {
    const { user } = await requireAuth(ctx);
    
    // Check if already bookmarked
    const existing = await ctx.db
      .query('postBookmarks')
      .filter((q) => 
        q.and(
          q.eq(q.field('userId'), user._id),
          q.eq(q.field('postId'), postId)
        )
      )
      .first();
    
    if (existing) {
      // Remove bookmark
      await ctx.db.delete(existing._id);
      return { bookmarked: false };
    } else {
      // Add bookmark
      await ctx.db.insert('postBookmarks', {
        userId: user._id,
        postId,
        createdAt: Date.now(),
      });
      return { bookmarked: true };
    }
  },
});

// Get user's bookmarked posts
export const getUserBookmarks = query({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    const bookmarks = await ctx.db
      .query('postBookmarks')
      .filter((q) => q.eq(q.field('userId'), userId))
      .order('desc')
      .collect();
    
    // Get post details
    const posts = await Promise.all(
      bookmarks.map(async (bookmark) => {
        const post = await ctx.db.get(bookmark.postId);
        if (!post) return null;
        
        const author = await ctx.db.get(post.authorId);
        return {
          ...post,
          bookmarkedAt: bookmark.createdAt,
          author: {
            displayName: author?.displayName || 'Anonymous',
            avatar: author?.avatar,
          },
        };
      })
    );
    
    return posts.filter(Boolean);
  },
});

// Social sharing
export const sharePost = mutation({
  args: {
    postId: v.id('posts'),
    platform: v.union(
      v.literal('twitter'),
      v.literal('facebook'),
      v.literal('linkedin'),
      v.literal('discord'),
      v.literal('telegram'),
      v.literal('copy_link')
    ),
  },
  handler: async (ctx, { postId, platform }) => {
    const { user } = await requireAuth(ctx);
    
    // Track the share
    await ctx.db.insert('socialShares', {
      postId,
      userId: user._id,
      platform,
      createdAt: Date.now(),
    });
    
    // Get post for sharing data
    const post = await ctx.db.get(postId);
    if (!post) throw new Error('Post not found');
    
    const author = await ctx.db.get(post.authorId);
    
    // Generate share URL and content
    const baseUrl = process.env.FORUM_BASE_URL || 'https://anubis.chat/forum';
    const shareUrl = `${baseUrl}/post/${postId}`;
    
    let shareContent = '';
    switch (platform) {
      case 'twitter':
        shareContent = `Check out this discussion: "${post.title}" by ${author?.displayName || 'Anonymous'} ${shareUrl} #AnubisChat`;
        break;
      case 'facebook':
      case 'linkedin':
        shareContent = `Interesting discussion on Anubis Chat: "${post.title}"\n\n${post.content.slice(0, 200)}${post.content.length > 200 ? '...' : ''}\n\nRead more: ${shareUrl}`;
        break;
      case 'discord':
      case 'telegram':
        shareContent = `💬 **${post.title}**\nBy ${author?.displayName || 'Anonymous'}\n\n${post.content.slice(0, 300)}${post.content.length > 300 ? '...' : ''}\n\n🔗 ${shareUrl}`;
        break;
      case 'copy_link':
        shareContent = shareUrl;
        break;
    }
    
    return {
      shareUrl,
      shareContent,
      platform,
    };
  },
});

// Get post sharing statistics
export const getPostShareStats = query({
  args: { postId: v.id('posts') },
  handler: async (ctx, { postId }) => {
    const shares = await ctx.db
      .query('socialShares')
      .filter((q) => q.eq(q.field('postId'), postId))
      .collect();
    
    const platformCounts: Record<string, number> = {};
    shares.forEach(share => {
      platformCounts[share.platform] = (platformCounts[share.platform] || 0) + 1;
    });
    
    return {
      totalShares: shares.length,
      platformBreakdown: platformCounts,
      recentShares: shares
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 5)
        .map(share => ({
          platform: share.platform,
          createdAt: share.createdAt,
        })),
    };
  },
});

// Live activity feed
export const getActivityFeed = query({
  args: {
    userId: v.optional(v.id('users')),
    followingOnly: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, followingOnly = false, limit = 20 }) => {
    const activities = [];
    
    // Get recent posts
    let posts = await ctx.db.query('posts').order('desc').take(limit * 2);
    
    // Filter by following if requested
    if (followingOnly && userId) {
      const following = await ctx.db
        .query('userFollows')
        .filter((q) => q.eq(q.field('followerId'), userId))
        .collect();
      
      const followingIds = new Set(following.map(f => f.followingId));
      posts = posts.filter(post => followingIds.has(post.authorId));
    }
    
    // Convert posts to activities
    for (const post of posts.slice(0, limit)) {
      const author = await ctx.db.get(post.authorId);
      activities.push({
        type: 'post_created',
        id: post._id,
        title: post.title,
        content: post.content.slice(0, 150) + (post.content.length > 150 ? '...' : ''),
        author: {
          displayName: author?.displayName || 'Anonymous',
          avatar: author?.avatar,
        },
        metadata: {
          category: post.category,
          section: post.section,
          likes: post.likes || 0,
          views: post.views || 0,
        },
        createdAt: post.createdAt,
        url: `/post/${post._id}`,
      });
    }
    
    // Get recent replies
    const replies = await ctx.db.query('replies').order('desc').take(limit);
    
    for (const reply of replies) {
      const author = await ctx.db.get(reply.authorId);
      const post = await ctx.db.get(reply.postId);
      
      if (post && (!followingOnly || !userId || 
          (await ctx.db.query('userFollows')
            .filter(q => q.and(q.eq(q.field('followerId'), userId), q.eq(q.field('followingId'), reply.authorId)))
            .first()))) {
        
        activities.push({
          type: 'reply_created',
          id: reply._id,
          title: `Reply to "${post.title}"`,
          content: reply.content.slice(0, 150) + (reply.content.length > 150 ? '...' : ''),
          author: {
            displayName: author?.displayName || 'Anonymous',
            avatar: author?.avatar,
          },
          metadata: {
            postTitle: post.title,
            postId: post._id,
          },
          createdAt: reply.createdAt,
          url: `/post/${post._id}#reply-${reply._id}`,
        });
      }
    }
    
    // Sort all activities by creation time
    activities.sort((a, b) => b.createdAt - a.createdAt);
    
    return activities.slice(0, limit);
  },
});

// Push notification preferences
export const updateNotificationPreferences = mutation({
  args: {
    preferences: v.object({
      postReplies: v.boolean(),
      postLikes: v.boolean(),
      mentions: v.boolean(),
      follows: v.boolean(),
      moderatorActions: v.boolean(),
      emailNotifications: v.boolean(),
      pushNotifications: v.boolean(),
    }),
  },
  handler: async (ctx, { preferences }) => {
    const { user } = await requireAuth(ctx);
    
    // Store preferences in user profile
    await ctx.db.patch(user._id, {
      notificationPreferences: preferences,
      updatedAt: Date.now(),
    });
    
    return preferences;
  },
});

// Get notification preferences
export const getNotificationPreferences = query({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    
    return user?.notificationPreferences || {
      postReplies: true,
      postLikes: true,
      mentions: true,
      follows: true,
      moderatorActions: true,
      emailNotifications: false,
      pushNotifications: false,
    };
  },
});
