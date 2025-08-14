import { describe, expect, it } from 'bun:test';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import {
  buildSiwsChallenge,
  validateChallengeRecord,
  verifySolanaSignature,
  type StoredChallengeRecord,
} from './solanaAuth';

describe('solanaAuth helpers', () => {
  it('verifies a valid signature', () => {
    const keypair = nacl.sign.keyPair();
    const publicKeyBase58 = bs58.encode(keypair.publicKey);
    const message = 'test-message-' + Math.random().toString(36);
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = nacl.sign.detached(messageBytes, keypair.secretKey);
    const signatureBase58 = bs58.encode(signatureBytes);

    const ok = verifySolanaSignature(publicKeyBase58, signatureBase58, message);
    expect(ok).toBe(true);
  });

  it('fails verification when message is tampered', () => {
    const keypair = nacl.sign.keyPair();
    const publicKeyBase58 = bs58.encode(keypair.publicKey);
    const message = 'message-a';
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = nacl.sign.detached(messageBytes, keypair.secretKey);
    const signatureBase58 = bs58.encode(signatureBytes);

    const ok = verifySolanaSignature(publicKeyBase58, signatureBase58, 'message-b');
    expect(ok).toBe(false);
  });

  it('fails verification with wrong public key', () => {
    const keypairA = nacl.sign.keyPair();
    const keypairB = nacl.sign.keyPair();
    const publicKeyBase58 = bs58.encode(keypairA.publicKey);
    const message = 'hello-world';
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = nacl.sign.detached(messageBytes, keypairB.secretKey);
    const signatureBase58 = bs58.encode(signatureBytes);

    const ok = verifySolanaSignature(publicKeyBase58, signatureBase58, message);
    expect(ok).toBe(false);
  });

  it('builds SIWS-style challenge and validates stored record', () => {
    const domain = 'https://anubis.chat';
    const publicKey = 'DummyPublicKeyBase58';
    const nonce = 'nonce-123';
    const issuedAt = Date.now();
    const expiresAt = issuedAt + 5 * 60 * 1000;
    const challenge = buildSiwsChallenge(domain, publicKey, nonce, issuedAt, expiresAt);

    const stored: StoredChallengeRecord = {
      publicKey,
      nonce,
      challenge,
      expiresAt,
      createdAt: issuedAt,
      used: false,
      domain: 'anubis.chat',
      issuedAt,
    };

    expect(() => validateChallengeRecord(stored, challenge, nonce, Date.now())).not.toThrow();
  });

  it('throws for expired challenge', () => {
    const stored: StoredChallengeRecord = {
      publicKey: 'pk',
      nonce: 'n',
      challenge: 'c',
      expiresAt: Date.now() - 1,
      createdAt: Date.now() - 1000,
      used: false,
    };
    expect(() => validateChallengeRecord(stored, 'c', 'n', Date.now())).toThrow('expired');
  });

  it('throws for domain mismatch', () => {
    const now = Date.now();
    const challenge = buildSiwsChallenge('https://anubis.chat', 'pk', 'n', now, now + 60_000);
    const stored: StoredChallengeRecord = {
      publicKey: 'pk',
      nonce: 'n',
      challenge,
      expiresAt: now + 60_000,
      createdAt: now,
      used: false,
      domain: 'other.example',
      issuedAt: now,
    };
    expect(() => validateChallengeRecord(stored, challenge, 'n', now)).toThrow(/domain mismatch/i);
  });

  it('throws for message mismatch', () => {
    const now = Date.now();
    const stored: StoredChallengeRecord = {
      publicKey: 'pk',
      nonce: 'n',
      challenge: 'c1',
      expiresAt: now + 60_000,
      createdAt: now,
      used: false,
    };
    expect(() => validateChallengeRecord(stored, 'c2', 'n', now)).toThrow(/message mismatch/i);
  });

  it('throws for reused challenge', () => {
    const now = Date.now();
    const stored: StoredChallengeRecord = {
      publicKey: 'pk',
      nonce: 'n',
      challenge: 'c',
      expiresAt: now + 1000,
      createdAt: now,
      used: true,
    };
    expect(() => validateChallengeRecord(stored, 'c', 'n', now)).toThrow('already used');
  });

  it('throws for nonce mismatch', () => {
    const now = Date.now();
    const stored: StoredChallengeRecord = {
      publicKey: 'pk',
      nonce: 'n1',
      challenge: 'c',
      expiresAt: now + 1000,
      createdAt: now,
      used: false,
    };
    expect(() => validateChallengeRecord(stored, 'c', 'n2', now)).toThrow('nonce mismatch');
  });
});


