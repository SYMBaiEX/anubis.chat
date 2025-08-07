/**
 * MCP Client Integration
 * Provides integration with Model Context Protocol servers for tool calling
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
// We'll store MCP tool definitions, not AI SDK tools
import { z } from 'zod';
import type { MCPTransportConfig as MCPTransportConfigType } from '@/lib/types/mcp';
import { MCPTransportType } from '@/lib/types/mcp';
import { createModuleLogger } from '@/lib/utils/logger';

const log = createModuleLogger('mcp-client');

// Re-export the transport config from types/mcp.ts for backwards compatibility
export type MCPTransportConfig = MCPTransportConfigType;

// MCP Server Configuration
export interface MCPServerConfig {
  name: string;
  transport: MCPTransportConfig;
  description?: string;
  toolSchemas?: Record<string, z.ZodObject<any, any>>;
}

// MCP Client Manager
export class MCPClientManager {
  private clients: Map<string, Client> = new Map();
  private transports: Map<string, Transport> = new Map();
  private tools: Map<string, Record<string, any>> = new Map();

  /**
   * Initialize an MCP client with the specified configuration
   */
  async initializeClient(config: MCPServerConfig): Promise<void> {
    const transport = await this.createTransport(config.transport);

    const client = new Client(
      {
        name: config.name,
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );

    await client.connect(transport);

    this.clients.set(config.name, client);
    this.transports.set(config.name, transport);

    // Initialize tools from the server
    await this.initializeTools(config.name, config.toolSchemas);
  }

  /**
   * Create transport based on configuration
   */
  private async createTransport(
    config: MCPTransportConfig
  ): Promise<Transport> {
    switch (config.type) {
      case MCPTransportType.STDIO:
        if (!config.command) {
          throw new Error('Command is required for stdio transport');
        }
        return new StdioClientTransport({
          command: config.command,
          args: config.args || [],
          env: config.env,
        });

      case MCPTransportType.SSE:
        if (!config.url) {
          throw new Error('URL is required for SSE transport');
        }
        return new SSEClientTransport(new URL(config.url));

      case MCPTransportType.HTTP:
        if (!config.url) {
          throw new Error('URL is required for HTTP transport');
        }
        return new StreamableHTTPClientTransport(new URL(config.url), {
          sessionId: config.sessionId,
        });

      default:
        throw new Error(`Unsupported transport type: ${config.type}`);
    }
  }

  /**
   * Initialize tools from MCP server
   */
  private async initializeTools(
    serverName: string,
    toolSchemas?: Record<string, z.ZodObject<z.ZodRawShape>>
  ): Promise<void> {
    const client = this.clients.get(serverName);
    if (!client) {
      throw new Error(`Client ${serverName} not found`);
    }

    const serverTools = await client.listTools();
    const tools: Record<string, MCPTool> = {};

    for (const serverTool of serverTools.tools) {
      const schema = toolSchemas?.[serverTool.name];

      // Store MCP tool definition with schema if provided
      tools[serverTool.name] = {
        name: serverTool.name,
        description: serverTool.description || '',
        schema: schema || z.record(z.string(), z.unknown()),
        execute: async (input: any) => {
          const result = await client.callTool({
            name: serverTool.name,
            arguments: input,
          });
          return result.content;
        },
      };
    }

    this.tools.set(serverName, tools);
  }

  /**
   * Get all tools from a specific server
   */
  getServerTools(serverName: string): Record<string, any> | undefined {
    return this.tools.get(serverName);
  }

  /**
   * Get all tools from all servers
   */
  getAllTools(): Record<string, any> {
    const allTools: Record<string, any> = {};

    for (const [serverName, serverTools] of this.tools) {
      for (const [toolName, tool] of Object.entries(serverTools)) {
        // Prefix tool name with server name to avoid conflicts
        allTools[`${serverName}_${toolName}`] = tool;
      }
    }

    return allTools;
  }

  /**
   * Call a tool on a specific server
   */
  async callTool(
    serverName: string,
    toolName: string,
    args: any
  ): Promise<any> {
    const client = this.clients.get(serverName);
    if (!client) {
      throw new Error(`Client ${serverName} not found`);
    }

    const result = await client.callTool({
      name: toolName,
      arguments: args,
    });

    return result.content;
  }

  /**
   * List available prompts from a server
   */
  async listPrompts(serverName: string): Promise<any[]> {
    const client = this.clients.get(serverName);
    if (!client) {
      throw new Error(`Client ${serverName} not found`);
    }

    const prompts = await client.listPrompts();
    return prompts.prompts;
  }

  /**
   * Get a prompt from a server
   */
  async getPrompt(
    serverName: string,
    promptName: string,
    args?: Record<string, string>
  ): Promise<string> {
    const client = this.clients.get(serverName);
    if (!client) {
      throw new Error(`Client ${serverName} not found`);
    }

    const prompt = await client.getPrompt({
      name: promptName,
      arguments: args,
    });

    if (prompt.messages.length > 0) {
      return prompt.messages.map((m) => m.content).join('\n');
    }

    return '';
  }

  /**
   * List available resources from a server
   */
  async listResources(serverName: string): Promise<any[]> {
    const client = this.clients.get(serverName);
    if (!client) {
      throw new Error(`Client ${serverName} not found`);
    }

    const resources = await client.listResources();
    return resources.resources;
  }

  /**
   * Read a resource from a server
   */
  async readResource(serverName: string, uri: string): Promise<any> {
    const client = this.clients.get(serverName);
    if (!client) {
      throw new Error(`Client ${serverName} not found`);
    }

    const resource = await client.readResource({ uri });
    return resource.contents;
  }

  /**
   * Get list of connected server names
   */
  getConnectedServers(): string[] {
    return Array.from(this.clients.keys());
  }

  /**
   * Check if a server is connected
   */
  isServerConnected(serverName: string): boolean {
    return this.clients.has(serverName);
  }

  /**
   * Close a client connection
   */
  async closeClient(serverName: string): Promise<void> {
    const client = this.clients.get(serverName);
    const transport = this.transports.get(serverName);

    if (client) {
      await client.close();
      this.clients.delete(serverName);
    }

    if (transport) {
      await transport.close();
      this.transports.delete(serverName);
    }

    this.tools.delete(serverName);
  }

  /**
   * Close all client connections
   */
  async closeAll(): Promise<void> {
    const closePromises: Promise<void>[] = [];

    for (const serverName of this.clients.keys()) {
      closePromises.push(this.closeClient(serverName));
    }

    await Promise.all(closePromises);
  }
}

// Singleton instance
export const mcpManager = new MCPClientManager();

// Default MCP server configurations
export const DEFAULT_MCP_SERVERS: MCPServerConfig[] = [
  {
    name: 'filesystem',
    transport: {
      type: MCPTransportType.STDIO,
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem'],
      env: {
        MCP_ALLOWED_PATHS: process.env.MCP_ALLOWED_PATHS || '/tmp',
      },
    },
    description: 'File system operations',
    toolSchemas: {
      read_file: z.object({
        path: z.string().describe('Path to the file to read'),
      }),
      write_file: z.object({
        path: z.string().describe('Path to the file to write'),
        content: z.string().describe('Content to write to the file'),
      }),
      list_directory: z.object({
        path: z.string().describe('Path to the directory to list'),
      }),
    },
  },
  {
    name: 'brave-search',
    transport: {
      type: MCPTransportType.STDIO,
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-brave-search'],
      env: {
        BRAVE_API_KEY: process.env.BRAVE_API_KEY || '',
      },
    },
    description: 'Web search using Brave',
    toolSchemas: {
      brave_web_search: z.object({
        query: z.string().describe('Search query'),
        count: z.number().optional().describe('Number of results'),
      }),
    },
  },
];

// Helper function to initialize default servers
export async function initializeDefaultMCPServers(): Promise<void> {
  for (const server of DEFAULT_MCP_SERVERS) {
    try {
      await mcpManager.initializeClient(server);
      log.info('MCP server initialized successfully', {
        serverName: server.name,
      });
    } catch (error) {
      log.error('Failed to initialize MCP server', {
        serverName: server.name,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
