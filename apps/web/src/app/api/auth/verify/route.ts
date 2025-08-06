/**
 * Authentication Verification Endpoint
 * Verifies wallet signature and issues JWT token
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { PublicKey } from '@solana/web3.js';
import { 
  verifyWalletSignature, 
  validateNonce, 
  createJWTToken 
} from '@/lib/middleware/auth';
import { authRateLimit } from '@/lib/middleware/rate-limit';
import { 
  successResponse, 
  validationErrorResponse,
  unauthorizedResponse,
  addSecurityHeaders 
} from '@/lib/utils/api-response';
import type { AuthSession } from '@/lib/types/api';

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
    const domainMatch = lines[0]?.match(/^(.+) wants you to sign in with your Solana account:$/);
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

    if (!uriMatch || !versionMatch || !chainIdMatch || !nonceMatch || !issuedAtMatch || !expirationTimeMatch) {
      return null;
    }

    return {
      domain,
      publicKey,
      statement,
      uri: uriMatch[1],
      version: versionMatch[1],
      chainId: parseInt(chainIdMatch[1]),
      nonce: nonceMatch[1],
      issuedAt: issuedAtMatch[1],
      expirationTime: expirationTimeMatch[1],
    };
  } catch (error) {
    console.error('Message parsing failed:', error);
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
        return validationErrorResponse(
          'Invalid message format'
        );
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
      const expectedURI = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
      if (parsedMessage.uri !== expectedURI) {
        return unauthorizedResponse('Invalid URI');
      }
      
      // Validate nonce (prevent replay attacks)
      if (!validateNonce(publicKey, parsedMessage.nonce)) {
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
      
      // TODO: Create or update user in database
      // This would typically involve calling a Convex mutation
      
      // Create auth session response
      const authSession: AuthSession = {
        walletAddress,
        publicKey,
        token,
        refreshToken: '', // TODO: Implement refresh tokens
        expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
        user: {
          walletAddress,
          publicKey,
          displayName: undefined,
          avatar: undefined,
          preferences: {
            theme: 'dark',
            aiModel: 'gpt-4o',
            notifications: true,
          },
          subscription: {
            tier: 'free',
            tokensUsed: 0,
            tokensLimit: 10000,
            features: ['basic_chat', 'document_upload'],
          },
          createdAt: Date.now(),
          lastActiveAt: Date.now(),
          isActive: true,
        },
      };
      
      // Add security headers and return response
      const response = successResponse(authSession);
      return addSecurityHeaders(response);
      
    } catch (error) {
      console.error('Authentication verification error:', error);
      
      return unauthorizedResponse('Authentication failed');
    }
  });
}

export async function OPTIONS(request: NextRequest) {
  const response = new Response(null, { status: 200 });
  return addSecurityHeaders(response);
}