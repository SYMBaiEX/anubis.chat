/**
 * User Profile Management Endpoint
 * Handles user profile updates and retrieval
 */

import { api } from '@convex/_generated/api';
import { fetchMutation, fetchQuery } from 'convex/nextjs';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { type AuthenticatedRequest, withAuth } from '@/lib/middleware/auth';
import { generalRateLimit } from '@/lib/middleware/rate-limit';
import type { UserProfile } from '@/lib/types/api';
import {
  Language,
  SubscriptionFeature,
  SubscriptionTier,
  Theme,
} from '@/lib/types/api';
import {
  addSecurityHeaders,
  successResponse,
  validationErrorResponse,
} from '@/lib/utils/api-response';
import { createModuleLogger } from '@/lib/utils/logger';

const log = createModuleLogger('user-profile-api');

// =============================================================================
// Request Validation
// =============================================================================

const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  avatar: z.string().url().optional(),
  preferences: z
    .object({
      theme: z.nativeEnum(Theme).optional(),
      aiModel: z.string().optional(),
      notifications: z.boolean().optional(),
      language: z.nativeEnum(Language).optional(),
      temperature: z.number().min(0).max(2).optional(),
      maxTokens: z.number().min(1).max(8000).optional(),
    })
    .optional(),
});

// =============================================================================
// Route Handlers
// =============================================================================

export async function GET(request: NextRequest) {
  return generalRateLimit(request, async (req) => {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
      try {
        const { walletAddress, publicKey } = authReq.user;
        const user = await fetchQuery(api.users.getUserByWallet, { walletAddress });
        let userProfile: UserProfile;

        if (user) {
          userProfile = {
            walletAddress: user.walletAddress,
            publicKey: user.publicKey,
            displayName: user.displayName,
            avatar: user.avatar,
            preferences: {
              theme:
                user.preferences?.theme === 'light' ? Theme.LIGHT : Theme.DARK,
              aiModel: user.preferences?.aiModel || 'gpt-4o',
              notifications: user.preferences?.notifications ?? true,
              language: (user.preferences?.language as any) || Language.EN,
              temperature: user.preferences?.temperature,
              maxTokens: user.preferences?.maxTokens,
            },
            subscription: {
              tier:
                (user.subscription?.tier?.toLowerCase() as any) ||
                SubscriptionTier.FREE,
              tokensUsed: user.subscription?.tokensUsed ?? 0,
              tokensLimit: user.subscription?.tokensLimit ?? 10_000,
              features: (user.subscription?.features as any[]) || [
                SubscriptionFeature.BASIC_CHAT,
              ],
            },
            createdAt: user.createdAt,
            lastActiveAt: user.lastActiveAt,
            isActive: user.isActive,
          };
        } else {
          userProfile = {
            walletAddress,
            publicKey,
            displayName: undefined,
            avatar: undefined,
            preferences: {
              theme: Theme.DARK,
              aiModel: 'gpt-4o',
              notifications: true,
              language: Language.EN,
            },
            subscription: {
              tier: SubscriptionTier.FREE,
              tokensUsed: 0,
              tokensLimit: 10_000,
              features: [SubscriptionFeature.BASIC_CHAT],
            },
            createdAt: Date.now(),
            lastActiveAt: Date.now(),
            isActive: true,
          };
        }

        const response = successResponse(userProfile);
        return addSecurityHeaders(response);
      } catch (error) {
        log.error('Get user profile error', {
          error: error instanceof Error ? error.message : String(error),
        });

        // Return minimal profile on error
        const response = successResponse({
          walletAddress: authReq.user.walletAddress,
          publicKey: authReq.user.publicKey,
          preferences: {
            theme: Theme.DARK,
            aiModel: 'gpt-4o',
            notifications: true,
          },
          subscription: {
            tier: SubscriptionTier.FREE,
            tokensUsed: 0,
            tokensLimit: 10_000,
            features: [SubscriptionFeature.BASIC_CHAT],
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

        // Update preferences/profile via Convex mutations
        let updatedUser = null as any;
        if (updates.displayName !== undefined || updates.avatar !== undefined) {
          updatedUser = await fetchMutation(api.users.updateProfile, {
            walletAddress,
            displayName: updates.displayName,
            avatar: updates.avatar,
          });
        }

        if (updates.preferences) {
          updatedUser = await fetchMutation(api.users.updatePreferences, {
            walletAddress,
            preferences: {
              theme:
                updates.preferences.theme === Theme.LIGHT ? 'light' : 'dark',
              aiModel: updates.preferences.aiModel || 'gpt-4o',
              notifications: updates.preferences.notifications ?? true,
              language: updates.preferences.language as any,
              temperature: updates.preferences.temperature,
              maxTokens: updates.preferences.maxTokens,
              streamResponses: undefined,
              saveHistory: undefined,
              compactMode: undefined,
            },
          });
        }

        const user =
          updatedUser ||
          (await fetchQuery(api.users.getUserByWallet, { walletAddress }));
        const updatedProfile: UserProfile = {
          walletAddress: user.walletAddress,
          publicKey: user.publicKey,
          displayName: user.displayName,
          avatar: user.avatar,
          preferences: {
            theme:
              user.preferences?.theme === 'light' ? Theme.LIGHT : Theme.DARK,
            aiModel: user.preferences?.aiModel || 'gpt-4o',
            notifications: user.preferences?.notifications ?? true,
            language: (user.preferences?.language as any) || Language.EN,
            temperature: user.preferences?.temperature,
            maxTokens: user.preferences?.maxTokens,
          },
          subscription: {
            tier:
              (user.subscription?.tier?.toLowerCase() as any) ||
              SubscriptionTier.FREE,
            tokensUsed: user.subscription?.tokensUsed ?? 0,
            tokensLimit: user.subscription?.tokensLimit ?? 10_000,
            features: (user.subscription?.features as any[]) || [
              SubscriptionFeature.BASIC_CHAT,
            ],
          },
          createdAt: user.createdAt,
          lastActiveAt: user.lastActiveAt,
          isActive: user.isActive,
        };

        log.info('Profile updated for user', { walletAddress });

        const response = successResponse(updatedProfile);
        return addSecurityHeaders(response);
      } catch (error) {
        log.error('Update profile error', {
          error: error instanceof Error ? error.message : String(error),
        });
        return validationErrorResponse('Failed to update profile');
      }
    });
  });
}

export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  return addSecurityHeaders(response);
}
