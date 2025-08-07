/**
 * WebSocket Hook for Real-time Updates
 * Provides React hook for WebSocket connections and event handling
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { createModuleLogger } from '@/lib/utils/logger';

const log = createModuleLogger('websocket-hook');

// =============================================================================
// Types
// =============================================================================

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

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
}

export interface UseWebSocketOptions {
  walletAddress?: string;
  autoConnect?: boolean;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
}

export interface UseWebSocketReturn {
  isConnected: boolean;
  isAuthenticated: boolean;
  socket: Socket | null;
  connect: () => void;
  disconnect: () => void;
  subscribe: (events: WebSocketEvent[]) => void;
  unsubscribe: (events: WebSocketEvent[]) => void;
  on: (event: WebSocketEvent, handler: (data: any) => void) => void;
  off: (event: WebSocketEvent, handler?: (data: any) => void) => void;
  emit: (event: string, data: any) => void;
}

// =============================================================================
// WebSocket Hook
// =============================================================================

export function useWebSocket(
  options: UseWebSocketOptions = {}
): UseWebSocketReturn {
  const {
    walletAddress,
    autoConnect = true,
    reconnection = true,
    reconnectionAttempts = 5,
    reconnectionDelay = 1000,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const handlersRef = useRef<Map<string, Set<(data: any) => void>>>(new Map());

  /**
   * Connect to WebSocket server
   */
  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      return;
    }

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

    socketRef.current = io(wsUrl, {
      path: '/api/ws',
      transports: ['websocket', 'polling'],
      reconnection,
      reconnectionAttempts,
      reconnectionDelay,
      autoConnect: false,
    });

    const socket = socketRef.current;

    // Connection events
    socket.on('connect', () => {
      log.info('WebSocket connected');
      setIsConnected(true);

      // Authenticate if wallet address is provided
      if (walletAddress) {
        socket.emit('authenticate', { walletAddress });
      }
    });

    socket.on('disconnect', () => {
      log.info('WebSocket disconnected');
      setIsConnected(false);
      setIsAuthenticated(false);
    });

    socket.on('authenticated', (data: { success: boolean }) => {
      if (data.success) {
        log.info('WebSocket authenticated');
        setIsAuthenticated(true);
      }
    });

    socket.on('error', (error: any) => {
      log.error('WebSocket error', { error });
    });

    // Connect
    socket.connect();
  }, [walletAddress, reconnection, reconnectionAttempts, reconnectionDelay]);

  /**
   * Disconnect from WebSocket server
   */
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setIsAuthenticated(false);
    }
  }, []);

  /**
   * Subscribe to events
   */
  const subscribe = useCallback((events: WebSocketEvent[]) => {
    if (!socketRef.current?.connected) {
      log.warn('WebSocket not connected');
      return;
    }

    socketRef.current.emit('subscribe', { events });
  }, []);

  /**
   * Unsubscribe from events
   */
  const unsubscribe = useCallback((events: WebSocketEvent[]) => {
    if (!socketRef.current?.connected) {
      log.warn('WebSocket not connected');
      return;
    }

    socketRef.current.emit('unsubscribe', { events });
  }, []);

  /**
   * Add event listener
   */
  const on = useCallback(
    (event: WebSocketEvent, handler: (data: any) => void) => {
      // Store handler for cleanup
      if (!handlersRef.current.has(event)) {
        handlersRef.current.set(event, new Set());
      }
      handlersRef.current.get(event)!.add(handler);

      // Add listener to socket
      if (socketRef.current) {
        socketRef.current.on(event, (message: WebSocketMessage) => {
          handler(message.data);
        });
      }
    },
    []
  );

  /**
   * Remove event listener
   */
  const off = useCallback(
    (event: WebSocketEvent, handler?: (data: any) => void) => {
      if (!socketRef.current) return;

      if (handler) {
        // Remove specific handler
        socketRef.current.off(event, handler);
        const handlers = handlersRef.current.get(event);
        if (handlers) {
          handlers.delete(handler);
          if (handlers.size === 0) {
            handlersRef.current.delete(event);
          }
        }
      } else {
        // Remove all handlers for event
        socketRef.current.off(event);
        handlersRef.current.delete(event);
      }
    },
    []
  );

  /**
   * Emit custom event
   */
  const emit = useCallback((event: string, data: any) => {
    if (!socketRef.current?.connected) {
      log.warn('WebSocket not connected');
      return;
    }

    socketRef.current.emit(event, data);
  }, []);

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  // Re-authenticate when wallet address changes
  useEffect(() => {
    if (isConnected && walletAddress && !isAuthenticated) {
      socketRef.current?.emit('authenticate', { walletAddress });
    }
  }, [isConnected, walletAddress, isAuthenticated]);

  // Re-attach handlers when socket reconnects
  useEffect(() => {
    if (isConnected && socketRef.current) {
      handlersRef.current.forEach((handlers, event) => {
        handlers.forEach((handler) => {
          socketRef.current!.on(event, (message: WebSocketMessage) => {
            handler(message.data);
          });
        });
      });
    }
  }, [isConnected]);

  return {
    isConnected,
    isAuthenticated,
    socket: socketRef.current,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    on,
    off,
    emit,
  };
}

// =============================================================================
// Specialized Hooks
// =============================================================================

/**
 * Hook for agent execution updates
 */
export function useAgentExecution(agentId?: string) {
  const ws = useWebSocket();
  const [execution, setExecution] = useState<any>(null);
  const [steps, setSteps] = useState<any[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    if (!ws.isConnected) return;

    const handleStarted = (data: any) => {
      if (!agentId || data.agentId === agentId) {
        setIsExecuting(true);
        setExecution(data);
        setSteps([]);
      }
    };

    const handleStep = (data: any) => {
      if (!agentId || data.agentId === agentId) {
        setSteps((prev) => [...prev, data.step]);
      }
    };

    const handleCompleted = (data: any) => {
      if (!agentId || data.agentId === agentId) {
        setIsExecuting(false);
        setExecution(data);
      }
    };

    const handleError = (data: any) => {
      if (!agentId || data.agentId === agentId) {
        setIsExecuting(false);
        setExecution({ ...data, error: true });
      }
    };

    ws.on('agent.execution.started', handleStarted);
    ws.on('agent.execution.step', handleStep);
    ws.on('agent.execution.completed', handleCompleted);
    ws.on('agent.execution.error', handleError);

    // Subscribe to agent events
    ws.subscribe([
      'agent.execution.started',
      'agent.execution.step',
      'agent.execution.completed',
      'agent.execution.error',
    ]);

    return () => {
      ws.off('agent.execution.started', handleStarted);
      ws.off('agent.execution.step', handleStep);
      ws.off('agent.execution.completed', handleCompleted);
      ws.off('agent.execution.error', handleError);
    };
  }, [ws, agentId]);

  return {
    execution,
    steps,
    isExecuting,
  };
}

/**
 * Hook for memory updates
 */
export function useMemoryUpdates() {
  const ws = useWebSocket();
  const [latestMemory, setLatestMemory] = useState<any>(null);
  const [memoryUpdates, setMemoryUpdates] = useState<any[]>([]);

  useEffect(() => {
    if (!ws.isConnected) return;

    const handleCreated = (data: any) => {
      setLatestMemory(data.memory);
      setMemoryUpdates((prev) => [...prev, { type: 'created', ...data }]);
    };

    const handleUpdated = (data: any) => {
      setLatestMemory(data.memory);
      setMemoryUpdates((prev) => [...prev, { type: 'updated', ...data }]);
    };

    const handleDeleted = (data: any) => {
      setMemoryUpdates((prev) => [...prev, { type: 'deleted', ...data }]);
    };

    ws.on('memory.created', handleCreated);
    ws.on('memory.updated', handleUpdated);
    ws.on('memory.deleted', handleDeleted);

    // Subscribe to memory events
    ws.subscribe(['memory.created', 'memory.updated', 'memory.deleted']);

    return () => {
      ws.off('memory.created', handleCreated);
      ws.off('memory.updated', handleUpdated);
      ws.off('memory.deleted', handleDeleted);
    };
  }, [ws]);

  return {
    latestMemory,
    memoryUpdates,
  };
}

/**
 * Hook for conversation updates
 */
export function useConversationUpdates(conversationId?: string) {
  const ws = useWebSocket();
  const [messages, setMessages] = useState<any[]>([]);
  const [latestMessage, setLatestMessage] = useState<any>(null);

  useEffect(() => {
    if (!ws.isConnected) return;

    const handleMessage = (data: any) => {
      if (!conversationId || data.conversationId === conversationId) {
        setLatestMessage(data.message);
        setMessages((prev) => [...prev, data.message]);
      }
    };

    ws.on('conversation.message', handleMessage);

    // Subscribe to conversation events
    ws.subscribe(['conversation.message']);

    return () => {
      ws.off('conversation.message', handleMessage);
    };
  }, [ws, conversationId]);

  return {
    messages,
    latestMessage,
  };
}
