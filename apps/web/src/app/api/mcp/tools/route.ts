/**
 * MCP Tools API Route
 * Provides access to MCP server tools and tool execution
 */

import { type NextRequest, NextResponse } from 'next/server';
import {
  DEFAULT_MCP_SERVERS,
  initializeDefaultMCPServers,
  mcpManager,
} from '@/lib/mcp/client';
import {
  internalErrorResponse,
  successResponse,
} from '@/lib/utils/api-response';

// Initialize MCP servers on first request
let mcpInitialized = false;

async function ensureMCPInitialized() {
  if (!mcpInitialized) {
    try {
      await initializeDefaultMCPServers();
      mcpInitialized = true;
    } catch (error) {
      console.error('Failed to initialize MCP servers:', error);
    }
  }
}

// GET /api/mcp/tools - List available MCP tools
export async function GET(request: NextRequest) {
  try {
    await ensureMCPInitialized();

    const serverName = request.nextUrl.searchParams.get('server');

    if (serverName) {
      const tools = mcpManager.getServerTools(serverName);
      if (!tools) {
        return NextResponse.json(
          { error: `Server ${serverName} not found or has no tools` },
          { status: 404 }
        );
      }
      return successResponse({ server: serverName, tools: Object.keys(tools) });
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

    return successResponse({ tools: toolList });
  } catch (error) {
    console.error('Error listing MCP tools:', error);
    return internalErrorResponse('Failed to list MCP tools');
  }
}

// POST /api/mcp/tools - Execute an MCP tool
export async function POST(request: NextRequest) {
  try {
    await ensureMCPInitialized();

    const body = await request.json();
    const { server, tool, args } = body;

    if (!(server && tool)) {
      return NextResponse.json(
        { error: 'Server and tool names are required' },
        { status: 400 }
      );
    }

    const result = await mcpManager.callTool(server, tool, args || {});

    return successResponse({
      server,
      tool,
      result,
    });
  } catch (error) {
    console.error('Error executing MCP tool:', error);
    return internalErrorResponse('Failed to execute MCP tool');
  }
}
