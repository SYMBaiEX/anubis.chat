/**
 * Current User Endpoint
 * Returns authenticated user's profile information
 */

import { type NextRequest, NextResponse } from 'next/server';
import { type AuthenticatedRequest, withAuth } from '@/lib/middleware/auth';
import { generalRateLimit } from '@/lib/middleware/rate-limit';
import type { UserProfile } from '@/lib/types/api';
import { 
  addSecurityHeaders, 
  successResponse, 
  internalErrorResponse 
} from '@/lib/utils/api-response';

// =============================================================================
// Route Handlers
// =============================================================================

export async function GET(request: NextRequest) {
  return generalRateLimit(request, async (req) => {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
      try {
        const { walletAddress, publicKey } = authReq.user;

        // TODO: Fetch user profile from Convex database
        // const userProfile = await getUserProfile(walletAddress);

        // Mock user profile for now - in production this would come from Convex
        const userProfile: UserProfile = {
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
            tokensLimit: 10_000,
            features: ['basic_chat', 'document_upload'],
          },
          createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
          lastActiveAt: Date.now(),
          isActive: true,
        };

        // Add security headers and return response
        const response = successResponse(userProfile);
        return addSecurityHeaders(response);
      } catch (error) {
        console.error('Get user profile error:', error);
        return internalErrorResponse('Failed to retrieve user profile');
      }
    });
  });
}

export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  return addSecurityHeaders(response);
}
