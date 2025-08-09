import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { 
  requireAdmin, 
  requireAuth, 
  getCurrentUser, 
  isCurrentUserAdmin,
  requirePermission,
  getUserStats
} from './authHelpers';

// =============================================================================
// Admin Management Functions
// =============================================================================

/**
 * Get admin configuration from environment variables
 * Admin roles are now automatically assigned during user authentication
 * This function provides information about configured admin wallets
 */
export const getAdminConfiguration = query({
  handler: async (ctx) => {
    // Require admin privileges to view admin configuration
    await requireAdmin(ctx, 'admin');

    // Get admin wallets from environment variable
    const adminWalletsEnv = process.env.ADMIN_WALLETS;
    
    if (!adminWalletsEnv) {
      return {
        adminWallets: [],
        message: 'ADMIN_WALLETS environment variable not configured'
      };
    }

    // Parse comma-separated wallet addresses
    const adminWallets = adminWalletsEnv.split(',').map(wallet => wallet.trim()).filter(Boolean);
    
    // Get current admin users from the users table
    const adminUsers = await ctx.db
      .query('users')
      .filter((q) => 
        q.neq(q.field('role'), 'user')
      )
      .collect();

    return {
      configuredWallets: adminWallets,
      activeAdmins: adminUsers.map(user => ({
        walletAddress: user.walletAddress,
        role: user.role,
        isActive: user.isActive,
        permissions: user.permissions,
        lastActiveAt: user.lastActiveAt
      }))
    };
  },
});

/**
 * Promote a user to admin role
 * Updates existing user account with admin privileges
 */
export const promoteUserToAdmin = mutation({
  args: {
    walletAddress: v.string(),
    role: v.union(
      v.literal('super_admin'),
      v.literal('admin'),
      v.literal('moderator')
    ),
    permissions: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Require admin management permissions
    const { user: currentAdmin } = await requireAdmin(ctx, 'admin');

    // Find the user to promote
    const targetUser = await ctx.db
      .query('users')
      .withIndex('by_wallet', (q) => q.eq('walletAddress', args.walletAddress))
      .unique();

    if (!targetUser) {
      throw new Error('User not found - they must have an account first');
    }

    if (targetUser.role && targetUser.role !== 'user') {
      throw new Error('User already has admin privileges');
    }

    // Default permissions based on role
    const defaultPermissions = {
      moderator: ['content_moderation'] as const,
      admin: ['user_management', 'subscription_management', 'content_moderation', 'usage_analytics'] as const,
      super_admin: [
        'user_management',
        'subscription_management', 
        'content_moderation',
        'system_settings',
        'financial_data',
        'usage_analytics',
        'admin_management'
      ] as const,
    } as const;

    // Update user with admin role and permissions
    await ctx.db.patch(targetUser._id, {
      role: args.role,
      permissions: (args.permissions as any) ?? ([...defaultPermissions[args.role]] as unknown as typeof targetUser.permissions),
      updatedAt: Date.now(),
    });

    // Log the promotion for audit purposes
    console.log(`Admin ${currentAdmin.walletAddress} promoted ${args.walletAddress} to ${args.role}${args.notes ? ': ' + args.notes : ''}`);

    return { success: true, userId: targetUser._id };
  },
});

/**
 * Update admin permissions or role
 */
export const updateAdminUser = mutation({
  args: {
    walletAddress: v.string(),
    role: v.optional(v.union(
      v.literal('super_admin'),
      v.literal('admin'),
      v.literal('moderator'),
      v.literal('user') // Allow demotion to regular user
    )),
    permissions: v.optional(v.array(v.string())),
    isActive: v.optional(v.boolean()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Require admin management permissions
    const { user: currentAdmin } = await requireAdmin(ctx, 'admin');

    // Find user to update
    const targetUser = await ctx.db
      .query('users')
      .withIndex('by_wallet', (q) => q.eq('walletAddress', args.walletAddress))
      .unique();

    if (!targetUser) {
      throw new Error('User not found');
    }

    // Prevent self-demotion for super_admins
    if (currentAdmin.walletAddress === args.walletAddress && 
        args.role && args.role !== 'super_admin' && 
        currentAdmin.role === 'super_admin') {
      throw new Error('Cannot demote yourself from super_admin');
    }

    // Prepare updates
    const updates: any = { updatedAt: Date.now() };
    
    if (args.role !== undefined) {
      updates.role = args.role;
      
      // Clear permissions when demoting to regular user
      if (args.role === 'user') {
        updates.permissions = undefined;
      }
    }
    
    if (args.permissions !== undefined) updates.permissions = args.permissions;
    if (args.isActive !== undefined) updates.isActive = args.isActive;

    await ctx.db.patch(targetUser._id, updates);

    // Log the admin action
    console.log(`Admin ${currentAdmin.walletAddress} updated user ${args.walletAddress}${args.notes ? ': ' + args.notes : ''}`);

    return { success: true };
  },
});

/**
 * Demote admin to regular user
 * Removes admin privileges but keeps the user account
 */
export const demoteAdminToUser = mutation({
  args: {
    walletAddress: v.string(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Require admin management permissions
    const { user: currentAdmin } = await requireAdmin(ctx, 'admin');

    // Find user to demote
    const targetUser = await ctx.db
      .query('users')
      .withIndex('by_wallet', (q) => q.eq('walletAddress', args.walletAddress))
      .unique();

    if (!targetUser) {
      throw new Error('User not found');
    }

    if (!targetUser.role || targetUser.role === 'user') {
      throw new Error('User is not an admin');
    }

    // Prevent self-demotion
    if (currentAdmin.walletAddress === args.walletAddress) {
      throw new Error('Cannot demote yourself from admin');
    }

    // Demote to regular user
    await ctx.db.patch(targetUser._id, {
      role: 'user',
      permissions: undefined, // Remove all admin permissions
      updatedAt: Date.now(),
    });

    // Log the demotion
    console.log(`Admin ${currentAdmin.walletAddress} demoted ${args.walletAddress} from admin${args.reason ? ': ' + args.reason : ''}`);

    return { success: true };
  },
});

/**
 * Get all admin users (admin only)
 */
export const getAllAdmins = query({
  handler: async (ctx) => {
    // Require admin privileges to view admin list
    await requireAdmin(ctx, 'admin');

    // Get all users with admin roles
    const adminUsers = await ctx.db
      .query('users')
      .filter((q) => 
        q.and(
          q.neq(q.field('role'), 'user'),
          q.neq(q.field('role'), undefined)
        )
      )
      .collect();

    return adminUsers.map(user => ({
      _id: user._id,
      walletAddress: user.walletAddress,
      role: user.role,
      permissions: user.permissions,
      isActive: user.isActive,
      lastActiveAt: user.lastActiveAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));
  },
});

/**
 * Check if current user is admin
 */
export const checkCurrentUserAdminStatus = query({
  handler: async (ctx) => {
    try {
      const user = await getCurrentUser(ctx);
      
      if (!user) {
        return {
          isAuthenticated: false,
          isAdmin: false,
          adminInfo: null
        };
      }

      const isAdmin = await isCurrentUserAdmin(ctx);

      return {
        isAuthenticated: true,
        isAdmin,
        adminInfo: isAdmin ? {
          role: user.role,
          permissions: user.permissions,
          walletAddress: user.walletAddress
        } : null
      };
    } catch (error) {
      console.error('Admin status check failed:', error);
      return {
        isAuthenticated: false,
        isAdmin: false,
        adminInfo: null
      };
    }
  },
});

/**
 * Check if a specific wallet is an admin (for backward compatibility)
 */
export const checkAdminStatusByWallet = query({
  args: {
    walletAddress: v.string()
  },
  handler: async (ctx, args) => {
    try {
      // Find user with this wallet address
      const user = await ctx.db
        .query('users')
        .withIndex('by_wallet', (q) => q.eq('walletAddress', args.walletAddress))
        .unique();

      if (!user || !user.isActive || !user.role || user.role === 'user') {
        return {
          isAdmin: false,
          adminInfo: null
        };
      }

      return {
        isAdmin: true,
        adminInfo: {
          role: user.role,
          permissions: user.permissions,
          walletAddress: user.walletAddress
        }
      };
    } catch (error) {
      console.error('Admin status check failed:', error);
      return {
        isAdmin: false,
        adminInfo: null
      };
    }
  }
});

// =============================================================================
// User Management Functions (Admin Only)
// =============================================================================

/**
 * Get all users with pagination (admin only)
 */
export const getAllUsers = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
    filterTier: v.optional(v.union(
      v.literal('free'),
      v.literal('pro'),
      v.literal('pro_plus')
    )),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Require user management permissions
    await requirePermission(ctx, 'user_management');

    let query = ctx.db.query('users');

    // Apply tier filter
    if (args.filterTier) {
      query = query.filter((q) => q.eq(q.field('subscription.tier'), args.filterTier));
    }

    // Apply search filter
    if (args.search) {
      query = query.filter((q) => 
        q.or(
          q.eq(q.field('walletAddress'), args.search),
          q.eq(q.field('displayName'), args.search)
        )
      );
    }

    const users = await query
      .order('desc')
      .take(args.limit || 50);

    return users.map(user => ({
      _id: user._id,
      walletAddress: user.walletAddress,
      displayName: user.displayName,
      role: user.role || 'user',
      subscription: user.subscription,
      isActive: user.isActive,
      createdAt: user.createdAt,
      lastActiveAt: user.lastActiveAt,
      // Don't expose sensitive data like public keys or permissions in general admin view
    }));
  },
});

/**
 * Update user subscription (admin only)
 */
export const updateUserSubscription = mutation({
  args: {
    walletAddress: v.string(),
    tier: v.union(
      v.literal('free'),
      v.literal('pro'),
      v.literal('pro_plus')
    ),
    messagesLimit: v.optional(v.number()),
    premiumMessagesLimit: v.optional(v.number()),
    currentPeriodEnd: v.optional(v.number()),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Require subscription management permissions
    const { user: currentAdmin } = await requirePermission(ctx, 'subscription_management');

    // Find user to update
    const targetUser = await ctx.db
      .query('users')
      .withIndex('by_wallet', (q) => q.eq('walletAddress', args.walletAddress))
      .unique();

    if (!targetUser) {
      throw new Error('User not found');
    }

    // Prepare subscription updates
    const updatedSubscription = {
      ...targetUser.subscription,
      tier: args.tier,
    };

    if (args.messagesLimit !== undefined) {
      updatedSubscription.messagesLimit = args.messagesLimit;
    }

    if (args.premiumMessagesLimit !== undefined) {
      updatedSubscription.premiumMessagesLimit = args.premiumMessagesLimit;
    }

    if (args.currentPeriodEnd !== undefined) {
      updatedSubscription.currentPeriodEnd = args.currentPeriodEnd;
    }

    // Update user subscription
    await ctx.db.patch(targetUser._id, {
      subscription: updatedSubscription,
      updatedAt: Date.now(),
    });

    // Log the admin action
    console.log(`Admin ${currentAdmin.walletAddress} updated subscription for ${args.walletAddress}: ${args.reason || 'No reason provided'}`);

    return { success: true };
  },
});

/**
 * Get subscription analytics (admin only)
 */
export const getSubscriptionAnalytics = query({
  handler: async (ctx) => {
    // Require analytics permissions
    await requirePermission(ctx, 'usage_analytics');

    // Use helper function from authHelpers.ts
    const userStats = await getUserStats(ctx);
    
    // Additional subscription-specific analytics
    const users = await ctx.db.query('users').collect();
    
    const analytics = {
      ...userStats,
      totalRevenue: 0, // Would calculate from payments table when implemented
      newUsersThisMonth: users.filter(u => {
        const monthAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        return u.createdAt && u.createdAt > monthAgo;
      }).length,
      avgMessagesPerUser: users.reduce((sum, u) => sum + (u.subscription?.messagesUsed || 0), 0) / users.length,
    };

    return analytics;
  },
});

// =============================================================================
// System Management Functions (Admin Only)
// =============================================================================

/**
 * Get system usage statistics (admin only)
 */
export const getSystemUsage = query({
  handler: async (ctx) => {
    // Require analytics permissions
    await requirePermission(ctx, 'usage_analytics');

    const [users, chats, messages] = await Promise.all([
      ctx.db.query('users').collect(),
      ctx.db.query('chats').collect(),
      ctx.db.query('messages').collect(),
    ]);

    // Calculate additional metrics
    const now = Date.now();
    const dayAgo = now - (24 * 60 * 60 * 1000);
    const weekAgo = now - (7 * 24 * 60 * 60 * 1000);
    
    const recentlyActiveUsers = users.filter(u => 
      u.lastActiveAt && u.lastActiveAt > dayAgo
    ).length;

    const recentMessages = messages.filter(m => 
      m.createdAt && m.createdAt > weekAgo
    ).length;

    return {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.isActive).length,
      recentlyActiveUsers,
      totalChats: chats.length,
      totalMessages: messages.length,
      recentMessages,
      avgMessagesPerChat: chats.length > 0 ? messages.length / chats.length : 0,
      // Add more system metrics as needed
      systemHealth: {
        dbConnected: true, // Would check actual DB connectivity
        lastUpdate: now,
      }
    };
  },
});