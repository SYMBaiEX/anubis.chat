/**
 * WebSocket Server for Real-time Updates
 * Handles real-time communication for agent execution, workflows, and memory updates
 */

import type { Server as HTTPServer } from 'http';
import { type Socket, Server as SocketIOServer } from 'socket.io';
import { z } from 'zod';

// =============================================================================
// Types
// =============================================================================

export interface WebSocketUser {
  walletAddress: string;
  socketId: string;
  connectedAt: number;
}

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
}

// Event types
export type WebSocketEvent =
  | 'agent.execution.started'
  | 'agent.execution.step'
  | 'agent.execution.completed'
  | 'agent.execution.error'
  | 'workflow.started'
  | 'workflow.step'
  | 'workflow.completed'
  | 'workflow.error'
  | 'memory.created'
  | 'memory.updated'
  | 'memory.deleted'
  | 'conversation.message'
  | 'conversation.created';

// =============================================================================
// WebSocket Manager Class
// =============================================================================

export class WebSocketManager {
  private io: SocketIOServer | null = null;
  private users = new Map<string, WebSocketUser>();
  private userSockets = new Map<string, Set<string>>(); // walletAddress -> Set<socketId>

  /**
   * Initialize WebSocket server
   */
  initialize(httpServer: HTTPServer): SocketIOServer {
    if (this.io) {
      return this.io;
    }

    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      path: '/api/ws',
      transports: ['websocket', 'polling'],
    });

    this.setupEventHandlers();
    console.log('✅ WebSocket server initialized');

    return this.io;
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket: Socket) => {
      console.log(`New WebSocket connection: ${socket.id}`);

      // Handle authentication
      socket.on('authenticate', (data: { walletAddress: string }) => {
        this.handleAuthentication(socket, data.walletAddress);
      });

      // Handle subscription to specific events
      socket.on('subscribe', (data: { events: WebSocketEvent[] }) => {
        this.handleSubscription(socket, data.events);
      });

      // Handle unsubscription
      socket.on('unsubscribe', (data: { events: WebSocketEvent[] }) => {
        this.handleUnsubscription(socket, data.events);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        this.handleDisconnection(socket);
      });

      // Handle ping for keepalive
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: Date.now() });
      });
    });
  }

  /**
   * Handle user authentication
   */
  private handleAuthentication(socket: Socket, walletAddress: string): void {
    // Store user info
    const user: WebSocketUser = {
      walletAddress,
      socketId: socket.id,
      connectedAt: Date.now(),
    };

    this.users.set(socket.id, user);

    // Track user's sockets
    if (!this.userSockets.has(walletAddress)) {
      this.userSockets.set(walletAddress, new Set());
    }
    this.userSockets.get(walletAddress)!.add(socket.id);

    // Join user-specific room
    socket.join(`user:${walletAddress}`);

    socket.emit('authenticated', {
      success: true,
      socketId: socket.id,
      timestamp: Date.now(),
    });

    console.log(`User ${walletAddress} authenticated with socket ${socket.id}`);
  }

  /**
   * Handle event subscription
   */
  private handleSubscription(socket: Socket, events: WebSocketEvent[]): void {
    for (const event of events) {
      socket.join(`event:${event}`);
    }

    socket.emit('subscribed', {
      events,
      timestamp: Date.now(),
    });
  }

  /**
   * Handle event unsubscription
   */
  private handleUnsubscription(socket: Socket, events: WebSocketEvent[]): void {
    for (const event of events) {
      socket.leave(`event:${event}`);
    }

    socket.emit('unsubscribed', {
      events,
      timestamp: Date.now(),
    });
  }

  /**
   * Handle disconnection
   */
  private handleDisconnection(socket: Socket): void {
    const user = this.users.get(socket.id);
    if (user) {
      // Remove from user's socket set
      const userSocketSet = this.userSockets.get(user.walletAddress);
      if (userSocketSet) {
        userSocketSet.delete(socket.id);
        if (userSocketSet.size === 0) {
          this.userSockets.delete(user.walletAddress);
        }
      }

      this.users.delete(socket.id);
      console.log(
        `User ${user.walletAddress} disconnected (socket ${socket.id})`
      );
    }
  }

  // =============================================================================
  // Public Methods for Emitting Events
  // =============================================================================

  /**
   * Emit event to specific user
   */
  emitToUser(walletAddress: string, event: WebSocketEvent, data: any): void {
    if (!this.io) return;

    const message: WebSocketMessage = {
      type: event,
      data,
      timestamp: Date.now(),
    };

    this.io.to(`user:${walletAddress}`).emit(event, message);
  }

  /**
   * Emit event to all subscribers of an event type
   */
  emitToEventSubscribers(event: WebSocketEvent, data: any): void {
    if (!this.io) return;

    const message: WebSocketMessage = {
      type: event,
      data,
      timestamp: Date.now(),
    };

    this.io.to(`event:${event}`).emit(event, message);
  }

  /**
   * Broadcast event to all connected users
   */
  broadcast(event: WebSocketEvent, data: any): void {
    if (!this.io) return;

    const message: WebSocketMessage = {
      type: event,
      data,
      timestamp: Date.now(),
    };

    this.io.emit(event, message);
  }

  // =============================================================================
  // Agent Execution Events
  // =============================================================================

  emitAgentExecutionStarted(
    walletAddress: string,
    agentId: string,
    executionId: string
  ): void {
    this.emitToUser(walletAddress, 'agent.execution.started', {
      agentId,
      executionId,
    });
  }

  emitAgentExecutionStep(
    walletAddress: string,
    agentId: string,
    executionId: string,
    step: any
  ): void {
    this.emitToUser(walletAddress, 'agent.execution.step', {
      agentId,
      executionId,
      step,
    });
  }

  emitAgentExecutionCompleted(
    walletAddress: string,
    agentId: string,
    executionId: string,
    result: any
  ): void {
    this.emitToUser(walletAddress, 'agent.execution.completed', {
      agentId,
      executionId,
      result,
    });
  }

  emitAgentExecutionError(
    walletAddress: string,
    agentId: string,
    executionId: string,
    error: string
  ): void {
    this.emitToUser(walletAddress, 'agent.execution.error', {
      agentId,
      executionId,
      error,
    });
  }

  // =============================================================================
  // Workflow Events
  // =============================================================================

  emitWorkflowStarted(
    walletAddress: string,
    workflowId: string,
    executionId: string
  ): void {
    this.emitToUser(walletAddress, 'workflow.started', {
      workflowId,
      executionId,
    });
  }

  emitWorkflowStep(
    walletAddress: string,
    workflowId: string,
    executionId: string,
    step: any
  ): void {
    this.emitToUser(walletAddress, 'workflow.step', {
      workflowId,
      executionId,
      step,
    });
  }

  emitWorkflowCompleted(
    walletAddress: string,
    workflowId: string,
    executionId: string,
    result: any
  ): void {
    this.emitToUser(walletAddress, 'workflow.completed', {
      workflowId,
      executionId,
      result,
    });
  }

  emitWorkflowError(
    walletAddress: string,
    workflowId: string,
    executionId: string,
    error: string
  ): void {
    this.emitToUser(walletAddress, 'workflow.error', {
      workflowId,
      executionId,
      error,
    });
  }

  // =============================================================================
  // Memory Events
  // =============================================================================

  emitMemoryCreated(walletAddress: string, memory: any): void {
    this.emitToUser(walletAddress, 'memory.created', { memory });
  }

  emitMemoryUpdated(walletAddress: string, memory: any): void {
    this.emitToUser(walletAddress, 'memory.updated', { memory });
  }

  emitMemoryDeleted(walletAddress: string, memoryId: string): void {
    this.emitToUser(walletAddress, 'memory.deleted', { memoryId });
  }

  // =============================================================================
  // Conversation Events
  // =============================================================================

  emitConversationMessage(
    walletAddress: string,
    conversationId: string,
    message: any
  ): void {
    this.emitToUser(walletAddress, 'conversation.message', {
      conversationId,
      message,
    });
  }

  emitConversationCreated(walletAddress: string, conversation: any): void {
    this.emitToUser(walletAddress, 'conversation.created', { conversation });
  }

  // =============================================================================
  // Utility Methods
  // =============================================================================

  /**
   * Get connection statistics
   */
  getStats(): {
    totalConnections: number;
    totalUsers: number;
    connections: WebSocketUser[];
  } {
    return {
      totalConnections: this.users.size,
      totalUsers: this.userSockets.size,
      connections: Array.from(this.users.values()),
    };
  }

  /**
   * Check if user is connected
   */
  isUserConnected(walletAddress: string): boolean {
    return this.userSockets.has(walletAddress);
  }

  /**
   * Get user's socket IDs
   */
  getUserSockets(walletAddress: string): string[] {
    const sockets = this.userSockets.get(walletAddress);
    return sockets ? Array.from(sockets) : [];
  }

  /**
   * Shutdown WebSocket server
   */
  shutdown(): void {
    if (this.io) {
      this.io.close();
      this.io = null;
      this.users.clear();
      this.userSockets.clear();
      console.log('WebSocket server shut down');
    }
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

export const wsManager = new WebSocketManager();
