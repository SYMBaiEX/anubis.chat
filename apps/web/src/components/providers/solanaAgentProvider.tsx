'use client';

import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import type { SolanaAgentKit } from 'solana-agent-kit';
import { getSolanaEndpoint } from '@/lib/solana';
import { useWallet } from '@/hooks/useWallet';
import { useAuthContext } from './auth-provider';

// Agent Types
export interface Agent {
  _id: Id<'agents'>;
  name: string;
  type: 'general' | 'trading' | 'defi' | 'nft' | 'dao' | 'portfolio' | 'custom';
  description: string;
  systemPrompt: string;
  capabilities: string[];
  model?: string;
  version?: string;
  temperature?: number;
  maxTokens?: number;
  config?: {
    rpcUrl?: string;
    priorityFee?: number;
    slippage?: number;
    gasBudget?: number;
  };
  isActive: boolean;
  isPublic: boolean;
  createdBy?: string;
  createdAt: number;
  updatedAt: number;
}

export interface BlockchainTransaction {
  _id: Id<'blockchainTransactions'>;
  chatId?: Id<'chats'>;
  messageId?: Id<'messages'>;
  agentId?: Id<'agents'>;
  userId: string;
  signature?: string;
  type:
    | 'transfer'
    | 'swap'
    | 'stake'
    | 'unstake'
    | 'lend'
    | 'borrow'
    | 'mint_nft'
    | 'buy_nft'
    | 'sell_nft'
    | 'vote'
    | 'create_token'
    | 'liquidity_add'
    | 'liquidity_remove'
    | 'other';
  operation: string;
  parameters: {
    amount?: string;
    tokenMint?: string;
    targetAddress?: string;
    slippage?: number;
    priority?: number;
  };
  status: 'pending' | 'confirmed' | 'failed' | 'cancelled';
  errorMessage?: string;
  fee?: number;
  blockTime?: number;
  confirmations?: number;
  metadata?: {
    tokensBefore?: Array<{ mint: string; amount: string }>;
    tokensAfter?: Array<{ mint: string; amount: string }>;
    priceImpact?: number;
    executionTime?: number;
  };
  createdAt: number;
  updatedAt: number;
}

export interface ToolExecution {
  toolName: string;
  parameters?: any;
  category:
    | 'wallet'
    | 'trading'
    | 'defi'
    | 'nft'
    | 'governance'
    | 'social'
    | 'utility';
}

// Context Types
interface SolanaAgentContextType {
  // Agent Kit Instance
  agentKit: SolanaAgentKit | null;
  isInitialized: boolean;

  // Available Agents
  agents: Agent[] | null;
  selectedAgent: Agent | null;

  // Agent Management
  selectAgent: (agentId: string) => void;
  resetAgentSelection: () => void;
  createCustomAgent: (config: Partial<Agent>) => Promise<string | null>;

  // Tool Execution
  executeTool: (execution: ToolExecution) => Promise<any>;

  // Transaction Management
  pendingTransactions: BlockchainTransaction[];
  recentTransactions: BlockchainTransaction[];

  // Utilities
  getBalance: () => Promise<number | null>;
  getTokenBalances: () => Promise<Array<{
    mint: string;
    amount: string;
  }> | null>;
  refreshData: () => void;

  // Error Handling
  error: string | null;
  clearError: () => void;
}

const SolanaAgentContext = createContext<SolanaAgentContextType | undefined>(
  undefined
);

interface SolanaAgentProviderProps {
  children: ReactNode;
}

/**
 * SolanaAgentProvider - Manages Solana Agent Kit integration
 * Provides access to blockchain operations and AI agents
 */
export function SolanaAgentProvider({ children }: SolanaAgentProviderProps) {
  const wallet = useWallet();
  const { user, isAuthenticated } = useAuthContext();
  const userWalletAddress = user?.walletAddress;
  const canQueryByUser = isAuthenticated && !!userWalletAddress;

  const [agentKit, setAgentKit] = useState<SolanaAgentKit | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSelectingAgent, setIsSelectingAgent] = useState(false);
  const [hasExplicitSelection, setHasExplicitSelection] = useState(false);

  // Fetch available agents
  const agents = useQuery(
    api.agents.list,
    canQueryByUser
      ? ({ includePublic: true, userId: userWalletAddress as string } as const)
      : 'skip'
  );

  // Fetch user's recent transactions
  const recentTransactions = useQuery(
    api.blockchainTransactions.listByUser,
    canQueryByUser
      ? ({ userId: userWalletAddress as string, limit: 10 } as const)
      : 'skip'
  ) as BlockchainTransaction[] | undefined;

  // Fetch pending transactions
  const pendingTransactions = useQuery(
    api.blockchainTransactions.listPending,
    canQueryByUser ? ({ userId: userWalletAddress as string } as const) : 'skip'
  ) as BlockchainTransaction[] | undefined;

  // Initialize Solana Agent Kit when wallet connects
  useEffect(() => {
    const initializeAgentKit = () => {
      if (
        !(wallet.isConnected && wallet.publicKey && isAuthenticated && user)
      ) {
        setAgentKit(null);
        setIsInitialized(false);
        return;
      }

      try {
        // In production, the private key should NOT be stored on the frontend
        // Instead, the agent operations should be executed on the backend
        // For now, we'll create the kit without the private key and use it for read-only operations
        
        // ✅ Use centralized endpoint configuration
        const _rpcUrl = getSolanaEndpoint();

        // Skip agent kit instantiation on the client for read-only operations
        // Server-side should handle transaction-capable agent actions
        setAgentKit(null);
        setIsInitialized(true);
        setError(null);
      } catch (_err) {
        setError('Failed to initialize blockchain agent');
        setIsInitialized(false);
      }
    };

    initializeAgentKit();
  }, [wallet.isConnected, wallet.publicKey, isAuthenticated, user]);

  // Auto-select first agent when available only once on initial load
  useEffect(() => {
    if (
      agents &&
      agents.length > 0 &&
      !selectedAgent &&
      !isSelectingAgent &&
      !hasExplicitSelection
    ) {
      // Only auto-select if:
      // 1. We have agents available
      // 2. No agent is currently selected
      // 3. We're not in the process of selecting
      // 4. No explicit selection has been made (prevents overriding chat selections)
      const generalAgent =
        agents.find((agent: Agent) => agent.type === 'general') || agents[0];
      setSelectedAgent(generalAgent);
    }
  }, [agents, selectedAgent, isSelectingAgent, hasExplicitSelection]);

  const selectAgent = useCallback(
    (agentId: string) => {
      // If the same agent is already selected, don't re-select it
      if (selectedAgent?._id === agentId) {
        return;
      }

      // Prevent selection during an ongoing selection process
      if (isSelectingAgent) {
        return;
      }

      const agent = agents?.find((a: Agent) => a._id === agentId);

      if (agent) {
        setIsSelectingAgent(true);
        setHasExplicitSelection(true); // Mark that a selection has been made

        // Update the selected agent
        setSelectedAgent(agent);

        // Reset the selecting flag after a brief delay
        setTimeout(() => setIsSelectingAgent(false), 100);
      }
    },
    [agents, isSelectingAgent, selectedAgent?._id]
  );

  // Add a method to reset the selection state (useful when switching chats)
  const resetAgentSelection = useCallback(() => {
    setHasExplicitSelection(false);
    setSelectedAgent(null);
  }, []);

  const createCustomAgent = useCallback(
    (_config: Partial<Agent>): Promise<string | null> => {
      if (!user) {
        return Promise.resolve(null);
      }

      // TODO: Implement custom agent creation via Convex mutation
      setError('Custom agent creation not yet implemented');
      return Promise.resolve(null);
    },
    [user]
  );

  const executeTool = useCallback(
    (execution: ToolExecution): Promise<unknown> => {
      if (!(agentKit && selectedAgent && wallet.isConnected)) {
        return Promise.reject(
          new Error(
            'Agent kit not initialized, no agent selected, or wallet not connected'
          )
        );
      }

      // Handle read-only tools
      const readOnlyTools: Record<string, () => unknown> = {
        getBalance: () => wallet.balance || 0,
        getAddress: () => wallet.publicKey,
        getTokenBalances: () => [], // TODO: Implement token balance fetching
      };

      const secureTools = ['deployToken', 'transfer', 'swap'];

      if (readOnlyTools[execution.toolName]) {
        return Promise.resolve(readOnlyTools[execution.toolName]());
      }

      if (secureTools.includes(execution.toolName)) {
        return Promise.reject(
          new Error(
            `Tool '${execution.toolName}' requires server-side execution for security`
          )
        );
      }

      return Promise.reject(new Error(`Unknown tool: ${execution.toolName}`));
    },
    [agentKit, selectedAgent, wallet]
  );

  const getBalance = useCallback(async (): Promise<number | null> => {
    if (!wallet.isConnected) {
      return null;
    }

    try {
      // Use the balance from the wallet hook
      await wallet.refreshBalance();
      return wallet.balance;
    } catch (_err) {
      setError('Failed to get wallet balance');
      return null;
    }
  }, [wallet]);

  const getTokenBalances = useCallback((): Promise<Array<{
    mint: string;
    amount: string;
  }> | null> => {
    if (!wallet.isConnected) {
      return Promise.resolve(null);
    }

    // TODO: Implement token balance fetching from Solana RPC
    // This would use @solana/web3.js to fetch SPL token accounts
    return Promise.resolve([]);
  }, [wallet.isConnected]);

  const refreshData = useCallback(() => {
    // Refresh wallet balance if connected
    if (wallet.isConnected && wallet.refreshBalance) {
      wallet.refreshBalance();
    }

    // Clear any stale errors
    setError(null);

    // TODO: Add transaction refresh logic when implemented
  }, [wallet]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const contextValue: SolanaAgentContextType = {
    // Agent Kit Instance
    agentKit,
    isInitialized,

    // Available Agents
    agents: agents || null,
    selectedAgent,

    // Agent Management
    selectAgent,
    resetAgentSelection,
    createCustomAgent,

    // Tool Execution
    executeTool,

    // Transaction Management
    pendingTransactions: pendingTransactions || [],
    recentTransactions: recentTransactions || [],

    // Utilities
    getBalance,
    getTokenBalances,
    refreshData,

    // Error Handling
    error,
    clearError,
  };

  return (
    <SolanaAgentContext.Provider value={contextValue}>
      {children}
    </SolanaAgentContext.Provider>
  );
}

/**
 * Hook to use Solana Agent context
 */
export function useSolanaAgent(): SolanaAgentContextType {
  const context = useContext(SolanaAgentContext);
  if (context === undefined) {
    throw new Error('useSolanaAgent must be used within a SolanaAgentProvider');
  }
  return context;
}

export default SolanaAgentProvider;
