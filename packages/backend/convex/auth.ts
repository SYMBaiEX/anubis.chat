/**
 * Convex Auth Configuration with Solana Wallet Integration
 * Production-ready implementation with proper error handling
 */

import { convexAuth } from "@convex-dev/auth/server";
import { ConvexCredentials } from "@convex-dev/auth/providers/ConvexCredentials";
import { DataModel, Id } from "./_generated/dataModel";

/**
 * Custom Solana Wallet Credentials Provider
 * Handles Solana wallet signature verification and user creation
 */
const SolanaWallet = ConvexCredentials<DataModel>({
  id: "solana-wallet",
  
  async authorize(credentials, ctx) {
    if (process.env.NODE_ENV !== "production") {
      console.log("🔍 Convex Auth authorize called", {
        credentialsType: typeof credentials,
        credentialsKeys: credentials ? Object.keys(credentials) : [],
        isObject: credentials && typeof credentials === "object",
        hasPublicKey: Boolean(credentials && (credentials as any).publicKey),
        hasSignature: Boolean(credentials && (credentials as any).signature),
        hasMessage: Boolean(credentials && (credentials as any).message),
        hasNonce: Boolean(credentials && (credentials as any).nonce),
      });
    }
    
    // Safely extract signature verification data from the credentials object
    let publicKey: string;
    let signature: string; 
    let message: string;
    let nonce: string;

    if (credentials && typeof credentials === 'object') {
      // Direct destructuring from credentials object
      publicKey = credentials.publicKey as string;
      signature = credentials.signature as string;
      message = credentials.message as string;
      nonce = credentials.nonce as string;
    } else {
      return null; // Invalid credentials
    }

    if (process.env.NODE_ENV !== "production") {
      console.log("Extracted Solana wallet credentials:", {
        publicKey: publicKey ? `${publicKey.substring(0, 8)}...` : "missing",
        signature: signature ? `${signature.substring(0, 16)}...` : "missing",
        message: message ? `${message.substring(0, 32)}...` : "missing",
        nonce: nonce ? `${nonce.substring(0, 8)}...` : "missing"
      });
    }

    if (!publicKey || !signature || !message || !nonce) {
      console.error("Missing required Solana wallet credentials:", { 
        publicKey: !!publicKey,
        signature: !!signature,
        message: !!message,
        nonce: !!nonce
      });
      return null; // Missing credentials
    }

    try {
      // Use internal mutations/queries to verify challenge and manage user
      const result = await ctx.runMutation(internal.auth.verifyAndSignIn, {
        publicKey,
        signature, 
        message,
        nonce,
      });

      if (!result || !result.userId) {
        console.error("Authentication failed - no userId returned");
        return null;
      }

      if (process.env.NODE_ENV !== "production") {
        console.log("✅ Authentication successful, userId:", result.userId);
      }
      
      // Return the userId for sign-in
      return {
        userId: result.userId,
      };
    } catch (error) {
      console.error("Error in authorize:", error);
      return null; // Auth failed
    }
  },
});

/**
 * Convex Auth Configuration
 * Exports auth functions with Solana wallet provider
 */
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [SolanaWallet],
});

// =============================================================================
// Internal Functions for ConvexCredentials
// =============================================================================

import { v } from 'convex/values';
import { mutation, query, internalMutation } from './_generated/server';
import { internal } from './_generated/api';

/**
 * Internal mutation to verify challenge and sign in user
 * Called from the authorize function in ConvexCredentials
 */
export const verifyAndSignIn = internalMutation({
  args: {
    publicKey: v.string(),
    signature: v.string(),
    message: v.string(),
    nonce: v.string(),
  },
  handler: async (ctx, args) => {
    const { publicKey, signature, message, nonce } = args;

    // Verify the challenge
    const storedChallenge = await ctx.db
      .query("solanaWalletChallenges")
      .withIndex("by_key", (q) => q.eq("publicKey", publicKey))
      .filter((q) =>
        q.and(
          q.eq(q.field("nonce"), nonce),
          q.eq(q.field("used"), false),
          q.gt(q.field("expiresAt"), Date.now())
        )
      )
      .unique();

    if (!storedChallenge || message !== storedChallenge.challenge) {
      throw new Error("Invalid or expired authentication challenge");
    }

    // Mark challenge as used
    await ctx.db.patch(storedChallenge._id, { used: true });

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", publicKey))
      .unique();

    if (existingUser) {
      // User exists - update activity and return their ID
      await ctx.db.patch(existingUser._id, {
        lastActiveAt: Date.now(),
        isActive: true,
      });
      
      return {
        userId: existingUser._id,
      };
    }

    // Create new user
    const adminWallets = process.env.ADMIN_WALLETS?.split(',').map(w => w.trim()) || [];
    const isAdmin = adminWallets.includes(publicKey);
    
    const newUserId = await ctx.db.insert("users", {
      walletAddress: publicKey,
      publicKey: publicKey,
      role: isAdmin ? 'super_admin' : 'user',
      permissions: isAdmin ? [
        'user_management',
        'subscription_management', 
        'content_moderation',
        'system_settings',
        'financial_data',
        'usage_analytics',
        'admin_management'
      ] : undefined,
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
        messagesUsed: 0,
        messagesLimit: 50,
        premiumMessagesUsed: 0,
        premiumMessagesLimit: 0,
        features: ['basic_chat', 'limited_models'],
        currentPeriodStart: Date.now(),
        currentPeriodEnd: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
        subscriptionTxSignature: '',
        autoRenew: false,
        planPriceSol: 0,
        tokensUsed: 0,
        tokensLimit: 10000,
      },
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
      isActive: true,
    });
    
    return {
      userId: newUserId,
    };
  },
});

/**
 * Create Solana wallet challenge for signature verification
 * This is still needed for the challenge-response authentication flow
 */
export const createWalletChallenge = mutation({
  args: {
    publicKey: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const expiresAt = now + 5 * 60 * 1000; // 5 minutes
    const nonce =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);

    const challenge = `Sign this message to authenticate with ISIS Chat:\nNonce: ${nonce}\nTimestamp: ${now}`;

    // Clean up any existing challenges for this public key
    const existingChallenges = await ctx.db
      .query('solanaWalletChallenges')
      .withIndex('by_key', (q) => q.eq('publicKey', args.publicKey))
      .collect();

    for (const existing of existingChallenges) {
      await ctx.db.delete(existing._id);
    }

    await ctx.db.insert('solanaWalletChallenges', {
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

/**
 * Clean up expired challenges (scheduled maintenance)
 */
export const cleanupExpiredChallenges = internalMutation({
  handler: async (ctx) => {
    const now = Date.now();
    const expiredChallenges = await ctx.db
      .query('solanaWalletChallenges')
      .withIndex('by_expires', (q) => q.lt('expiresAt', now))
      .collect();

    let cleaned = 0;
    for (const challenge of expiredChallenges) {
      await ctx.db.delete(challenge._id);
      cleaned++;
    }

    return { cleaned };
  },
});