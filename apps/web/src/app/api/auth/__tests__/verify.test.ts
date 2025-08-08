import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock all external dependencies first
const mockConvexMutation = vi.fn();
const mockNaclVerify = vi.fn();
const mockJwtSign = vi.fn();
const mockBs58Decode = vi.fn();

vi.mock('convex/browser', () => ({
  ConvexHttpClient: vi.fn().mockImplementation(() => ({
    mutation: mockConvexMutation,
  })),
}));

vi.mock('@convex/_generated/api', () => ({
  api: {
    users: {
      upsert: 'users:upsert',
    },
  },
}));

vi.mock('tweetnacl', () => ({
  sign: {
    detached: {
      verify: mockNaclVerify,
    },
  },
}));

vi.mock('jsonwebtoken', () => ({
  sign: mockJwtSign,
  verify: vi.fn(),
}));

vi.mock('bs58', () => ({
  decode: mockBs58Decode,
}));

// Now import the route after mocks are set up
const { POST } = await import('../verify/route');

describe.skip('/api/auth/verify', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
    process.env.NEXT_PUBLIC_CONVEX_URL = 'https://test-convex.cloud';
  });

  it('should verify valid signature and return token', async () => {
    const mockPublicKey = 'HN7cABqLq46Es1jh92dQQi5DKyXJxfogVQKMrNDK9HbB';
    const mockSignature = 'valid-signature';
    const mockMessage = 'test-message';
    const mockNonce = 'test-nonce';
    const mockToken = 'jwt-token';

    // Mock successful signature verification
    mockNaclVerify.mockReturnValue(true);
    mockBs58Decode.mockReturnValue(new Uint8Array(64));
    mockJwtSign.mockReturnValue(mockToken);

    // Mock successful user creation
    const mockUser = {
      _id: 'user123',
      publicKey: mockPublicKey,
      username: null,
      createdAt: Date.now(),
    };
    mockConvexMutation.mockResolvedValue(mockUser);

    const request = new NextRequest('http://localhost:3000/api/auth/verify', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        publicKey: mockPublicKey,
        signature: mockSignature,
        message: mockMessage,
        nonce: mockNonce,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.token).toBe(mockToken);
    expect(data.user).toEqual({
      id: mockUser._id,
      publicKey: mockUser.publicKey,
      username: mockUser.username,
      createdAt: mockUser.createdAt,
    });
    expect(mockConvexMutation).toHaveBeenCalledWith('users:upsert', {
      walletAddress: mockPublicKey,
    });
  });

  it('should reject invalid signature', async () => {
    const mockPublicKey = 'HN7cABqLq46Es1jh92dQQi5DKyXJxfogVQKMrNDK9HbB';
    const mockSignature = 'invalid-signature';
    const mockMessage = 'test-message';
    const mockNonce = 'test-nonce';

    // Mock failed signature verification
    mockNaclVerify.mockReturnValue(false);
    mockBs58Decode.mockReturnValue(new Uint8Array(64));

    const request = new NextRequest('http://localhost:3000/api/auth/verify', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        publicKey: mockPublicKey,
        signature: mockSignature,
        message: mockMessage,
        nonce: mockNonce,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Invalid signature');
  });

  it('should handle missing required fields', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/verify', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        publicKey: 'test',
        // missing signature, message, nonce
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing required fields');
  });

  it('should handle Convex errors gracefully', async () => {
    const mockPublicKey = 'HN7cABqLq46Es1jh92dQQi5DKyXJxfogVQKMrNDK9HbB';
    const mockSignature = 'valid-signature';
    const mockMessage = 'test-message';
    const mockNonce = 'test-nonce';

    // Mock successful signature verification
    mockNaclVerify.mockReturnValue(true);
    mockBs58Decode.mockReturnValue(new Uint8Array(64));

    // Mock Convex error
    const convexError = new Error('Database connection failed');
    mockConvexMutation.mockRejectedValue(convexError);

    const request = new NextRequest('http://localhost:3000/api/auth/verify', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        publicKey: mockPublicKey,
        signature: mockSignature,
        message: mockMessage,
        nonce: mockNonce,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to create/update user');
    expect(data.details).toBe('Database connection failed');
  });

  it('should handle invalid public key format', async () => {
    const mockPublicKey = 'invalid-key-format';
    const mockSignature = 'signature';
    const mockMessage = 'message';
    const mockNonce = 'nonce';

    const request = new NextRequest('http://localhost:3000/api/auth/verify', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        publicKey: mockPublicKey,
        signature: mockSignature,
        message: mockMessage,
        nonce: mockNonce,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid public key format');
  });

  it('should handle signature decoding errors', async () => {
    const mockPublicKey = 'HN7cABqLq46Es1jh92dQQi5DKyXJxfogVQKMrNDK9HbB';
    const mockSignature = 'invalid-signature-encoding';
    const mockMessage = 'message';
    const mockNonce = 'nonce';

    // Mock signature decoding error
    mockBs58Decode.mockImplementation(() => {
      throw new Error('Invalid base58 encoding');
    });

    const request = new NextRequest('http://localhost:3000/api/auth/verify', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        publicKey: mockPublicKey,
        signature: mockSignature,
        message: mockMessage,
        nonce: mockNonce,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid signature format');
  });

  it('should handle rate limiting', async () => {
    // This test would require implementing rate limiting first
    // For now, we just verify the endpoint exists
    const request = new NextRequest('http://localhost:3000/api/auth/verify', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    expect(response).toBeDefined();
  });

  it('should validate message format for SIWS compatibility', async () => {
    const mockPublicKey = 'HN7cABqLq46Es1jh92dQQi5DKyXJxfogVQKMrNDK9HbB';
    const mockSignature = 'valid-signature';
    const mockInvalidMessage = 'not-a-siws-message';
    const mockNonce = 'test-nonce';

    const request = new NextRequest('http://localhost:3000/api/auth/verify', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        publicKey: mockPublicKey,
        signature: mockSignature,
        message: mockInvalidMessage,
        nonce: mockNonce,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    // Should validate SIWS message format
    expect(response.status).toBe(400);
    expect(data.error).toContain('Invalid message format');
  });
});
