import { v } from 'convex/values';
import { query } from './_generated/server';

// Get user statistics
export const getUserStats = query({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    // Count total chats owned by this wallet
    const chats = await ctx.db
      .query('chats')
      .withIndex('by_owner', (q) => q.eq('ownerId', args.walletAddress))
      .collect();
    const totalChats = chats.length;

    // Count agents created by this wallet
    const agents = await ctx.db
      .query('agents')
      .withIndex('by_creator', (q) => q.eq('createdBy', args.walletAddress))
      .collect();
    const agentsCreated = agents.length;

    // Count total messages across all chats
    let totalMessages = 0;
    for (const chat of chats) {
      const messages = await ctx.db
        .query('messages')
        .withIndex('by_chat', (q) => q.eq('chatId', chat._id))
        .collect();
      totalMessages += messages.length;
    }

    // Get user to check last active
    const user = await ctx.db
      .query('users')
      .withIndex('by_wallet', (q) => q.eq('walletAddress', args.walletAddress))
      .first();

    // Calculate streak days (simplified - just checking last active)
    const streakDays = calculateStreakDays(user?.lastActiveAt);

    return {
      totalChats,
      agentsCreated,
      totalMessages,
      streakDays,
    };
  },
});

// Helper function to calculate streak days
function calculateStreakDays(lastActiveAt?: number): number {
  if (!lastActiveAt) return 0;

  const now = Date.now();
  const daysSinceActive = Math.floor(
    (now - lastActiveAt) / (1000 * 60 * 60 * 24)
  );

  // If active within last 24 hours, consider it a streak
  if (daysSinceActive <= 1) {
    return 1; // Simplified - in production you'd track actual streak
  }

  return 0;
}
