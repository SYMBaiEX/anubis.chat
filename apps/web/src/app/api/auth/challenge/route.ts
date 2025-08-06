/**
 * Authentication Challenge Endpoint
 * Generates SIWE-compatible challenge for wallet authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PublicKey } from '@solana/web3.js';
import { createNonce } from '@/lib/middleware/auth';
import { authRateLimit } from '@/lib/middleware/rate-limit';
import { 
  successResponse, 
  validationErrorResponse,
  addSecurityHeaders 
} from '@/lib/utils/api-response';
import type { WalletAuthChallenge } from '@/lib/types/api';

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

async function generateChallenge(publicKey: string): Promise<WalletAuthChallenge> {
  const domain = process.env.NEXT_PUBLIC_DOMAIN || 'localhost:3001';
  const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
  const nonce = await createNonce(publicKey);
  const expirationTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
  
  // Create SIWE-compatible message
  const challenge = [
    `${domain} wants you to sign in with your Solana account:`,
    publicKey,
    '',
    'Sign in to ISIS Chat',
    '',
    `URI: ${origin}`,
    `Version: 1`,
    `Chain ID: 1`,
    `Nonce: ${nonce}`,
    `Issued At: ${new Date().toISOString()}`,
    `Expiration Time: ${expirationTime.toISOString()}`,
  ].join('\n');

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
      console.error('Challenge generation error:', error);
      
      return validationErrorResponse(
        'Failed to generate challenge'
      );
    }
  });
}

export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  return addSecurityHeaders(response);
}