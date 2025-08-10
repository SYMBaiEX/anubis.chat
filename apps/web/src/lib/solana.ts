import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
  Connection,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
  PublicKey,
  type PublicKey as PublicKeyType,
  SystemProgram,
  Transaction,
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
export const formatSolanaAddress = (
  address: string | null | undefined,
  length = 4
): string => {
  if (!address) return '';
  if (address.length <= length * 2 + 3) return address;
  if (length === 0) return '...';
  return `${address.slice(0, length)}...${address.slice(-length)}`;
};

// Validate Solana address
export const validateSolanaAddress = (
  address: string | null | undefined
): boolean => {
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

// Helper function to check if a transaction has been processed
export const checkTransactionStatus = async (
  signature: string
): Promise<{ confirmed: boolean; error?: string }> => {
  try {
    const status = await connection.getSignatureStatus(signature);

    if (!(status && status.value)) {
      return { confirmed: false };
    }

    if (status.value.err) {
      return { confirmed: false, error: JSON.stringify(status.value.err) };
    }

    const isConfirmed =
      status.value.confirmationStatus === 'confirmed' ||
      status.value.confirmationStatus === 'finalized';

    return { confirmed: isConfirmed };
  } catch (error) {
    console.error('Error checking transaction status:', error);
    return {
      confirmed: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Generate a unique transaction ID for idempotency
export const generateTransactionId = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${random}`;
};

// Payment transaction preparation
export const createPaymentTransaction = async (
  fromPublicKey: PublicKey,
  toPublicKey: PublicKey,
  amountSol: number
): Promise<Transaction> => {
  if (!Number.isFinite(amountSol) || amountSol <= 0) {
    throw new Error('Invalid payment amount');
  }

  const lamports = solToLamports(amountSol);

  try {
    // Get recent blockhash
    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash('confirmed');

    // Create transfer instruction
    const transferInstruction = SystemProgram.transfer({
      fromPubkey: fromPublicKey,
      toPubkey: toPublicKey,
      lamports,
    });

    // Create transaction
    const transaction = new Transaction({
      feePayer: fromPublicKey,
      blockhash,
      lastValidBlockHeight,
    });

    transaction.add(transferInstruction);

    return transaction;
  } catch (error) {
    throw new Error(
      `Failed to create payment transaction: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

// Payment processing helper with idempotency and proper error handling
export const processPaymentTransaction = async (
  transaction: Transaction,
  signTransaction: (transaction: Transaction) => Promise<Transaction>,
  options?: {
    maxRetries?: number;
    skipPreflight?: boolean;
  }
): Promise<string> => {
  const maxRetries = options?.maxRetries ?? 0;
  const skipPreflight = options?.skipPreflight ?? false;

  try {
    // Get the transaction signature BEFORE signing (for idempotency tracking)
    // This is the fee payer's signature which uniquely identifies the transaction
    const transactionMessage = transaction.compileMessage();
    const messageHash = transactionMessage.serialize();

    // Sign the transaction
    const signedTransaction = await signTransaction(transaction);

    // Send the transaction with proper configuration
    const sendOptions = {
      skipPreflight,
      preflightCommitment: 'confirmed' as const,
      maxRetries,
    };

    // Send raw transaction
    const sentSignature = await connection.sendRawTransaction(
      signedTransaction.serialize(),
      sendOptions
    );

    // The sentSignature is the actual transaction ID we should use
    console.log('Transaction sent with signature:', sentSignature);

    // Confirm the transaction with timeout
    const confirmationTimeout = 30_000; // 30 seconds
    const startTime = Date.now();

    const { blockhash, lastValidBlockHeight } = transaction;

    // Poll for confirmation with timeout
    while (Date.now() - startTime < confirmationTimeout) {
      const status = await connection.getSignatureStatus(sentSignature);

      if (
        status?.value?.confirmationStatus === 'confirmed' ||
        status?.value?.confirmationStatus === 'finalized'
      ) {
        // Transaction confirmed successfully
        return sentSignature;
      }

      if (status?.value?.err) {
        // Transaction failed on-chain
        throw new Error(
          `Transaction failed: ${JSON.stringify(status.value.err)}`
        );
      }

      // Check if blockhash is still valid
      const currentHeight = await connection.getBlockHeight('confirmed');
      if (currentHeight > lastValidBlockHeight!) {
        throw new Error('Transaction expired: blockhash is no longer valid');
      }

      // Wait before next check
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    throw new Error('Transaction confirmation timeout');
  } catch (error: any) {
    // Enhanced error handling with specific cases

    // Check for duplicate transaction (already processed)
    if (
      error?.message?.includes('already been processed') ||
      error?.message?.includes('AlreadyProcessed') ||
      error?.message?.includes('This transaction has already been processed') ||
      error?.message?.includes(
        'Transaction simulation failed: This transaction has already been processed'
      )
    ) {
      // This is actually a success case - the transaction was already processed
      // We should check if it was successful
      console.warn('Transaction appears to be duplicate, checking status...');

      // Try to get the transaction signature from the error or the transaction
      const sig = transaction.signatures[0]?.toString();
      if (sig) {
        const status = await connection.getSignatureStatus(sig);
        if (
          status?.value?.confirmationStatus === 'confirmed' ||
          status?.value?.confirmationStatus === 'finalized'
        ) {
          // Transaction was already successful
          console.log('Duplicate transaction was already successful:', sig);
          return sig;
        }
      }

      throw new Error(
        'DUPLICATE_TRANSACTION: This payment has already been processed. Please refresh the page to check your subscription status.'
      );
    }

    // Check for signature verification failure
    if (
      error?.message?.includes('signature verification failed') ||
      error?.message?.includes('Transaction signature verification failure')
    ) {
      throw new Error(
        'SIGNATURE_VERIFICATION_FAILED: The transaction signature is invalid. This may be due to signing with an outdated blockhash.'
      );
    }

    // Check for blockhash errors
    if (
      error?.message?.includes('Blockhash not found') ||
      error?.message?.includes('blockhash not found')
    ) {
      throw new Error(
        'BLOCKHASH_NOT_FOUND: The transaction blockhash has expired. Please try again with a fresh transaction.'
      );
    }

    // Check for simulation failures
    if (error?.message?.includes('Transaction simulation failed')) {
      // Extract the actual error from simulation
      const match = error.message.match(/Transaction simulation failed: (.+)/);
      if (match) {
        throw new Error(`SIMULATION_FAILED: ${match[1]}`);
      }
    }

    // Extract more specific error information
    let errorMessage = 'Failed to process payment: ';

    if (error?.logs && Array.isArray(error.logs)) {
      errorMessage += `Logs: ${error.logs.join(', ')}. `;
    }

    if (error?.message) {
      errorMessage += error.message;
    } else {
      errorMessage += 'Unknown error';
    }

    throw new Error(errorMessage);
  }
};
