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
import { SolanaAgentKit } from 'solana-agent-kit';
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
  model: string;
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
  const { wallet, publicKey } = useWallet();
  const { user, isAuthenticated } = useAuthContext();

  const [agentKit, setAgentKit] = useState<SolanaAgentKit | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch available agents
  const agents = useQuery(
    api.agents.list,
    isAuthenticated && user?.walletAddress
      ? { includePublic: true, userId: user.walletAddress }
      : 'skip'
  );

  // Fetch user's recent transactions
  const recentTransactions = useQuery(
    api.blockchainTransactions.listByUser,
    isAuthenticated && user?.walletAddress
      ? { userId: user.walletAddress, limit: 10 }
      : 'skip'
  ) as BlockchainTransaction[] | undefined;

  // Fetch pending transactions
  const pendingTransactions = useQuery(
    api.blockchainTransactions.listPending,
    isAuthenticated && user?.walletAddress
      ? { userId: user.walletAddress }
      : 'skip'
  ) as BlockchainTransaction[] | undefined;

  // Initialize Solana Agent Kit when wallet connects
  useEffect(() => {
    const initializeAgentKit = async () => {
      if (!(wallet && publicKey && isAuthenticated)) {
        setAgentKit(null);
        setIsInitialized(false);
        return;
      }

      try {
        // Get the private key from wallet adapter
        // Note: This is a simplified example. In production, you'd need proper key management
        const privateKey = 'your-private-key-here'; // This needs to be handled securely
        const rpcUrl =
          process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
          'https://api.mainnet-beta.solana.com';

        const kit = new SolanaAgentKit(privateKey, rpcUrl, {
          OPENAI_API_KEY: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
        });

        setAgentKit(kit);
        setIsInitialized(true);
        setError(null);
      } catch (err) {
        console.error('Failed to initialize Solana Agent Kit:', err);
        setError('Failed to initialize blockchain agent');
        setIsInitialized(false);
      }
    };

    initializeAgentKit();
  }, [wallet, publicKey, isAuthenticated]);

  // Auto-select first agent when available
  useEffect(() => {
    if (agents && agents.length > 0 && !selectedAgent) {
      const generalAgent =
        agents.find((agent) => agent.type === 'general') || agents[0];
      setSelectedAgent(generalAgent);
    }
  }, [agents, selectedAgent]);

  const selectAgent = useCallback(
    (agentId: string) => {
      const agent = agents?.find((a) => a._id === agentId);
      if (agent) {
        setSelectedAgent(agent);
      }
    },
    [agents]
  );

  const createCustomAgent = useCallback(
    async (config: Partial<Agent>): Promise<string | null> => {
      if (!user) return null;

      try {
        // This would call a Convex mutation to create the agent
        // const agentId = await createAgent({ ...config, createdBy: user.walletAddress });
        // return agentId;
        console.log('Creating custom agent:', config);
        return null;
      } catch (err) {
        console.error('Failed to create custom agent:', err);
        setError('Failed to create custom agent');
        return null;
      }
    },
    [user]
  );

  const executeTool = useCallback(
    async (execution: ToolExecution): Promise<any> => {
      if (!(agentKit && selectedAgent)) {
        throw new Error('Agent kit not initialized or no agent selected');
      }

      try {
        // Execute the tool based on its name
        // This is a simplified example - you'd have a proper tool registry
        switch (execution.toolName) {
          case 'getBalance':
            return await agentKit.getBalance();

          case 'deployToken':
            return await agentKit.deployToken(
              execution.parameters.decimals,
              execution.parameters.initialSupply
            );

          case 'transfer':
            return await agentKit.transfer(
              execution.parameters.to,
              execution.parameters.amount,
              execution.parameters.mint
            );

          // Add more tools as needed
          default:
            throw new Error(`Unknown tool: ${execution.toolName}`);
        }
      } catch (err) {
        console.error('Tool execution failed:', err);
        throw err;
      }
    },
    [agentKit, selectedAgent]
  );

  const getBalance = useCallback(async (): Promise<number | null> => {
    if (!agentKit) return null;

    try {
      const balance = await agentKit.getBalance();
      return balance;
    } catch (err) {
      console.error('Failed to get balance:', err);
      setError('Failed to get wallet balance');
      return null;
    }
  }, [agentKit]);

  const getTokenBalances = useCallback(async (): Promise<Array<{
    mint: string;
    amount: string;
  }> | null> => {
    if (!agentKit) return null;

    try {
      // This would call the appropriate method to get token balances
      // const balances = await agentKit.getTokenBalances();
      // return balances;
      return [];
    } catch (err) {
      console.error('Failed to get token balances:', err);
      setError('Failed to get token balances');
      return null;
    }
  }, [agentKit]);

  const refreshData = useCallback(() => {
    // Trigger data refresh for queries
    // This would typically refresh the Convex queries
    console.log('Refreshing agent data...');
  }, []);

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
