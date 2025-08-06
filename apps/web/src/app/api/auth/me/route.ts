/**
 * Current User Endpoint
 * Returns authenticated user's profile information
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, type AuthenticatedRequest } from '@/lib/middleware/auth';
import { generalRateLimit } from '@/lib/middleware/rate-limit';
import { 
  successResponse,
  addSecurityHeaders 
} from '@/lib/utils/api-response';
import type { UserProfile } from '@/lib/types/api';

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
        
        // Mock user profile for now
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
            tokensLimit: 10000,
            features: ['basic_chat', 'document_upload'],
          },
          createdAt: Date.now() - (7 * 24 * 60 * 60 * 1000), // 7 days ago
          lastActiveAt: Date.now(),
          isActive: true,
        };
        
        // Add security headers and return response
        const response = successResponse(userProfile);
        return addSecurityHeaders(response);
        
      } catch (error) {
        console.error('Get user profile error:', error);
        
        return successResponse({
          walletAddress: authReq.user.walletAddress,
          publicKey: authReq.user.publicKey,
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
            features: ['basic_chat'],
          },
          createdAt: Date.now(),
          lastActiveAt: Date.now(),
          isActive: true,
        });
      }
    });
  });
}

export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  return addSecurityHeaders(response);
}