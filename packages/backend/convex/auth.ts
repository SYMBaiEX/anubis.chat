import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

// JWT Token Blacklist Management
export const blacklistToken = mutation({
  args: {
    tokenId: v.string(),
    userId: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    const blacklistId = await ctx.db.insert('blacklistedTokens', {
      tokenId: args.tokenId,
      userId: args.userId,
      expiresAt: args.expiresAt,
      blacklistedAt: Date.now(),
    });

    return await ctx.db.get(blacklistId);
  },
});

export const isTokenBlacklisted = query({
  args: { tokenId: v.string() },
  handler: async (ctx, args) => {
    const blacklistedToken = await ctx.db
      .query('blacklistedTokens')
      .withIndex('by_token', (q) => q.eq('tokenId', args.tokenId))
      .unique();

    if (!blacklistedToken) {
      return false;
    }

    // Check if token has expired
    if (blacklistedToken.expiresAt < Date.now()) {
      // Clean up expired token
      await ctx.db.delete(blacklistedToken._id);
      return false;
    }

    return true;
  },
});

export const cleanupExpiredTokens = mutation({
  handler: async (ctx) => {
    const now = Date.now();
    const expiredTokens = await ctx.db
      .query('blacklistedTokens')
      .withIndex('by_expires', (q) => q.lt('expiresAt', now))
      .collect();

    let cleaned = 0;
    for (const token of expiredTokens) {
      await ctx.db.delete(token._id);
      cleaned++;
    }

    return { cleaned };
  },
});

// Nonce Management
export const storeNonce = mutation({
  args: {
    publicKey: v.string(),
    nonce: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    // Remove any existing nonce for this public key
    const existingNonce = await ctx.db
      .query('nonces')
      .withIndex('by_key', (q) => q.eq('publicKey', args.publicKey))
      .unique();

    if (existingNonce) {
      await ctx.db.delete(existingNonce._id);
    }

    const nonceId = await ctx.db.insert('nonces', {
      publicKey: args.publicKey,
      nonce: args.nonce,
      expiresAt: args.expiresAt,
      createdAt: Date.now(),
    });

    return await ctx.db.get(nonceId);
  },
});

export const validateAndRemoveNonce = mutation({
  args: {
    publicKey: v.string(),
    nonce: v.string(),
  },
  handler: async (ctx, args) => {
    const storedNonce = await ctx.db
      .query('nonces')
      .withIndex('by_key', (q) => q.eq('publicKey', args.publicKey))
      .unique();

    if (!storedNonce) {
      return false;
    }

    const now = Date.now();

    // Check if nonce has expired
    if (storedNonce.expiresAt <= now) {
      await ctx.db.delete(storedNonce._id);
      return false;
    }

    // Check if nonce matches
    if (storedNonce.nonce !== args.nonce) {
      return false;
    }

    // Remove nonce after successful validation (prevent replay)
    await ctx.db.delete(storedNonce._id);
    return true;
  },
});

export const cleanupExpiredNonces = mutation({
  handler: async (ctx) => {
    const now = Date.now();
    const expiredNonces = await ctx.db
      .query('nonces')
      .withIndex('by_expires', (q) => q.lt('expiresAt', now))
      .collect();

    let cleaned = 0;
    for (const nonce of expiredNonces) {
      await ctx.db.delete(nonce._id);
      cleaned++;
    }

    return { cleaned };
  },
});

// Get user's blacklisted tokens (for admin purposes)
export const getUserBlacklistedTokens = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('blacklistedTokens')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .order('desc')
      .collect();
  },
});

// System health check for auth components
export const getAuthStats = query({
  handler: async (ctx) => {
    const now = Date.now();

    const [blacklistedTokens, activeNonces] = await Promise.all([
      ctx.db.query('blacklistedTokens').collect(),
      ctx.db.query('nonces').collect(),
    ]);

    const expiredTokens = blacklistedTokens.filter(
      (token) => token.expiresAt < now
    );
    const activeTokens = blacklistedTokens.filter(
      (token) => token.expiresAt >= now
    );
    const expiredNonces = activeNonces.filter((nonce) => nonce.expiresAt < now);
    const validNonces = activeNonces.filter((nonce) => nonce.expiresAt >= now);

    return {
      blacklistedTokens: {
        total: blacklistedTokens.length,
        active: activeTokens.length,
        expired: expiredTokens.length,
      },
      nonces: {
        total: activeNonces.length,
        valid: validNonces.length,
        expired: expiredNonces.length,
      },
      needsCleanup: expiredTokens.length > 0 || expiredNonces.length > 0,
    };
  },
});
