/**
 * Solana Payment Verification System
 * Production-ready blockchain transaction verification for subscription payments
 */

import { Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { v } from 'convex/values';
import { internal } from './_generated/api';
import { httpAction } from './_generated/server';
import { solanaConfig, subscriptionConfig } from './env';

// Types for transaction verification
interface VerificationResult {
  success: boolean;
  error?: string;
  transactionDetails?: {
    signature: string;
    recipient: string;
    sender: string;
    amount: number;
    timestamp: number;
    slot: number;
    confirmationStatus: string;
  };
}

interface PaymentVerificationRequest {
  txSignature: string;
  expectedAmount: number;
  tier: 'pro' | 'pro_plus';
  walletAddress: string;
  isProrated?: boolean;
  isUpgrade?: boolean;
  previousTier?: 'free' | 'pro' | 'pro_plus';
}

// Initialize Solana connection with proper configuration
function createSolanaConnection(): Connection {
  const commitment = solanaConfig.commitmentLevel as any;
  return new Connection(solanaConfig.rpcUrl, {
    commitment,
    httpHeaders: {
      'User-Agent': 'ISIS-Chat/1.0',
    },
    disableRetryOnRateLimit: false,
    confirmTransactionInitialTimeout: 60_000, // 60 seconds
  });
}

// Retry wrapper with exponential backoff
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxRetries) {
        throw lastError;
      }

      // Exponential backoff with jitter
      const delay = baseDelay * 2 ** attempt + Math.random() * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

// Core transaction verification function with enhanced error handling
async function verifyTransaction(
  signature: string,
  expectedRecipient: string,
  expectedAmount: number,
  senderAddress: string
): Promise<VerificationResult> {
  try {
    // Validate inputs
    if (!signature || typeof signature !== 'string' || signature.length < 64) {
      return {
        success: false,
        error: 'Invalid transaction signature format',
      };
    }

    if (!expectedRecipient || typeof expectedRecipient !== 'string') {
      return {
        success: false,
        error: 'Invalid recipient address',
      };
    }

    if (
      !expectedAmount ||
      typeof expectedAmount !== 'number' ||
      expectedAmount <= 0
    ) {
      return {
        success: false,
        error: 'Invalid payment amount',
      };
    }

    if (!senderAddress || typeof senderAddress !== 'string') {
      return {
        success: false,
        error: 'Invalid sender address',
      };
    }

    // Validate public key formats
    try {
      new PublicKey(expectedRecipient);
      new PublicKey(senderAddress);
    } catch (keyError) {
      return {
        success: false,
        error: 'Invalid Solana address format',
      };
    }

    const connection = createSolanaConnection();

    // Verify the transaction exists and get details with enhanced error handling
    const transaction = await withRetry(
      async () => {
        const tx = await connection.getTransaction(signature, {
          commitment: 'finalized',
          maxSupportedTransactionVersion: 0,
        });

        if (!tx) {
          // Check if transaction might still be processing
          try {
            const confirmedTx = await connection.getTransaction(signature, {
              commitment: 'confirmed',
              maxSupportedTransactionVersion: 0,
            });

            if (confirmedTx) {
              throw new Error(
                'Transaction found but not yet finalized - please wait a moment and try again'
              );
            }
          } catch (confirmedError) {
            // Ignore confirmed check errors
          }

          throw new Error(
            'Transaction not found on blockchain - please verify the transaction ID'
          );
        }

        return tx;
      },
      5,
      2000
    ); // More retries for RPC calls, longer delays

    // Check transaction success
    if (transaction.meta?.err) {
      const errorDetails =
        typeof transaction.meta.err === 'object'
          ? JSON.stringify(transaction.meta.err)
          : String(transaction.meta.err);

      return {
        success: false,
        error: `Transaction failed on blockchain: ${errorDetails}`,
      };
    }

    // Verify transaction is finalized
    if (!transaction.slot) {
      return {
        success: false,
        error:
          'Transaction not yet finalized - please wait for blockchain confirmation',
      };
    }

    // Get account keys from transaction (supports v0 messages with address table lookups)
    const message = transaction.transaction.message;
    const messageKeys = message.getAccountKeys({
      accountKeysFromLookups: transaction.meta?.loadedAddresses,
    });

    const allAccountKeys: PublicKey[] = [
      ...messageKeys.staticAccountKeys,
      ...(messageKeys.accountKeysFromLookups?.writable ?? []),
      ...(messageKeys.accountKeysFromLookups?.readonly ?? []),
    ];

    if (allAccountKeys.length === 0) {
      return {
        success: false,
        error: 'Transaction data incomplete - no account information found',
      };
    }

    // Find the expected recipient in account keys
    const recipientPubkey = new PublicKey(expectedRecipient);
    const recipientIndex = allAccountKeys.findIndex((key: PublicKey) =>
      key.equals(recipientPubkey)
    );

    if (recipientIndex === -1) {
      return {
        success: false,
        error:
          'Payment recipient mismatch - transaction was not sent to the correct address',
      };
    }

    // Verify balance changes exist
    if (!(transaction.meta?.preBalances && transaction.meta?.postBalances)) {
      return {
        success: false,
        error: 'Transaction balance data unavailable - blockchain sync issue',
      };
    }

    // Verify balance changes
    const preBalance = transaction.meta.preBalances[recipientIndex] ?? 0;
    const postBalance = transaction.meta.postBalances[recipientIndex] ?? 0;
    const balanceChange = (postBalance - preBalance) / LAMPORTS_PER_SOL;

    // Verify amount (allow small tolerance for rounding)
    const tolerance = 0.001; // 0.001 SOL tolerance for rounding differences
    if (Math.abs(balanceChange - expectedAmount) > tolerance) {
      return {
        success: false,
        error: `Payment amount mismatch: expected ${expectedAmount} SOL, received ${balanceChange.toFixed(6)} SOL`,
      };
    }

    // Verify sender (first account key is typically the signer)
    const actualSender = allAccountKeys[0]?.toBase58();
    if (actualSender !== senderAddress) {
      return {
        success: false,
        error: `Payment sender mismatch: expected from ${senderAddress}, got from ${actualSender}`,
      };
    }

    // Verify transaction is recent (within last 24 hours for security)
    const blockTime = transaction.blockTime ?? Date.now() / 1000;
    const transactionAge = Date.now() / 1000 - blockTime;
    const maxAge = 24 * 60 * 60; // 24 hours in seconds

    if (transactionAge > maxAge) {
      return {
        success: false,
        error:
          'Transaction is too old - payments must be verified within 24 hours',
      };
    }

    // Get transaction timestamp
    return {
      success: true,
      transactionDetails: {
        signature,
        recipient: expectedRecipient,
        sender: senderAddress,
        amount: balanceChange,
        timestamp: blockTime * 1000, // Convert to milliseconds
        slot: transaction.slot,
        confirmationStatus: 'finalized',
      },
    };
  } catch (error) {
    console.error('Transaction verification failed:', error);

    // Enhanced error categorization
    let errorMessage = 'Transaction verification failed';

    if (error instanceof Error) {
      if (
        error.message.includes('network') ||
        error.message.includes('timeout')
      ) {
        errorMessage = 'Network connectivity issue - please try again';
      } else if (error.message.includes('not found')) {
        errorMessage =
          'Transaction not found - please verify the transaction ID';
      } else if (error.message.includes('rate limit')) {
        errorMessage =
          'RPC rate limit exceeded - please wait a moment and try again';
      } else if (error.message.includes('finalized')) {
        errorMessage =
          'Transaction still processing - please wait for blockchain confirmation';
      } else {
        errorMessage = error.message;
      }
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

// Helper function to log payment events
async function logPaymentEvent(
  ctx: any,
  eventType: string,
  metadata: any,
  severity: 'info' | 'warning' | 'error' | 'critical' = 'info'
) {
  try {
    await ctx.runMutation(internal.monitoring.logPaymentEvent, {
      eventType,
      timestamp: Date.now(),
      metadata,
      severity,
    });
  } catch (error) {
    // Don't fail the main operation if logging fails
    console.error('Failed to log payment event:', error);
  }
}

// HTTP Action for payment verification with enhanced error handling
export const verifyPaymentTransaction = httpAction(async (ctx, request) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  const startTime = Date.now();
  let txSignature: string | undefined;
  let walletAddress: string | undefined;
  let tier: string | undefined;

  try {
    // Parse request body with error handling
    let body: PaymentVerificationRequest;
    try {
      body = await request.json();
    } catch (parseError) {
      await logPaymentEvent(
        ctx,
        'verification_failed',
        {
          errorMessage: 'Invalid JSON in request body',
          errorCode: 'PARSE_ERROR',
        },
        'error'
      );

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid JSON in request body',
        }),
        { status: 400, headers }
      );
    }

    const { expectedAmount, isProrated, isUpgrade, previousTier } = body;
    ({ txSignature, tier, walletAddress } = body);

    // Log verification start
    await logPaymentEvent(
      ctx,
      'verification_started',
      {
        txSignature,
        tier,
        amount: expectedAmount,
        walletAddress,
        network: solanaConfig.network,
        isUpgrade,
        previousTier: previousTier || 'free',
      },
      'info'
    );

    // Enhanced input validation with specific error messages
    if (!txSignature || typeof txSignature !== 'string') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Transaction signature is required',
        }),
        { status: 400, headers }
      );
    }

    if (txSignature.length < 64 || txSignature.length > 88) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid transaction signature format',
        }),
        { status: 400, headers }
      );
    }

    if (
      !expectedAmount ||
      typeof expectedAmount !== 'number' ||
      expectedAmount <= 0
    ) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Valid payment amount is required',
        }),
        { status: 400, headers }
      );
    }

    if (expectedAmount > 1000) {
      // Sanity check for very large amounts
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Payment amount exceeds maximum allowed',
        }),
        { status: 400, headers }
      );
    }

    if (!(tier && ['pro', 'pro_plus'].includes(tier))) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Valid subscription tier is required (pro or pro_plus)',
        }),
        { status: 400, headers }
      );
    }

    if (!walletAddress || typeof walletAddress !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'Wallet address is required' }),
        { status: 400, headers }
      );
    }

    // Validate Solana address format
    try {
      new PublicKey(walletAddress);
    } catch {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid Solana wallet address format',
        }),
        { status: 400, headers }
      );
    }

    // Validate payment address is configured
    if (!solanaConfig.paymentAddress) {
      console.error(
        'Payment configuration missing - SOLANA_PAYMENT_ADDRESS not set'
      );
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Payment system not configured - please contact support',
        }),
        { status: 500, headers }
      );
    }

    // Check tier pricing matches configuration
    const tierPricing =
      tier === 'pro'
        ? subscriptionConfig.pricing.pro
        : subscriptionConfig.pricing.proPlus;

    // Calculate expected amount based on whether it's a prorated upgrade
    let expectedTierAmount = tierPricing.priceSOL;
    if (isProrated && tier === 'pro_plus') {
      // For prorated Pro+ upgrade, only pay the difference
      expectedTierAmount =
        subscriptionConfig.pricing.proPlus.priceSOL -
        subscriptionConfig.pricing.pro.priceSOL;
    }

    if (Math.abs(expectedAmount - expectedTierAmount) > 0.001) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Payment amount doesn't match ${isUpgrade ? 'upgrade' : 'tier'} pricing: expected ${expectedTierAmount} SOL`,
        }),
        { status: 400, headers }
      );
    }

    // Add timeout wrapper for blockchain verification
    const VERIFICATION_TIMEOUT = 30_000; // 30 seconds
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(
        () =>
          reject(
            new Error('Verification timeout - blockchain query took too long')
          ),
        VERIFICATION_TIMEOUT
      );
    });

    // Verify the transaction on blockchain with timeout
    const verificationResult = await Promise.race([
      verifyTransaction(
        txSignature,
        solanaConfig.paymentAddress,
        expectedAmount,
        walletAddress
      ),
      timeoutPromise,
    ]);

    if (!verificationResult.success) {
      // Log verification failures for monitoring
      await logPaymentEvent(
        ctx,
        'verification_failed',
        {
          txSignature,
          errorMessage: verificationResult.error,
          errorCode: 'BLOCKCHAIN_VERIFICATION_FAILED',
          amount: expectedAmount,
          tier,
          walletAddress,
          processingTime: Date.now() - startTime,
          network: solanaConfig.network,
        },
        'error'
      );

      console.error('Payment verification failed', {
        txSignature,
        error: verificationResult.error,
        expectedAmount,
        tier,
        walletAddress,
        timestamp: new Date().toISOString(),
      });

      return new Response(
        JSON.stringify({
          success: false,
          error: verificationResult.error || 'Transaction verification failed',
        }),
        { status: 400, headers }
      );
    }

    // Log successful verification
    await logPaymentEvent(
      ctx,
      'verification_completed',
      {
        txSignature,
        tier,
        amount: expectedAmount,
        walletAddress,
        processingTime: Date.now() - startTime,
        network: solanaConfig.network,
      },
      'info'
    );

    // Process the payment through Convex mutation with error handling
    try {
      const result = await ctx.runMutation(
        internal.subscriptions.processVerifiedPayment,
        {
          tier: tier as 'pro' | 'pro_plus',
          txSignature,
          amountSol: expectedAmount,
          walletAddress,
          isProrated,
          verificationDetails: verificationResult.transactionDetails!,
        }
      );

      // Log successful payment for monitoring
      await logPaymentEvent(
        ctx,
        'payment_verified',
        {
          txSignature,
          tier,
          amount: expectedAmount,
          walletAddress,
          paymentId: result.paymentId,
          processingTime: Date.now() - startTime,
          network: solanaConfig.network,
        },
        'info'
      );

      console.log('Payment processed successfully', {
        paymentId: result.paymentId,
        tier,
        amount: expectedAmount,
        txSignature,
        timestamp: new Date().toISOString(),
      });

      return new Response(
        JSON.stringify({
          success: true,
          paymentId: result.paymentId,
          transactionDetails: verificationResult.transactionDetails,
        }),
        { status: 200, headers }
      );
    } catch (mutationError) {
      // Log payment processing failure
      await logPaymentEvent(
        ctx,
        'payment_failed',
        {
          txSignature,
          tier,
          amount: expectedAmount,
          walletAddress,
          errorMessage:
            mutationError instanceof Error
              ? mutationError.message
              : 'Unknown mutation error',
          errorCode: 'PAYMENT_PROCESSING_FAILED',
          processingTime: Date.now() - startTime,
          network: solanaConfig.network,
        },
        'error'
      );

      console.error(
        'Payment processing error after verification:',
        mutationError
      );

      // Specific error handling for common Convex errors
      let errorMessage = 'Payment processing failed after verification';
      if (mutationError instanceof Error) {
        if (mutationError.message.includes('User not found')) {
          errorMessage = 'User account not found - please sign in again';
        } else if (mutationError.message.includes('already processed')) {
          errorMessage = 'This payment has already been processed';
        } else if (mutationError.message.includes('duplicate')) {
          errorMessage =
            'Duplicate payment detected - transaction already exists';
        }
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage,
        }),
        { status: 500, headers }
      );
    }
  } catch (error) {
    // Log critical system errors
    await logPaymentEvent(
      ctx,
      'blockchain_error',
      {
        txSignature,
        tier,
        walletAddress,
        errorMessage:
          error instanceof Error ? error.message : 'Unknown system error',
        errorCode: 'HTTP_ACTION_ERROR',
        processingTime: Date.now() - startTime,
        network: solanaConfig.network,
      },
      'critical'
    );

    console.error('Payment verification HTTP action error:', error);

    // Enhanced error categorization for HTTP action errors
    let errorMessage = 'Internal server error';
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        errorMessage = 'Request timeout - please try again';
      } else if (error.message.includes('network')) {
        errorMessage = 'Network error - please check your connection';
      } else if (error.message.includes('rate limit')) {
        errorMessage =
          'Service temporarily unavailable - please wait and try again';
      }
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      { status: 500, headers }
    );
  }
});

// Helper function for testing transaction verification (for development)
export const testTransactionVerification = httpAction(async (_, request) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return new Response(
      JSON.stringify({ error: 'Test endpoint not available in production' }),
      { status: 403, headers }
    );
  }

  try {
    const body = await request.json();
    const { txSignature, expectedRecipient, expectedAmount, senderAddress } =
      body;

    const result = await verifyTransaction(
      txSignature,
      expectedRecipient,
      expectedAmount,
      senderAddress
    );

    return new Response(JSON.stringify(result), { status: 200, headers });
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers }
    );
  }
});
