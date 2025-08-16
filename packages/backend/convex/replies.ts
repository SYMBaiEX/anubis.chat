import { v } from 'convex/values';
import { mutation, query, action } from './_generated/server';
import { requireAuth } from './authHelpers';
import { api } from './_generated/api';
import { internal } from './_generated/api';

export const list = query({
  args: { postId: v.id('posts') },
  handler: async (ctx, { postId }) => {
    const replies = await ctx.db.query('replies').withIndex('by_post', (q) => q.eq('postId', postId)).collect();
    
    // Enrich replies with author information
    const enrichedReplies = await Promise.all(
      replies.map(async (reply) => {
        const author = await ctx.db.get(reply.authorId);
        return {
          ...reply,
          author: {
            displayName: author?.displayName || 'Anonymous',
            walletAddress: author?.walletAddress,
            isAnubisAI: author?.displayName === 'Anubis AI',
          },
        };
      })
    );
    
    return enrichedReplies;
  },
});

export const create = mutation({
  args: { postId: v.id('posts'), content: v.string() },
  handler: async (ctx, { postId, content }) => {
    const { user } = await requireAuth(ctx);
    const now = Date.now();
    
    // Check if content contains @anubis mention
    const hasAnubisMention = content.toLowerCase().includes('@anubis');
    
    const id = await ctx.db.insert('replies', {
      postId,
      authorId: user._id,
      content,
      createdAt: now,
    });
    
    // If @anubis is mentioned, trigger AI response
    if (hasAnubisMention) {
      await ctx.scheduler.runAfter(0, internal.replies.handleAnubisMention, {
        replyId: id,
        postId,
        userId: user._id,
        content,
      });
    }
    
    return await ctx.db.get(id);
  },
});

// Handle @anubis mentions and generate AI responses
export const handleAnubisMention = action({
  args: {
    replyId: v.id('replies'),
    postId: v.id('posts'),
    userId: v.id('users'),
    content: v.string(),
  },
  handler: async (ctx, { replyId, postId, userId, content }) => {
    try {
      // Get the original post and user info
      const post = await ctx.runQuery(api.posts.get, { id: postId });
      const user = await ctx.runQuery(api.users.getUserById, { userId });
      
      if (!post || !user) {
        console.error('Post or user not found for @anubis mention');
        return;
      }
      
      // Check if user has message credits
      const hasCredits = await ctx.runQuery(internal.users.checkMessageCredits, { userId });
      
      if (!hasCredits) {
        // Create a reply indicating insufficient credits
        await ctx.runMutation(internal.replies.createSystemReply, {
          postId,
          content: "@" + (user.displayName || user.walletAddress?.slice(0, 8) || 'User') + 
                  " I'd love to help, but you need message credits to use AI features. You can purchase credits in the web app or upgrade your subscription.",
          isAnubisReply: true,
        });
        return;
      }
      
      // Deduct message credits
      await ctx.runMutation(internal.users.deductMessageCredits, { userId, amount: 1 });
      
      // Prepare context for AI response
      const context = {
        postTitle: post.title,
        postContent: post.content,
        userMessage: content,
        userName: user.displayName || user.walletAddress?.slice(0, 8) || 'User',
      };
      
      // Generate AI response using the web app's AI system
      const aiResponse = await ctx.runAction(internal.agents.generateForumResponse, {
        context,
        userId,
      });
      
      if (aiResponse) {
        // Create AI reply
        await ctx.runMutation(internal.replies.createSystemReply, {
          postId,
          content: aiResponse,
          isAnubisReply: true,
        });
      }
      
    } catch (error) {
      console.error('Error handling @anubis mention:', error);
      // Create error reply
      await ctx.runMutation(internal.replies.createSystemReply, {
        postId,
        content: "Sorry, I encountered an error while processing your request. Please try again later.",
        isAnubisReply: true,
      });
    }
  },
});

// Create system/AI replies
export const createSystemReply = mutation({
  args: {
    postId: v.id('posts'),
    content: v.string(),
    isAnubisReply: v.optional(v.boolean()),
  },
  handler: async (ctx, { postId, content, isAnubisReply = false }) => {
    // Create a system user ID for Anubis replies
    const systemUserId = await getOrCreateSystemUser(ctx);
    
    const now = Date.now();
    const id = await ctx.db.insert('replies', {
      postId,
      authorId: systemUserId,
      content,
      createdAt: now,
    });
    
    return await ctx.db.get(id);
  },
});

// Helper function to get or create system user for Anubis
async function getOrCreateSystemUser(ctx: any) {
  // Look for existing system user
  const existingSystemUser = await ctx.db
    .query('users')
    .filter((q: any) => q.eq(q.field('displayName'), 'Anubis AI'))
    .first();
  
  if (existingSystemUser) {
    return existingSystemUser._id;
  }
  
  // Create system user if it doesn't exist
  const systemUserId = await ctx.db.insert('users', {
    displayName: 'Anubis AI',
    walletAddress: 'system_anubis_ai',
    role: 'admin',
    isActive: true,
    createdAt: Date.now(),
  });
  
  return systemUserId;
}


