/**
 * Logout Endpoint
 * Invalidates user session and clears authentication
 */

import { type NextRequest, NextResponse } from 'next/server';
import { type AuthenticatedRequest, withAuth } from '@/lib/middleware/auth';
import { generalRateLimit } from '@/lib/middleware/rate-limit';
import {
  addSecurityHeaders,
  noContentResponse,
} from '@/lib/utils/api-response';
import { createModuleLogger } from '@/lib/utils/logger';

const log = createModuleLogger('auth-logout-api');

// =============================================================================
// Route Handlers
// =============================================================================

export async function POST(request: NextRequest) {
  return generalRateLimit(request, async (req) => {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
      try {
        const { walletAddress } = authReq.user;

        // Invalidate token server-side by blacklisting it
        const authHeader = authReq.headers.get('Authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.substring(7);
          const { blacklistToken } = await import('@/lib/middleware/auth');
          const blacklisted = await blacklistToken(token);
          if (blacklisted) {
            log.info('Token blacklisted for user', { walletAddress });
          }
        }

        log.info('User logged out successfully', { walletAddress, timestamp: new Date().toISOString() });

        // Return 204 No Content for successful logout
        const response = noContentResponse();
        return addSecurityHeaders(response);
      } catch (error) {
        log.error('Logout error', { error: error instanceof Error ? error.message : String(error) });

        // Even if there's an error, we still want to indicate successful logout
        // from the client's perspective
        const response = noContentResponse();
        return addSecurityHeaders(response);
      }
    });
  });
}

export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  return addSecurityHeaders(response);
}
