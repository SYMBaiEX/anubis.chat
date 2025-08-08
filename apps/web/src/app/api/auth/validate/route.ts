/**
 * Token Validation Endpoint
 * Validates JWT tokens for session persistence
 */

import type { NextRequest } from 'next/server';
import { verifyJWTToken } from '@/lib/middleware/auth';
import { 
  successResponse, 
  unauthorizedResponse,
  internalErrorResponse 
} from '@/lib/utils/api-response';
import { createModuleLogger } from '@/lib/utils/logger';

const log = createModuleLogger('auth-validate');

interface ValidateResponse {
  valid: boolean;
  user?: {
    id: string;
    walletAddress: string;
  };
  expiresAt?: number;
}

export async function POST(request: NextRequest) {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      log.warn('Invalid authorization header');
      return unauthorizedResponse('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);
    
    // Verify the token
    const session = await verifyJWTToken(token);
    
    if (!session) {
      log.info('Token validation failed');
      return successResponse<ValidateResponse>({ valid: false });
    }

    // Token is valid
    log.info('Token validated successfully', {
      walletAddress: session.walletAddress,
      expiresAt: session.expiresAt,
    });

    return successResponse<ValidateResponse>({
      valid: true,
      user: {
        id: session.walletAddress, // Using wallet address as ID
        walletAddress: session.walletAddress,
      },
      expiresAt: session.expiresAt,
    });
  } catch (error) {
    log.error('Token validation error', {
      error: error instanceof Error ? error.message : String(error),
    });
    
    return internalErrorResponse('Failed to validate token');
  }
}

// Support OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}