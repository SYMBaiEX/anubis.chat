/**
 * User Profile Management Endpoint
 * Handles user profile updates and retrieval
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth, type AuthenticatedRequest } from '@/lib/middleware/auth';
import { generalRateLimit } from '@/lib/middleware/rate-limit';
import { 
  successResponse,
  validationErrorResponse,
  addSecurityHeaders 
} from '@/lib/utils/api-response';
import type { UserProfile } from '@/lib/types/api';

// =============================================================================
// Request Validation
// =============================================================================

const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  avatar: z.string().url().optional(),
  preferences: z.object({
    theme: z.enum(['light', 'dark']).optional(),
    aiModel: z.string().optional(),
    notifications: z.boolean().optional(),
    language: z.string().optional(),
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().min(1).max(8000).optional(),
  }).optional(),
});

// =============================================================================
// Route Handlers
// =============================================================================

export async function GET(request: NextRequest) {
  return generalRateLimit(request, async (req) => {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
      try {
        const { walletAddress, publicKey } = authReq.user;
        
        // TODO: Fetch user profile from Convex
        // const userProfile = await getUserProfile(walletAddress);
        
        // Mock response for now
        const userProfile: UserProfile = {
          walletAddress,
          publicKey,
          displayName: undefined,
          avatar: undefined,
          preferences: {
            theme: 'dark',
            aiModel: 'gpt-4o',
            notifications: true,
            language: 'en',
          },
          subscription: {
            tier: 'free',
            tokensUsed: 150,
            tokensLimit: 10000,
            features: ['basic_chat', 'document_upload'],
          },
          createdAt: Date.now() - (30 * 24 * 60 * 60 * 1000), // 30 days ago
          lastActiveAt: Date.now() - (5 * 60 * 1000), // 5 minutes ago
          isActive: true,
        };
        
        const response = successResponse(userProfile);
        return addSecurityHeaders(response);
        
      } catch (error) {
        console.error('Get user profile error:', error);
        
        // Return minimal profile on error
        const response = successResponse({
          walletAddress: authReq.user.walletAddress,
          publicKey: authReq.user.publicKey,
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
        
        return addSecurityHeaders(response);
      }
    });
  });
}

export async function PUT(request: NextRequest) {
  return generalRateLimit(request, async (req) => {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
      try {
        const { walletAddress } = authReq.user;
        
        // Parse and validate request body
        const body = await req.json();
        const validation = updateProfileSchema.safeParse(body);
        
        if (!validation.success) {
          return validationErrorResponse(
            'Invalid profile data',
            validation.error.flatten().fieldErrors
          );
        }
        
        const updates = validation.data;
        
        // TODO: Update user profile in Convex
        // const updatedProfile = await updateUserProfile(walletAddress, updates);
        
        // Mock updated profile
        const updatedProfile: UserProfile = {
          walletAddress: authReq.user.walletAddress,
          publicKey: authReq.user.publicKey,
          displayName: updates.displayName,
          avatar: updates.avatar,
          preferences: {
            theme: updates.preferences?.theme || 'dark',
            aiModel: updates.preferences?.aiModel || 'gpt-4o',
            notifications: updates.preferences?.notifications ?? true,
            language: updates.preferences?.language || 'en',
            temperature: updates.preferences?.temperature,
            maxTokens: updates.preferences?.maxTokens,
          },
          subscription: {
            tier: 'free',
            tokensUsed: 150,
            tokensLimit: 10000,
            features: ['basic_chat', 'document_upload'],
          },
          createdAt: Date.now() - (30 * 24 * 60 * 60 * 1000),
          lastActiveAt: Date.now(),
          isActive: true,
        };
        
        console.log(`Profile updated for user ${walletAddress}`);
        
        const response = successResponse(updatedProfile);
        return addSecurityHeaders(response);
        
      } catch (error) {
        console.error('Update profile error:', error);
        return validationErrorResponse('Failed to update profile');
      }
    });
  });
}

export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  return addSecurityHeaders(response);
}