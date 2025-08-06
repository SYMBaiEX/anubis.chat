/**
 * Authentication Middleware for ISIS Chat
 * Based on latest Solana wallet patterns and August 2025 best practices
 */

import { NextRequest } from 'next/server';
import { verify, sign } from 'jsonwebtoken';
import { PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { APIErrorCode } from '../types/api';
import { createErrorResponse } from '../utils/api-response';

// =============================================================================
// Types
// =============================================================================

export interface AuthenticatedRequest extends NextRequest {
  user: {
    walletAddress: string;
    publicKey: string;
  };
}

export interface WalletSession {
  walletAddress: string;
  publicKey: string;
  issuedAt: number;
  expiresAt: number;
}

// =============================================================================
// JWT Token Management
// =============================================================================

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-development';
if (process.env.NODE_ENV === 'production' && JWT_SECRET === 'fallback-secret-key-for-development') {
  throw new Error('JWT_SECRET environment variable is required in production');
}

export function createJWTToken(walletAddress: string, publicKey: string): string {
  const payload: WalletSession = {
    walletAddress,
    publicKey,
    issuedAt: Date.now(),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  };

  return sign(payload, JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: '24h',
  });
}

export function verifyJWTToken(token: string): WalletSession | null {
  try {
    const decoded = verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
    }) as unknown as WalletSession;

    // Check if token is expired
    if (decoded.expiresAt < Date.now()) {
      return null;
    }

    return decoded;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

// =============================================================================
// Wallet Signature Verification
// =============================================================================

export function verifyWalletSignature(
  message: string,
  signature: string,
  publicKey: string
): boolean {
  try {
    const messageBytes = bs58.decode(message);
    const signatureBytes = bs58.decode(signature);
    const publicKeyBytes = new PublicKey(publicKey).toBytes();

    return nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKeyBytes
    );
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
}

// =============================================================================
// Nonce Management
// =============================================================================

// In-memory nonce store (in production, use Redis or database)
const nonces = new Map<string, { nonce: string; expires: number }>();

export function createNonce(publicKey: string): string {
  // Generate cryptographically secure nonce
  const nonce = bs58.encode(crypto.getRandomValues(new Uint8Array(32)));
  const expires = Date.now() + 5 * 60 * 1000; // 5 minutes

  nonces.set(publicKey, { nonce, expires });

  // Cleanup expired nonces
  setTimeout(() => {
    const stored = nonces.get(publicKey);
    if (stored && stored.expires <= Date.now()) {
      nonces.delete(publicKey);
    }
  }, 5 * 60 * 1000);

  return nonce;
}

export function validateNonce(publicKey: string, nonce: string): boolean {
  const stored = nonces.get(publicKey);
  
  if (!stored) {
    return false;
  }

  if (stored.expires <= Date.now()) {
    nonces.delete(publicKey);
    return false;
  }

  if (stored.nonce !== nonce) {
    return false;
  }

  // Remove nonce after successful validation (prevent replay)
  nonces.delete(publicKey);
  return true;
}

// =============================================================================
// Authentication Middleware
// =============================================================================

export async function withAuth<T extends NextRequest>(
  request: T,
  handler: (req: AuthenticatedRequest) => Promise<Response>
): Promise<Response> {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return createErrorResponse(
        APIErrorCode.UNAUTHORIZED,
        'Missing or invalid authorization header'
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify JWT token
    const session = verifyJWTToken(token);
    if (!session) {
      return createErrorResponse(
        APIErrorCode.TOKEN_EXPIRED,
        'Invalid or expired token'
      );
    }

    // Validate wallet address format
    if (!isValidSolanaAddress(session.walletAddress)) {
      return createErrorResponse(
        APIErrorCode.INVALID_TOKEN,
        'Invalid wallet address in token'
      );
    }

    // Create authenticated request
    const authenticatedRequest = Object.assign(request, {
      user: {
        walletAddress: session.walletAddress,
        publicKey: session.publicKey,
      }
    }) as AuthenticatedRequest;

    // Call the handler with authenticated request
    return await handler(authenticatedRequest);

  } catch (error) {
    console.error('Authentication middleware error:', error);
    return createErrorResponse(
      APIErrorCode.INTERNAL_ERROR,
      'Authentication failed'
    );
  }
}

// =============================================================================
// Optional Authentication Middleware
// =============================================================================

export async function withOptionalAuth<T extends NextRequest>(
  request: T,
  handler: (req: T & { user?: { walletAddress: string; publicKey: string } }) => Promise<Response>
): Promise<Response> {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const session = verifyJWTToken(token);
      
      if (session && isValidSolanaAddress(session.walletAddress)) {
        (request as any).user = {
          walletAddress: session.walletAddress,
          publicKey: session.publicKey,
        };
      }
    }

    return await handler(request as T & { user?: { walletAddress: string; publicKey: string } });

  } catch (error) {
    // For optional auth, we continue without auth on errors
    console.error('Optional authentication error:', error);
    return await handler(request as T & { user?: { walletAddress: string; publicKey: string } });
  }
}

// =============================================================================
// Validation Helpers
// =============================================================================

export function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
  } catch {
    return false;
  }
}

export function extractWalletFromRequest(request: NextRequest): string | null {
  // Try Authorization header first
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const session = verifyJWTToken(token);
    return session?.walletAddress || null;
  }

  // Try custom wallet headers (for direct wallet integration)
  const walletAddress = request.headers.get('X-Wallet-Address');
  if (walletAddress && isValidSolanaAddress(walletAddress)) {
    return walletAddress;
  }

  return null;
}

// =============================================================================
// Rate Limiting Integration
// =============================================================================

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  skipSuccessfulRequests?: boolean;
}

const rateLimits = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  walletAddress: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const windowStart = Math.floor(now / config.windowMs) * config.windowMs;
  const resetTime = windowStart + config.windowMs;
  
  const key = `${walletAddress}:${windowStart}`;
  const current = rateLimits.get(key) || { count: 0, resetTime };
  
  if (current.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: current.resetTime,
    };
  }

  // Increment counter
  current.count++;
  rateLimits.set(key, current);

  // Cleanup old entries
  setTimeout(() => {
    for (const [k, v] of rateLimits.entries()) {
      if (v.resetTime <= now) {
        rateLimits.delete(k);
      }
    }
  }, config.windowMs);

  return {
    allowed: true,
    remaining: config.maxRequests - current.count,
    resetTime: current.resetTime,
  };
}

// =============================================================================
// CORS Headers for Web3 Compatibility
// =============================================================================

export function addWeb3CorsHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  
  headers.set('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGINS || '*');
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 
    'Content-Type, Authorization, X-Wallet-Signature, X-Wallet-Message, X-Wallet-Pubkey, X-Timestamp'
  );
  headers.set('Access-Control-Max-Age', '86400'); // 24 hours

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}