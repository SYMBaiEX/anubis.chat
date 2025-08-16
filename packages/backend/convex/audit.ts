import { v } from 'convex/values';
import { mutation } from './_generated/server';
import { requireAdmin } from './authHelpers';

// Generic admin audit logging mutation
export const logAdminAction = mutation({
  args: {
    action: v.string(),
    // Optional targets: user IDs or arbitrary string references
    targets: v.optional(v.array(v.union(v.id('users'), v.string()))),
    // Optional metadata: simple JSON-like values
    metadata: v.optional(
      v.record(
        v.string(),
        v.union(v.string(), v.number(), v.boolean(), v.null()),
      ),
    ),
    ip: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireAdmin(ctx, 'admin');

    await ctx.db.insert('auditLogs', {
      action: args.action,
      actorUserId: user._id,
      actorWallet: user.walletAddress,
      actorRole: user.role,
      targets: args.targets,
      metadata: args.metadata,
      ip: args.ip,
      userAgent: args.userAgent,
      createdAt: Date.now(),
    });

    return { success: true } as const;
  },
});
