import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { PublicKey } from '@solana/web3.js';

export interface StoredChallengeRecord {
  publicKey: string;
  nonce: string;
  challenge: string;
  expiresAt: number;
  createdAt: number;
  used: boolean;
  domain?: string;
  issuedAt?: number;
}

export const verifySolanaSignature = (
  publicKeyBase58: string,
  signatureBase58: string,
  message: string
): boolean => {
  try {
    const publicKeyBytes = new PublicKey(publicKeyBase58).toBytes();
    const signatureBytes = bs58.decode(signatureBase58);
    const messageBytes = new TextEncoder().encode(message);
    return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
  } catch {
    return false;
  }
};

export const buildSiwsChallenge = (
  domain: string,
  publicKey: string,
  nonce: string,
  issuedAtMs: number,
  expiresAtMs: number,
  statement = 'Sign in to Anubis Chat'
): string => {
  let host: string;
  try {
    host = new URL(domain).host; // includes port if present
  } catch {
    host = domain.replace(/^https?:\/\//, '').split('/')[0];
  }
  const header = `${host} wants you to sign in with your Solana account:`;
  return `${header}\n${publicKey}\n\n${statement}\n\nDomain: ${host}\nNonce: ${nonce}\nIssued At: ${new Date(issuedAtMs).toISOString()}\nExpiration Time: ${new Date(expiresAtMs).toISOString()}`;
};

export const validateChallengeRecord = (
  stored: StoredChallengeRecord,
  message: string,
  nonce: string,
  nowMs: number
): void => {
  if (stored.used) {
    throw new Error('Authentication challenge already used');
  }
  if (stored.expiresAt <= nowMs) {
    throw new Error('Authentication challenge expired');
  }
  if (stored.nonce !== nonce) {
    throw new Error('Authentication challenge nonce mismatch');
  }
  if (stored.challenge !== message) {
    throw new Error('Authentication challenge message mismatch');
  }
  if (stored.domain && !message.includes(`Domain: ${stored.domain}`)) {
    throw new Error('Challenge domain mismatch');
  }
  if (stored.issuedAt && !message.includes('Issued At:')) {
    throw new Error('Challenge missing issuedAt');
  }
};


