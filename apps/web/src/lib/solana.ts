import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
  Connection,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
  PublicKey,
  type PublicKey as PublicKeyType,
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
  if (!Number.isFinite(lamports) || lamports < 0) {
    throw new Error(
      'Invalid lamports value: must be a non-negative finite number'
    );
  }
  return lamports / LAMPORTS_PER_SOL;
};

export const solToLamports = (sol: number): number => {
  if (!Number.isFinite(sol) || sol < 0) {
    throw new Error('Invalid SOL value: must be a non-negative finite number');
  }
  return Math.floor(sol * LAMPORTS_PER_SOL);
};

// Format Solana address for display
export const formatSolanaAddress = (address: string | null | undefined, length = 4): string => {
  if (!address) return '';
  if (address.length <= length * 2 + 3) return address;
  if (length === 0) return '...';
  return `${address.slice(0, length)}...${address.slice(-length)}`;
};

// Validate Solana address
export const validateSolanaAddress = (address: string | null | undefined): boolean => {
  if (!address) return false;
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
};

// Create a sign-in message for wallet authentication
export const createSignInMessage = (publicKey: string): string => {
  // Validate public key format
  if (!publicKey || typeof publicKey !== 'string' || publicKey.length < 32) {
    throw new Error('Invalid public key provided');
  }

  const domain =
    typeof window !== 'undefined'
      ? window.location.host
      : process.env.NEXT_PUBLIC_APP_DOMAIN || 'isis.chat';
  const now = new Date();
  // Generate cryptographically secure nonce
  const nonceArray = new Uint8Array(12);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(nonceArray);
  } else {
    // Fallback for server-side rendering
    for (let i = 0; i < nonceArray.length; i++) {
      nonceArray[i] = Math.floor(Math.random() * 256);
    }
  }
  const nonce = Array.from(nonceArray, (byte) => byte.toString(36)).join('');

  const message = `ISIS Chat wants you to sign in with your Solana account:
${publicKey}

Domain: ${domain}
Issued At: ${now.toISOString()}
Chain ID: ${NETWORK}
Nonce: ${nonce}`;

  return message;
};

// Wallet state interface
export interface WalletConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  publicKey: PublicKeyType | null;
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
