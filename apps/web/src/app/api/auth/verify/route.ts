/**
 * Authentication Verification Endpoint
 * Verifies wallet signature and issues JWT token
 */

import { PublicKey } from '@solana/web3.js';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getStorage } from '@/lib/database/storage';
import {
  createJWTToken,
  validateNonce,
  verifyWalletSignature,
} from '@/lib/middleware/auth';
import { authRateLimit } from '@/lib/middleware/rate-limit';
import type { AuthSession } from '@/lib/types/api';
import { SubscriptionFeature, SubscriptionTier, Theme } from '@/lib/types/api';
import {
  addSecurityHeaders,
  successResponse,
  unauthorizedResponse,
  validationErrorResponse,
} from '@/lib/utils/api-response';
import { createModuleLogger } from '@/lib/utils/logger';

const log = createModuleLogger('auth-verify-api');

// =============================================================================
// Request Validation
// =============================================================================

const verifySchema = z.object({
  message: z.string().min(1, 'Message is required'),
  signature: z.string().min(1, 'Signature is required'),
  publicKey: z.string().refine((key) => {
    try {
      new PublicKey(key);
      return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(key);
    } catch {
      return false;
    }
  }, 'Invalid Solana public key'),
});

// =============================================================================
// Message Parsing
// =============================================================================

function parseSignInMessage(message: string): {
  domain: string;
  publicKey: string;
  statement: string;
  uri: string;
  version: string;
  chainId: number;
  nonce: string;
  issuedAt: string;
  expirationTime: string;
} | null {
  try {
    const lines = message.split('\n');

    // Parse SIWE-style message format
    const domainMatch = lines[0]?.match(
      /^(.+) wants you to sign in with your Solana account:$/
    );
    if (!domainMatch) return null;

    const domain = domainMatch[1];
    const publicKey = lines[1];
    const statement = lines[3];

    // Parse URI, Version, Chain ID, Nonce, Issued At, Expiration Time
    const uriMatch = lines[5]?.match(/^URI: (.+)$/);
    const versionMatch = lines[6]?.match(/^Version: (\d+)$/);
    const chainIdMatch = lines[7]?.match(/^Chain ID: (\d+)$/);
    const nonceMatch = lines[8]?.match(/^Nonce: (.+)$/);
    const issuedAtMatch = lines[9]?.match(/^Issued At: (.+)$/);
    const expirationTimeMatch = lines[10]?.match(/^Expiration Time: (.+)$/);

    if (
      !(
        uriMatch &&
        versionMatch &&
        chainIdMatch &&
        nonceMatch &&
        issuedAtMatch &&
        expirationTimeMatch
      )
    ) {
      return null;
    }

    return {
      domain,
      publicKey,
      statement,
      uri: uriMatch[1],
      version: versionMatch[1],
      chainId: Number.parseInt(chainIdMatch[1]),
      nonce: nonceMatch[1],
      issuedAt: issuedAtMatch[1],
      expirationTime: expirationTimeMatch[1],
    };
  } catch (error) {
    log.error('Message parsing failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

// =============================================================================
// Route Handlers
// =============================================================================

export async function POST(request: NextRequest) {
  return authRateLimit(request, async (req) => {
    try {
      // Parse and validate request body
      const body = await req.json();
      const validation = verifySchema.safeParse(body);

      if (!validation.success) {
        return validationErrorResponse(
          'Invalid request parameters',
          validation.error.flatten().fieldErrors
        );
      }

      const { message, signature, publicKey } = validation.data;

      // Parse the signed message
      const parsedMessage = parseSignInMessage(message);
      if (!parsedMessage) {
        return validationErrorResponse('Invalid message format');
      }

      // Validate the public key matches
      if (parsedMessage.publicKey !== publicKey) {
        return unauthorizedResponse('Public key mismatch');
      }

      // Check message expiration
      const expirationTime = new Date(parsedMessage.expirationTime);
      if (expirationTime < new Date()) {
        return unauthorizedResponse('Challenge expired');
      }

      // Validate domain (prevent replay attacks from other domains)
      const expectedDomain = process.env.NEXT_PUBLIC_DOMAIN || 'localhost:3001';
      if (parsedMessage.domain !== expectedDomain) {
        return unauthorizedResponse('Invalid domain');
      }

      // Validate URI
      const expectedURI =
        process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
      if (parsedMessage.uri !== expectedURI) {
        return unauthorizedResponse('Invalid URI');
      }

      // Validate nonce (prevent replay attacks)
      if (!(await validateNonce(publicKey, parsedMessage.nonce))) {
        return unauthorizedResponse('Invalid or expired nonce');
      }

      // Verify wallet signature
      if (!verifyWalletSignature(message, signature, publicKey)) {
        return unauthorizedResponse('Invalid signature');
      }

      // Create wallet address (base58 encoded public key)
      const walletAddress = new PublicKey(publicKey).toString();

      // Generate JWT token
      const token = createJWTToken(walletAddress, publicKey);

      // Create or update user in Convex database
      const storage = getStorage();
      let user;

      try {
        // Using ConvexHttpClient to call the users.upsert mutation
        const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
        if (!convexUrl) {
          throw new Error(
            'NEXT_PUBLIC_CONVEX_URL environment variable is required'
          );
        }

        const convexClient = new (
          await import('convex/browser')
        ).ConvexHttpClient(convexUrl);

        user = await convexClient.mutation(
          (await import('@convex/_generated/api')).api.users.upsert,
          {
            walletAddress,
            publicKey,
            preferences: {
              theme: 'dark' as 'dark' | 'light',
              aiModel: 'gpt-4o',
              notifications: true,
            },
          }
        );
      } catch (error) {
        // Failed to create/update user in database
        // Continue with default user data if database operation fails
        user = {
          walletAddress,
          publicKey,
          displayName: undefined,
          avatar: undefined,
          preferences: {
            theme: 'dark' as 'dark' | 'light',
            aiModel: 'gpt-4o',
            notifications: true,
          },
          subscription: {
            tier: 'free' as 'free' | 'pro' | 'enterprise',
            tokensUsed: 0,
            tokensLimit: 10_000,
            features: ['basic_chat', 'document_upload'],
          },
          createdAt: Date.now(),
          lastActiveAt: Date.now(),
          isActive: true,
        };
      }

      // Create auth session response
      const authSession: AuthSession = {
        walletAddress,
        publicKey,
        token,
        refreshToken: '', // TODO: Implement refresh tokens
        expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
        user: user!, // We ensure user is always defined above
      };

      // Add security headers and return response
      const response = successResponse(authSession);
      return addSecurityHeaders(response);
    } catch (error) {
      log.error('Authentication verification error', {
        error: error instanceof Error ? error.message : String(error),
      });

      return unauthorizedResponse('Authentication failed');
    }
  });
}

export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  return addSecurityHeaders(response);
}
