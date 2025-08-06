/**
 * MCP Server Initialization
 * Handles initialization of MCP servers on API startup
 */

import { initializeDefaultMCPServers, mcpManager } from './client';

let initialized = false;

/**
 * Initialize MCP servers if not already initialized
 */
export async function ensureMCPServersInitialized(): Promise<void> {
  if (initialized) {
    return;
  }

  try {
    console.log('🚀 Initializing MCP servers...');
    await initializeDefaultMCPServers();
    initialized = true;
    console.log('✅ MCP servers initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize MCP servers:', error);
    // Don't throw - allow API to continue without MCP
    // MCP features will be unavailable but the API will still work
  }
}

/**
 * Get initialization status
 */
export function isMCPInitialized(): boolean {
  return initialized;
}

/**
 * Reset initialization (useful for testing)
 */
export function resetMCPInitialization(): void {
  initialized = false;
}
