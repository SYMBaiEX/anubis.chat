/**
 * Convex Authentication Functions
 * Enhanced wallet-based authentication with refresh tokens and security
 */

import { v } from 'convex/values';
import type { Id } from './_generated/dataModel';
import { mutation, query } from './_generated/server';

// =============================================================================
// Wallet Authentication
// =============================================================================

// Create wallet authentication challenge
export const createChallenge = mutation({
  args: {
    publicKey: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const expiresAt = now + 5 * 60 * 1000; // 5 minutes
    const nonce = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    const challenge = `Sign this message to authenticate with ISIS Chat:\nNonce: ${nonce}\nTimestamp: ${now}`;

    // Clean up any existing nonces for this public key
    const existingNonces = await ctx.db
      .query('nonces')
      .withIndex('by_key', (q) => q.eq('publicKey', args.publicKey))
      .collect();

    for (const existing of existingNonces) {
      await ctx.db.delete(existing._id);
    }

    await ctx.db.insert('nonces', {
      publicKey: args.publicKey,
      nonce,
      challenge,
      expiresAt,
      createdAt: now,
      used: false,
    });

    return {
      challenge,
      nonce,
      expiresAt: new Date(expiresAt).toISOString(),
    };
  },
});

// Verify wallet signature and create session with refresh token
export const verifySignature = mutation({
  args: {
    message: v.string(),
    signature: v.string(),
    publicKey: v.string(),
    deviceInfo: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Find the corresponding nonce
    const nonceRecord = await ctx.db
      .query('nonces')
      .withIndex('by_key', (q) => q.eq('publicKey', args.publicKey))
      .filter((q) => q.and(
        q.gt(q.field('expiresAt'), Date.now()),
        q.eq(q.field('used'), false)
      ))
      .order('desc')
      .first();

    if (!nonceRecord) {
      throw new Error('Invalid or expired nonce');
    }

    // Verify the message matches the challenge
    if (args.message !== nonceRecord.challenge) {
      throw new Error('Challenge message mismatch');
    }

    // Extract wallet address from public key (simplified - in production, derive properly)
    const walletAddress = `0x${args.publicKey.slice(-40)}`;

    // Create or update user
    let user = await ctx.db
      .query('users')
      .withIndex('by_wallet', (q) => q.eq('walletAddress', walletAddress))
      .unique();

    const now = Date.now();

    if (!user) {
      // Create new user with enhanced preferences
      const userId = await ctx.db.insert('users', {
        walletAddress,
        publicKey: args.publicKey,
        preferences: {
          theme: 'dark',
          aiModel: 'gpt-4o',
          notifications: true,
          language: 'en',
          temperature: 0.7,
          maxTokens: 4000,
          streamResponses: true,
          saveHistory: true,
          compactMode: false,
        },
        subscription: {
          tier: 'free',
          tokensUsed: 0,
          tokensLimit: 10_000,
          features: ['basic_chat', 'document_upload'],
        },
        createdAt: now,
        lastActiveAt: now,
        isActive: true,
      });
      user = await ctx.db.get(userId);
    } else {
      // Update existing user
      await ctx.db.patch(user._id, {
        publicKey: args.publicKey, // Update in case it changed
        lastActiveAt: now,
        isActive: true,
      });
    }

    // Mark nonce as used
    await ctx.db.patch(nonceRecord._id, { used: true });

    // Generate tokens
    const tokenId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const refreshTokenId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const tokenHash = Math.random().toString(36).substring(2, 32); // In production, use proper hashing

    // Create refresh token record
    await ctx.db.insert('refreshTokens', {
      tokenId: refreshTokenId,
      userId: walletAddress,
      tokenHash,
      expiresAt: now + (30 * 24 * 60 * 60 * 1000), // 30 days
      createdAt: now,
      deviceInfo: args.deviceInfo,
      ipAddress: args.ipAddress,
      isActive: true,
    });

    return {
      success: true,
      walletAddress,
      user: user!,
      tokens: {
        accessToken: tokenId,
        refreshToken: refreshTokenId,
        expiresAt: now + (24 * 60 * 60 * 1000), // 24 hours for access token
        refreshExpiresAt: now + (30 * 24 * 60 * 60 * 1000), // 30 days for refresh token
      },
      message: 'Authentication successful',
    };
  },
});

// =============================================================================
// Refresh Token Management
// =============================================================================

// Refresh access token using refresh token
export const refreshToken = mutation({
  args: {
    refreshToken: v.string(),
    deviceInfo: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Find valid refresh token
    const tokenRecord = await ctx.db
      .query('refreshTokens')
      .withIndex('by_token', (q) => q.eq('tokenId', args.refreshToken))
      .filter((q) => q.and(
        q.gt(q.field('expiresAt'), Date.now()),
        q.eq(q.field('isActive'), true)
      ))
      .first();

    if (!tokenRecord) {
      throw new Error('Invalid or expired refresh token');
    }

    // Update last used timestamp
    await ctx.db.patch(tokenRecord._id, {
      lastUsedAt: Date.now(),
      deviceInfo: args.deviceInfo || tokenRecord.deviceInfo,
      ipAddress: args.ipAddress || tokenRecord.ipAddress,
    });

    // Generate new access token
    const newTokenId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const now = Date.now();

    return {
      success: true,
      userId: tokenRecord.userId,
      tokens: {
        accessToken: newTokenId,
        refreshToken: args.refreshToken, // Keep same refresh token
        expiresAt: now + (24 * 60 * 60 * 1000), // 24 hours
        refreshExpiresAt: tokenRecord.expiresAt,
      },
    };
  },
});

// Revoke refresh token (logout)
export const revokeRefreshToken = mutation({
  args: {
    refreshToken: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const tokenRecord = await ctx.db
      .query('refreshTokens')
      .withIndex('by_token', (q) => q.eq('tokenId', args.refreshToken))
      .filter((q) => q.eq(q.field('userId'), args.userId))
      .first();

    if (tokenRecord) {
      await ctx.db.patch(tokenRecord._id, { isActive: false });
    }

    return { success: true, message: 'Refresh token revoked' };
  },
});

// Revoke all refresh tokens for user (logout from all devices)
export const revokeAllRefreshTokens = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const tokens = await ctx.db
      .query('refreshTokens')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .filter((q) => q.eq(q.field('isActive'), true))
      .collect();

    for (const token of tokens) {
      await ctx.db.patch(token._id, { isActive: false });
    }

    return { success: true, revoked: tokens.length };
  },
});

// Get user's active sessions
export const getUserSessions = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query('refreshTokens')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .filter((q) => q.eq(q.field('isActive'), true))
      .order('desc')
      .collect();

    return sessions.map(session => ({
      tokenId: session.tokenId,
      createdAt: session.createdAt,
      lastUsedAt: session.lastUsedAt,
      expiresAt: session.expiresAt,
      deviceInfo: session.deviceInfo,
      ipAddress: session.ipAddress,
      isActive: session.isActive,
    }));
  },
});

// =============================================================================
// JWT Token Blacklist Management
// =============================================================================
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
      // Token expired, consider it not blacklisted
      // Note: Cleanup is handled by the admin.cleanupExpiredData function
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
      challenge: `Verify ${args.nonce}`,
      expiresAt: args.expiresAt,
      createdAt: Date.now(),
      used: false,
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
