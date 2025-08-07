/**
 * Token Refresh Endpoint
 * Refreshes JWT tokens for authenticated users
 */

import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createJWTToken, verifyJWTToken } from '@/lib/middleware/auth';
import { authRateLimit } from '@/lib/middleware/rate-limit';
import {
  addSecurityHeaders,
  successResponse,
  unauthorizedResponse,
  validationErrorResponse,
} from '@/lib/utils/api-response';
import { createModuleLogger } from '@/lib/utils/logger';

const log = createModuleLogger('auth-refresh-api');

// =============================================================================
// Request Validation
// =============================================================================

const refreshSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

// =============================================================================
// Route Handlers
// =============================================================================

export async function POST(request: NextRequest) {
  return authRateLimit(request, async (req) => {
    try {
      // Parse and validate request body
      const body = await req.json();
      const validation = refreshSchema.safeParse(body);

      if (!validation.success) {
        return validationErrorResponse(
          'Invalid request parameters',
          validation.error.flatten().fieldErrors
        );
      }

      const { token } = validation.data;

      // Verify the current token
      const session = await verifyJWTToken(token);
      if (!session) {
        return unauthorizedResponse('Invalid or expired token');
      }

      // Check if token is within refresh window (e.g., last 6 hours of validity)
      const refreshWindowStart = session.expiresAt - 6 * 60 * 60 * 1000; // 6 hours before expiration
      const now = Date.now();

      if (now < refreshWindowStart) {
        return validationErrorResponse('Token refresh not yet available', {
          refreshAvailableAt: new Date(refreshWindowStart).toISOString(),
          currentTime: new Date(now).toISOString(),
        });
      }

      // Generate new JWT token
      const newToken = createJWTToken(session.walletAddress, session.publicKey);

      // TODO: Update user's last active time in database
      // This would typically involve calling a Convex mutation

      const refreshResponse = {
        token: newToken,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
        refreshedAt: Date.now(),
      };

      // Add security headers and return response
      const response = successResponse(refreshResponse);
      return addSecurityHeaders(response);
    } catch (error) {
      log.error('Token refresh error', {
        error: error instanceof Error ? error.message : String(error),
      });

      return unauthorizedResponse('Token refresh failed');
    }
  });
}

export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  return addSecurityHeaders(response);
}
