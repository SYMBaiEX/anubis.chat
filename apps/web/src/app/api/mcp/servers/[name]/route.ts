/**
 * MCP Server Individual Management API
 * Handles operations on specific MCP servers
 */

import { type NextRequest, NextResponse } from 'next/server';
import { mcpManager } from '@/lib/mcp/client';
import { type AuthenticatedRequest, withAuth } from '@/lib/middleware/auth';
import { aiRateLimit } from '@/lib/middleware/rate-limit';
import {
  addSecurityHeaders,
  successResponse,
  validationErrorResponse,
} from '@/lib/utils/api-response';

// =============================================================================
// Route Handlers
// =============================================================================

/**
 * DELETE /api/mcp/servers/[name] - Close an MCP server connection
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  return aiRateLimit(request, async (req) => {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
      try {
        const { name: serverName } = await params;

        if (!serverName) {
          return validationErrorResponse('Server name is required', {});
        }

        // Close the server
        await mcpManager.closeClient(serverName);

        console.log(`✅ Closed MCP server: ${serverName}`);

        const response = successResponse({
          message: `Server ${serverName} closed successfully`,
        });

        return addSecurityHeaders(response);
      } catch (error) {
        console.error('Close MCP server error:', error);
        const response = NextResponse.json(
          { error: 'Failed to close MCP server' },
          { status: 500 }
        );
        return addSecurityHeaders(response);
      }
    });
  });
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  return addSecurityHeaders(response);
}