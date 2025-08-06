import { Connection, PublicKey, clusterApiUrl, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';

// Solana network configuration
export const NETWORK = WalletAdapterNetwork.Devnet;
export const RPC_ENDPOINT = clusterApiUrl(NETWORK);

// Create connection
export const connection = new Connection(RPC_ENDPOINT, 'confirmed');

// App identity for wallet connection
export const APP_IDENTITY = {
  name: 'isis.chat',
  uri: 'https://isis.chat',
  icon: '/favicon/favicon.svg',
} as const;

// Utility functions
export const lamportsToSol = (lamports: number): number => {
  return lamports / LAMPORTS_PER_SOL;
};

export const solToLamports = (sol: number): number => {
  return sol * LAMPORTS_PER_SOL;
};

export const formatPublicKey = (publicKey: string | PublicKey): string => {
  const key = typeof publicKey === 'string' ? publicKey : publicKey.toString();
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
};

export const isValidPublicKey = (address: string): boolean => {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
};

export const getExplorerUrl = (
  signature: string, 
  cluster: WalletAdapterNetwork = NETWORK
): string => {
  const baseUrl = 'https://explorer.solana.com';
  const clusterParam = cluster !== WalletAdapterNetwork.Mainnet ? `?cluster=${cluster}` : '';
  return `${baseUrl}/tx/${signature}${clusterParam}`;
};

// Sign In With Solana message creation
export const createSignInMessage = (
  publicKey: string, 
  domain: string = 'isis.chat',
  statement: string = 'Sign in to isis.chat to authenticate your wallet.'
): string => {
  const message = `${domain} wants you to sign in with your Solana account:\n${publicKey}\n\n${statement}\n\nURI: https://${domain}\nVersion: 1\nChain ID: solana:${NETWORK}\nNonce: ${Date.now()}`;
  return message;
};

// Wallet connection state types
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