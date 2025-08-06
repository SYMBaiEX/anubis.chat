/**
 * Logout Endpoint
 * Invalidates user session and clears authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, type AuthenticatedRequest } from '@/lib/middleware/auth';
import { generalRateLimit } from '@/lib/middleware/rate-limit';
import { 
  noContentResponse,
  addSecurityHeaders 
} from '@/lib/utils/api-response';

// =============================================================================
// Route Handlers
// =============================================================================

export async function POST(request: NextRequest) {
  return generalRateLimit(request, async (req) => {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
      try {
        const { walletAddress } = authReq.user;
        
        // TODO: Invalidate token server-side
        // In a production environment, you would:
        // 1. Add the token to a blacklist/revocation list
        // 2. Update user's last logout time in database
        // 3. Clear any active sessions
        
        console.log(`User ${walletAddress} logged out at ${new Date().toISOString()}`);
        
        // TODO: Update user logout time in Convex
        // await updateUserLogoutTime(walletAddress);
        
        // Return 204 No Content for successful logout
        const response = noContentResponse();
        return addSecurityHeaders(response);
        
      } catch (error) {
        console.error('Logout error:', error);
        
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