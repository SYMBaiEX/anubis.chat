/**
 * MCP Server Management API
 * Handles MCP server initialization and status
 */

import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { DEFAULT_MCP_SERVERS, mcpManager } from '@/lib/mcp/client';
import {
  ensureMCPServersInitialized,
  isMCPInitialized,
} from '@/lib/mcp/initialize';
import { MCPTransportType } from '@/lib/types/mcp';
import { type AuthenticatedRequest, withAuth } from '@/lib/middleware/auth';
import { aiRateLimit } from '@/lib/middleware/rate-limit';
import {
  addSecurityHeaders,
  createdResponse,
  successResponse,
  validationErrorResponse,
} from '@/lib/utils/api-response';

// =============================================================================
// Request Validation
// =============================================================================

const toolPropertySchema: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    z.object({
      type: z.enum([
        'string',
        'number',
        'integer',
        'boolean',
        'array',
        'object',
        'null',
      ]),
      description: z.string().optional(),
      enum: z
        .array(z.union([z.string(), z.number(), z.boolean(), z.null()]))
        .optional(),
      default: z
        .union([z.string(), z.number(), z.boolean(), z.null()])
        .optional(),
      minimum: z.number().optional(),
      maximum: z.number().optional(),
      minLength: z.number().optional(),
      maxLength: z.number().optional(),
      pattern: z.string().optional(),
      format: z.string().optional(),
      items: z.lazy(() => toolPropertySchema).optional(),
      properties: z.record(z.string(), z.lazy(() => toolPropertySchema)).optional(),
      required: z.array(z.string()).optional(),
      additionalProperties: z.boolean().optional(),
    }),
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
  ])
);

const toolSchemaSchema = z.object({
  type: z.enum(['object', 'array', 'string', 'number', 'boolean', 'null']),
  properties: z.record(z.string(), toolPropertySchema).optional(),
  items: toolPropertySchema.optional(),
  required: z.array(z.string()).optional(),
  additionalProperties: z.boolean().optional(),
  description: z.string().optional(),
  default: z.unknown().optional(),
});

const initServerSchema = z.object({
  name: z.string().min(1),
  transport: z.object({
    type: z.nativeEnum(MCPTransportType),
    command: z.string().optional(),
    args: z.array(z.string()).optional(),
    url: z.string().optional(),
    headers: z.record(z.string(), z.string()).optional(),
    sessionId: z.string().optional(),
    env: z.record(z.string(), z.string()).optional(),
    timeout: z.number().optional(),
  }),
  description: z.string().optional(),
  toolSchemas: z.record(z.string(), z.object({}).passthrough()).optional(),
  enabled: z.boolean().optional(),
  autoConnect: z.boolean().optional(),
  priority: z.number().optional(),
});

// =============================================================================
// Route Handlers
// =============================================================================

/**
 * GET /api/mcp/servers - Get MCP server status and available tools
 */
export async function GET(request: NextRequest) {
  return aiRateLimit(request, async (req) => {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
      try {
        // Ensure MCP servers are initialized
        await ensureMCPServersInitialized();

        // Get all available tools from all servers
        const allTools = mcpManager.getAllTools();
        const toolNames = Object.keys(allTools);

        // Get server status
        const servers = DEFAULT_MCP_SERVERS.map((server) => ({
          name: server.name,
          description: server.description,
          transport: server.transport.type,
          tools: Object.keys(mcpManager.getServerTools(server.name) || {}),
        }));

        const response = successResponse({
          initialized: isMCPInitialized(),
          servers,
          totalTools: toolNames.length,
          availableTools: toolNames,
        });

        return addSecurityHeaders(response);
      } catch (error) {
        console.error('Get MCP servers error:', error);
        const response = NextResponse.json(
          { error: 'Failed to get MCP server status' },
          { status: 500 }
        );
        return addSecurityHeaders(response);
      }
    });
  });
}

/**
 * POST /api/mcp/servers - Initialize a new MCP server
 */
export async function POST(request: NextRequest) {
  return aiRateLimit(request, async (req) => {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
      try {
        const body = await req.json();
        const validation = initServerSchema.safeParse(body);

        if (!validation.success) {
          return validationErrorResponse(
            'Invalid server configuration',
            validation.error.flatten().fieldErrors
          );
        }

        const serverConfig = validation.data;

        // Initialize the server (temporarily remove toolSchemas to avoid type conflict)
        const { toolSchemas, ...configWithoutSchemas } = serverConfig;
        await mcpManager.initializeClient(configWithoutSchemas);

        // Get the tools from the newly initialized server
        const tools = mcpManager.getServerTools(serverConfig.name);
        const toolNames = tools ? Object.keys(tools) : [];

        console.log(
          `✅ Initialized MCP server: ${serverConfig.name} with ${toolNames.length} tools`
        );

        const response = createdResponse({
          name: serverConfig.name,
          description: serverConfig.description,
          transport: serverConfig.transport.type,
          tools: toolNames,
        });

        return addSecurityHeaders(response);
      } catch (error) {
        console.error('Initialize MCP server error:', error);
        const response = NextResponse.json(
          { error: 'Failed to initialize MCP server' },
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
