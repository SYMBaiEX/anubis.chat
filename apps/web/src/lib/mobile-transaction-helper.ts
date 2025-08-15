/**
 * Mobile Transaction Helper for Solana Mobile Wallet Adapter
 * 
 * This file provides utilities for signing and sending transactions
 * using Solana Mobile Wallet Adapter (MWA).
 */

import { 
  Transaction, 
  VersionedTransaction, 
  Connection, 
  PublicKey,
  TransactionMessage,
  TransactionInstruction,
} from '@solana/web3.js';
import { transact } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import type { 
  AuthorizeAPI, 
  AuthorizationResult
} from '@solana-mobile/mobile-wallet-adapter-protocol';
import { APP_IDENTITY } from './solana-mobile-config';
import { createModuleLogger } from './utils/logger';

const log = createModuleLogger('mobile-transaction-helper');

export interface TransactionResult {
  signature: string;
  success: boolean;
  error?: string;
}

export interface SignedTransactionResult {
  signedTransaction: Transaction | VersionedTransaction;
  signature?: string;
}

/**
 * Sign a transaction using Mobile Wallet Adapter
 */
export async function signTransactionWithMobileWallet(
  transaction: Transaction | VersionedTransaction,
  authToken?: string
): Promise<SignedTransactionResult | null> {
  try {
    const result = await transact(async (wallet: any) => {
      // Authorize or reauthorize the wallet session
      const authorizationResult: AuthorizationResult = authToken
        ? await wallet.reauthorize({
            auth_token: authToken,
            identity: APP_IDENTITY,
          })
        : await wallet.authorize({
            cluster: process.env.NEXT_PUBLIC_SOLANA_NETWORK as any || 'devnet',
            identity: APP_IDENTITY,
          });

      // Sign the transaction
      const signedTransactions = await wallet.signTransactions({
        transactions: [transaction],
      });

      return {
        signedTransaction: signedTransactions[0],
        authToken: authorizationResult.auth_token,
      };
    });

    log.info('Transaction signed successfully');
    return result;
  } catch (error) {
    log.error('Failed to sign transaction', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    return null;
  }
}

/**
 * Sign and send a transaction using Mobile Wallet Adapter
 */
export async function signAndSendTransactionWithMobileWallet(
  transaction: Transaction | VersionedTransaction,
  authToken?: string
): Promise<TransactionResult> {
  try {
    const signature = await transact(async (wallet: any) => {
      // Authorize or reauthorize the wallet session
      const authorizationResult: AuthorizationResult = authToken
        ? await wallet.reauthorize({
            auth_token: authToken,
            identity: APP_IDENTITY,
          })
        : await wallet.authorize({
            cluster: process.env.NEXT_PUBLIC_SOLANA_NETWORK as any || 'devnet',
            identity: APP_IDENTITY,
          });

      // Sign and send the transaction
      const transactionSignatures = await wallet.signAndSendTransactions({
        transactions: [transaction],
      });

      return transactionSignatures[0];
    });

    log.info('Transaction signed and sent successfully', { signature });
    return {
      signature,
      success: true,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log.error('Failed to sign and send transaction', { error: errorMessage });
    return {
      signature: '',
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Sign multiple transactions using Mobile Wallet Adapter
 */
export async function signMultipleTransactionsWithMobileWallet(
  transactions: (Transaction | VersionedTransaction)[],
  authToken?: string
): Promise<(Transaction | VersionedTransaction)[] | null> {
  try {
    const result = await transact(async (wallet: any) => {
      // Authorize or reauthorize the wallet session
      const authorizationResult: AuthorizationResult = authToken
        ? await wallet.reauthorize({
            auth_token: authToken,
            identity: APP_IDENTITY,
          })
        : await wallet.authorize({
            cluster: process.env.NEXT_PUBLIC_SOLANA_NETWORK as any || 'devnet',
            identity: APP_IDENTITY,
          });

      // Sign the transactions
      const signedTransactions = await wallet.signTransactions({
        transactions,
      });

      return signedTransactions;
    });

    log.info('Multiple transactions signed successfully', { count: transactions.length });
    return result;
  } catch (error) {
    log.error('Failed to sign multiple transactions', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      count: transactions.length,
    });
    return null;
  }
}

/**
 * Sign a message using Mobile Wallet Adapter
 */
export async function signMessageWithMobileWallet(
  message: Uint8Array,
  publicKey: PublicKey,
  authToken?: string
): Promise<Uint8Array | null> {
  try {
    const result = await transact(async (wallet: any) => {
      // Authorize or reauthorize the wallet session
      const authorizationResult: AuthorizationResult = authToken
        ? await wallet.reauthorize({
            auth_token: authToken,
            identity: APP_IDENTITY,
          })
        : await wallet.authorize({
            cluster: process.env.NEXT_PUBLIC_SOLANA_NETWORK as any || 'devnet',
            identity: APP_IDENTITY,
          });

      // Sign the message
      const signedMessages = await wallet.signMessages({
        addresses: [publicKey.toBase58()],
        payloads: [message],
      });

      return signedMessages[0];
    });

    log.info('Message signed successfully');
    return result.signedMessage;
  } catch (error) {
    log.error('Failed to sign message', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    return null;
  }
}

/**
 * Create a versioned transaction from instructions
 */
export async function createVersionedTransaction(
  connection: Connection,
  instructions: TransactionInstruction[],
  payer: PublicKey
): Promise<VersionedTransaction | null> {
  try {
    // Get recent blockhash
    const latestBlockhash = await connection.getLatestBlockhash();

    // Create transaction message
    const messageV0 = new TransactionMessage({
      payerKey: payer,
      recentBlockhash: latestBlockhash.blockhash,
      instructions,
    }).compileToV0Message();

    // Create versioned transaction
    const transaction = new VersionedTransaction(messageV0);

    return transaction;
  } catch (error) {
    log.error('Failed to create versioned transaction', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    return null;
  }
}

/**
 * Create a legacy transaction from instructions
 */
export async function createLegacyTransaction(
  connection: Connection,
  instructions: TransactionInstruction[],
  payer: PublicKey
): Promise<Transaction | null> {
  try {
    // Get recent blockhash
    const latestBlockhash = await connection.getLatestBlockhash();

    // Create transaction
    const transaction = new Transaction({
      ...latestBlockhash,
      feePayer: payer,
    });

    // Add instructions
    transaction.add(...instructions);

    return transaction;
  } catch (error) {
    log.error('Failed to create legacy transaction', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    return null;
  }
}