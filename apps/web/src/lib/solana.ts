import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
  Connection,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
  type PublicKey,
} from '@solana/web3.js';

// Configure the network to use from environment variables
const getNetwork = (): WalletAdapterNetwork => {
  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';
  switch (network) {
    case 'mainnet-beta':
      return WalletAdapterNetwork.Mainnet;
    case 'testnet':
      return WalletAdapterNetwork.Testnet;
    case 'devnet':
    default:
      return WalletAdapterNetwork.Devnet;
  }
};

export const NETWORK = getNetwork();

// RPC endpoint - use environment variable if provided, otherwise use cluster API
export const ENDPOINT =
  process.env.NEXT_PUBLIC_SOLANA_RPC_HOST || clusterApiUrl(NETWORK);

// Create connection instance
export const connection = new Connection(ENDPOINT, 'confirmed');

// Utility functions
export const lamportsToSol = (lamports: number): number => {
  return lamports / LAMPORTS_PER_SOL;
};

export const solToLamports = (sol: number): number => {
  return Math.floor(sol * LAMPORTS_PER_SOL);
};

// Create a sign-in message for wallet authentication
export const createSignInMessage = (publicKey: string): string => {
  const domain =
    typeof window !== 'undefined'
      ? window.location.host
      : process.env.NEXT_PUBLIC_APP_DOMAIN || 'isis.chat';
  const now = new Date();
  const message = `ISIS Chat wants you to sign in with your Solana account:
${publicKey}

Domain: ${domain}
Issued At: ${now.toISOString()}
Chain ID: ${NETWORK}`;

  return message;
};

// Wallet state interface
export interface WalletConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  publicKey: PublicKey | null;
  balance: number | null;
  error: string | null;
}

export const INITIAL_WALLET_STATE: WalletConnectionState = {
  isConnected: false,
  isConnecting: false,
  publicKey: null,
  balance: null,
  error: null,
};
