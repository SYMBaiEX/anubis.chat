/**
 * MCP Tools API Route
 * Provides access to MCP server tools and tool execution
 */

import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  DEFAULT_MCP_SERVERS,
  initializeDefaultMCPServers,
  mcpManager,
} from '@/lib/mcp/client';
import { type AuthenticatedRequest, withAuth } from '@/lib/middleware/auth';
import { aiRateLimit } from '@/lib/middleware/rate-limit';
import {
  internalErrorResponse,
  successResponse,
  validationErrorResponse,
} from '@/lib/utils/api-response';
import {
  addSecurityHeaders,
  createCorsPreflightResponse,
} from '@/lib/utils/cors';
import { createModuleLogger } from '@/lib/utils/logger';

const log = createModuleLogger('mcp-tools-api');

// =============================================================================
// Request Validation Schemas
// =============================================================================

const getToolsQuerySchema = z.object({
  server: z.string().min(1).max(100).optional(),
});

const executeToolSchema = z.object({
  server: z
    .string()
    .min(1, 'Server name is required')
    .max(100, 'Server name too long')
    .regex(/^[a-zA-Z0-9\-_]+$/, 'Server name contains invalid characters'),
  tool: z
    .string()
    .min(1, 'Tool name is required')
    .max(200, 'Tool name too long')
    .regex(/^[a-zA-Z0-9\-_.]+$/, 'Tool name contains invalid characters'),
  args: z
    .record(z.string(), z.unknown())
    .optional()
    .superRefine((args, ctx) => {
      if (!args) return;
      const serialized = JSON.stringify(args);
      if (serialized.length > 10_000) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Arguments payload too large (max 10KB)',
        });
      }
    }),
});

// =============================================================================
// MCP Initialization Singleton
// =============================================================================

class MCPInitializer {
  private static instance: MCPInitializer;
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): MCPInitializer {
    if (!MCPInitializer.instance) {
      MCPInitializer.instance = new MCPInitializer();
    }
    return MCPInitializer.instance;
  }

  async ensureInitialized(): Promise<void> {
    if (this.initialized) {
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.initialize();
    return this.initPromise;
  }

  private async initialize(): Promise<void> {
    try {
      await initializeDefaultMCPServers();
      this.initialized = true;
      log.info('MCP servers initialized successfully', {
        component: 'MCPInitializer',
      });
    } catch (error) {
      log.error('Failed to initialize MCP servers', {
        error: error instanceof Error ? error.message : String(error),
        component: 'MCPInitializer',
      });
      this.initPromise = null; // Allow retry on next request
      throw error;
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}

const mcpInitializer = MCPInitializer.getInstance();

async function ensureMCPInitialized(): Promise<void> {
  return mcpInitializer.ensureInitialized();
}

// GET /api/mcp/tools - List available MCP tools
export async function GET(request: NextRequest) {
  return aiRateLimit(request, async (req) => {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
      const origin = req.headers.get('origin');

      try {
        await ensureMCPInitialized();

        // Validate query parameters
        const server = req.nextUrl.searchParams.get('server');
        const queryValidation = getToolsQuerySchema.safeParse({ server });

        if (!queryValidation.success) {
          const errorResponse = validationErrorResponse(
            'Invalid query parameters',
            queryValidation.error.flatten().fieldErrors
          );
          return addSecurityHeaders(errorResponse, origin);
        }

        const { server: serverName } = queryValidation.data;

        if (serverName) {
          const tools = mcpManager.getServerTools(serverName);
          if (!tools) {
            const errorResponse = NextResponse.json(
              { error: `Server ${serverName} not found or has no tools` },
              { status: 404 }
            );
            return addSecurityHeaders(errorResponse, origin);
          }
          const response = successResponse({
            server: serverName,
            tools: Object.keys(tools),
          });
          return addSecurityHeaders(response, origin);
        }

        // Return all tools from all servers
        const allTools = mcpManager.getAllTools();
        const toolList = Object.keys(allTools).map((name) => {
          const [server, ...toolParts] = name.split('_');
          return {
            fullName: name,
            server,
            tool: toolParts.join('_'),
          };
        });

        const response = successResponse({ tools: toolList });
        return addSecurityHeaders(response, origin);
      } catch (error) {
        log.error('Error listing MCP tools', {
          error: error instanceof Error ? error.message : String(error),
          method: 'GET',
          endpoint: '/api/mcp/tools',
        });
        const errorResponse = internalErrorResponse('Failed to list MCP tools');
        return addSecurityHeaders(errorResponse, origin);
      }
    });
  });
}

// POST /api/mcp/tools - Execute an MCP tool
export async function POST(request: NextRequest) {
  return aiRateLimit(request, async (req) => {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
      const origin = req.headers.get('origin');

      try {
        await ensureMCPInitialized();

        // Parse and validate request body
        let body: any;
        try {
          const rawBody = await req.text();

          // Check payload size (max 100KB)
          if (rawBody.length > 100_000) {
            const errorResponse = validationErrorResponse(
              'Request payload too large',
              {
                maxSize: '100KB',
                actualSize: `${Math.round(rawBody.length / 1000)}KB`,
              }
            );
            return addSecurityHeaders(errorResponse, origin);
          }

          body = JSON.parse(rawBody);
        } catch (parseError) {
          const errorResponse = validationErrorResponse(
            'Invalid JSON in request body',
            {
              error:
                parseError instanceof Error
                  ? parseError.message
                  : 'Parse error',
            }
          );
          return addSecurityHeaders(errorResponse, origin);
        }

        // Validate request structure
        const validation = executeToolSchema.safeParse(body);
        if (!validation.success) {
          const errorResponse = validationErrorResponse(
            'Invalid request data',
            validation.error.flatten().fieldErrors
          );
          return addSecurityHeaders(errorResponse, origin);
        }

        const { server, tool, args } = validation.data;

        // Verify server exists
        const availableServers = mcpManager.getConnectedServers();
        if (!availableServers.includes(server)) {
          const errorResponse = NextResponse.json(
            {
              error: `Server '${server}' is not available`,
              availableServers,
            },
            { status: 404 }
          );
          return addSecurityHeaders(errorResponse, origin);
        }

        // Verify tool exists on server
        const serverTools = mcpManager.getServerTools(server);
        if (!(serverTools && serverTools[tool])) {
          const errorResponse = NextResponse.json(
            {
              error: `Tool '${tool}' not found on server '${server}'`,
              availableTools: serverTools ? Object.keys(serverTools) : [],
            },
            { status: 404 }
          );
          return addSecurityHeaders(errorResponse, origin);
        }

        // Execute tool with timeout
        const executionTimeout = 30_000; // 30 seconds
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('Tool execution timeout')),
            executionTimeout
          )
        );

        const result = await Promise.race([
          mcpManager.callTool(server, tool, args || {}),
          timeoutPromise,
        ]);

        const response = successResponse({
          server,
          tool,
          result,
          executionTime: Date.now(),
        });
        return addSecurityHeaders(response, origin);
      } catch (error) {
        log.error('Error executing MCP tool', {
          error: error instanceof Error ? error.message : String(error),
          method: 'POST',
          endpoint: '/api/mcp/tools',
        });

        // Provide more specific error messages
        let errorMessage = 'Failed to execute MCP tool';
        let statusCode = 500;

        if (error instanceof Error) {
          if (error.message.includes('timeout')) {
            errorMessage = 'Tool execution timed out';
            statusCode = 504;
          } else if (error.message.includes('not found')) {
            errorMessage = 'Requested resource not found';
            statusCode = 404;
          } else if (error.message.includes('permission')) {
            errorMessage = 'Permission denied';
            statusCode = 403;
          }
        }

        const errorResponse = NextResponse.json(
          {
            error: errorMessage,
            details: error instanceof Error ? error.message : String(error),
            timestamp: Date.now(),
          },
          { status: statusCode }
        );
        return addSecurityHeaders(errorResponse, origin);
      }
    });
  });
}

// OPTIONS /api/mcp/tools - Handle preflight requests
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  return addSecurityHeaders(response);
}
