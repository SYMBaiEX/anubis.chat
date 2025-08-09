/**
 * Solana Payment Webhook Handler
 * Processes subscription payments via Solana transactions
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { convexConfig, solanaConfig, paymentConfig } from '@/lib/env';
import { authRateLimit } from '@/lib/middleware/rate-limit';
import {
  addSecurityHeaders,
  serverErrorResponse,
  successResponse,
  validationErrorResponse,
} from '@/lib/utils/api-response';
import { createModuleLogger } from '@/lib/utils/logger';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@convex/_generated/api';
import { getAuthUserId } from '@convex-dev/auth/server';

const log = createModuleLogger('payment-webhook-api');

// =============================================================================
// Request Validation
// =============================================================================

const paymentSchema = z.object({
  txSignature: z.string().min(64).max(128),
  tier: z.union([z.literal('pro'), z.literal('pro_plus')]),
  amountSol: z.number().min(0.01).max(1.0),
});

// =============================================================================
// Solana Connection
// =============================================================================

const SOLANA_RPC_URL = solanaConfig.rpcHost;
const TREASURY_WALLET = solanaConfig.paymentAddress;

if (!TREASURY_WALLET) {
  throw new Error('NEXT_PUBLIC_SOLANA_PAYMENT_ADDRESS environment variable is required');
}

const connection = new Connection(SOLANA_RPC_URL, solanaConfig.commitment);

// =============================================================================
// Transaction Verification
// =============================================================================

async function verifyPayment(
  signature: string,
  expectedAmount: number,
  senderAddress: string
): Promise<{ verified: boolean; confirmations?: number; error?: string }> {
  try {
    // Get transaction details
    const transaction = await connection.getTransaction(signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    });

    if (!transaction) {
      return { verified: false, error: 'Transaction not found' };
    }

    if (transaction.meta?.err) {
      return { verified: false, error: 'Transaction failed on blockchain' };
    }

    // Verify transaction details
    const preBalances = transaction.meta?.preBalances || [];
    const postBalances = transaction.meta?.postBalances || [];
    const accountKeys = transaction.transaction.message.accountKeys || [];

    // Find sender and treasury accounts
    let senderIndex = -1;
    let treasuryIndex = -1;

    for (let i = 0; i < accountKeys.length; i++) {
      const key = accountKeys[i].toBase58();
      if (key === senderAddress) senderIndex = i;
      if (key === TREASURY_WALLET) treasuryIndex = i;
    }

    if (senderIndex === -1 || treasuryIndex === -1) {
      return { verified: false, error: 'Sender or treasury not found in transaction' };
    }

    // Calculate transferred amount in SOL
    const lamportsTransferred = (preBalances[senderIndex] - postBalances[senderIndex]) - 
                               (transaction.meta?.fee || 0);
    const solTransferred = lamportsTransferred / 1e9; // Convert lamports to SOL

    // Verify amount (allow small tolerance for fees)
    const tolerance = 0.001; // 0.001 SOL tolerance
    if (Math.abs(solTransferred - expectedAmount) > tolerance) {
      return {
        verified: false,
        error: `Amount mismatch: expected ${expectedAmount} SOL, got ${solTransferred} SOL`,
      };
    }

    // Get confirmation count
    const confirmations = await connection.getSignatureStatuses([signature]);
    const confirmationCount = confirmations.value[0]?.confirmations || 0;

    return { verified: true, confirmations: confirmationCount };
  } catch (error) {
    log.error('Payment verification error', {
      signature,
      error: error instanceof Error ? error.message : String(error),
    });
    return { verified: false, error: 'Failed to verify transaction' };
  }
}

// =============================================================================
// Route Handlers
// =============================================================================

export async function POST(request: NextRequest) {
  return authRateLimit(request, async (req) => {
    try {
      // Initialize Convex client for auth
      const convexUrl = convexConfig.publicUrl;
      if (!convexUrl) {
        throw new Error('NEXT_PUBLIC_CONVEX_URL environment variable is required');
      }
      const convexClient = new ConvexHttpClient(convexUrl);

      // Get authenticated user
      const authToken = req.headers.get('authorization')?.replace('Bearer ', '');
      if (!authToken) {
        return validationErrorResponse('Authentication required');
      }

      // Set auth token on client
      convexClient.setAuth(authToken);

      // Get current user from Convex Auth
      const currentUser = await convexClient.query(api.users.getCurrentUserProfile);
      if (!currentUser) {
        return validationErrorResponse('User not authenticated or not found');
      }

      // Parse and validate request body
      const body = await req.json();
      const validation = paymentSchema.safeParse(body);

      if (!validation.success) {
        return validationErrorResponse(
          'Invalid payment data',
          validation.error.flatten().fieldErrors
        );
      }

      const { txSignature, tier, amountSol } = validation.data;
      const walletAddress = currentUser.walletAddress;

      // Verify payment on Solana blockchain
      const verification = await verifyPayment(txSignature, amountSol, walletAddress);

      if (!verification.verified) {
        log.warn('Payment verification failed', {
          walletAddress,
          txSignature,
          error: verification.error,
        });
        return validationErrorResponse(
          `Payment verification failed: ${verification.error}`
        );
      }

      // Process payment in Convex using authenticated user ID
      const paymentResult = await convexClient.mutation(
        api.subscriptions.processPayment,
        {
          userId: currentUser._id,
          tier,
          txSignature,
          amountSol,
        }
      );

      // Confirm payment with blockchain data
      await convexClient.mutation(
        api.subscriptions.confirmPayment,
        {
          txSignature,
          confirmations: verification.confirmations || 0,
        }
      );

      log.info('Payment processed successfully', {
        userId: currentUser._id,
        walletAddress,
        tier,
        txSignature,
        amountSol,
        confirmations: verification.confirmations,
      });

      const response = successResponse({
        success: true,
        paymentId: paymentResult.paymentId,
        tier: paymentResult.tier,
        periodEnd: paymentResult.periodEnd,
        confirmations: verification.confirmations,
      });

      return addSecurityHeaders(response);
    } catch (error) {
      log.error('Payment processing error', {
        error: error instanceof Error ? error.message : String(error),
      });

      return serverErrorResponse('Failed to process payment');
    }
  });
}

export async function GET(request: NextRequest) {
  // Health check endpoint
  try {
    await connection.getVersion();
    return successResponse({ status: 'healthy', rpc: SOLANA_RPC_URL });
  } catch (error) {
    return serverErrorResponse('Solana RPC connection failed');
  }
}

export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  return addSecurityHeaders(response);
}