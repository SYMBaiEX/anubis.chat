/**
 * Subscription Status API
 * Returns current subscription status and usage information
 */

import { type NextRequest, NextResponse } from 'next/server';
import { convexConfig } from '@/lib/env';
import { verifyAuthToken } from '@/lib/middleware/subscription-auth';
import { authRateLimit } from '@/lib/middleware/rate-limit';
import {
  addSecurityHeaders,
  internalErrorResponse,
  successResponse,
  unauthorizedResponse,
} from '@/lib/utils/api-response';
import { createModuleLogger } from '@/lib/utils/logger';

const log = createModuleLogger('subscription-status-api');

// =============================================================================
// Route Handlers
// =============================================================================

export async function GET(request: NextRequest) {
  return authRateLimit(request, async (req) => {
    try {
      // Verify authentication
      const authResult = await verifyAuthToken(req);
      if (!(authResult.success && authResult.walletAddress)) {
        return unauthorizedResponse('Authentication required');
      }

      // Initialize Convex client
      const convexUrl = convexConfig.publicUrl;
      if (!convexUrl) {
        throw new Error(
          'NEXT_PUBLIC_CONVEX_URL environment variable is required'
        );
      }

      const convexClient = new (
        await import('convex/browser')
      ).ConvexHttpClient(convexUrl);

      // Get subscription status
      const { api } = await import('@convex/_generated/api');
      const subscriptionStatus = await convexClient.query(
        api.subscriptions.getSubscriptionStatusByWallet,
        { walletAddress: authResult.walletAddress }
      );

      if (!subscriptionStatus) {
        return internalErrorResponse('Subscription status not found');
      }

      log.info('Subscription status retrieved', {
        walletAddress: authResult.walletAddress,
        tier: subscriptionStatus.tier,
        messagesUsed: subscriptionStatus.messagesUsed,
      });

      const response = successResponse(subscriptionStatus);
      return addSecurityHeaders(response);
    } catch (error) {
      log.error('Subscription status error', {
        error: error instanceof Error ? error.message : String(error),
      });

      return internalErrorResponse('Failed to get subscription status');
    }
  });
}

export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  return addSecurityHeaders(response);
}
