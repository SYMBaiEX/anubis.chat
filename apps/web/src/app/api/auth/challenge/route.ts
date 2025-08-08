/**
 * Authentication Challenge Endpoint
 * Generates SIWE-compatible challenge for wallet authentication
 */

import { PublicKey } from '@solana/web3.js';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createNonce } from '@/lib/middleware/auth';
import { authRateLimit } from '@/lib/middleware/rate-limit';
import type { WalletAuthChallenge } from '@/lib/types/api';
import {
  addSecurityHeaders,
  successResponse,
  validationErrorResponse,
} from '@/lib/utils/api-response';
import { createModuleLogger } from '@/lib/utils/logger';

const log = createModuleLogger('auth-challenge-api');

// =============================================================================
// Request Validation
// =============================================================================

const challengeSchema = z.object({
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
// Challenge Generation
// =============================================================================

async function generateChallenge(
  publicKey: string
): Promise<WalletAuthChallenge> {
  const domain = process.env.NEXT_PUBLIC_DOMAIN || 'localhost:3001';
  const nonce = await createNonce(publicKey);
  const expirationTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  // Create a simple, wallet-compatible message
  // Using a minimal format to ensure compatibility with all wallet adapters
  const challenge = `ISIS Chat Authentication\n\nNonce: ${nonce}`;

  return {
    challenge,
    expiresAt: expirationTime.toISOString(),
    nonce,
  };
}

// =============================================================================
// Route Handlers
// =============================================================================

export async function POST(request: NextRequest) {
  return authRateLimit(request, async (req) => {
    try {
      // Parse and validate request body
      const body = await req.json();
      const validation = challengeSchema.safeParse(body);

      if (!validation.success) {
        return validationErrorResponse(
          'Invalid request parameters',
          validation.error.flatten().fieldErrors
        );
      }

      const { publicKey } = validation.data;

      // Generate challenge
      const challenge = await generateChallenge(publicKey);

      // Add security headers and return response
      const response = successResponse(challenge);
      return addSecurityHeaders(response);
    } catch (error) {
      log.error('Challenge generation error', {
        error: error instanceof Error ? error.message : String(error),
      });

      return validationErrorResponse('Failed to generate challenge');
    }
  });
}

export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  return addSecurityHeaders(response);
}
