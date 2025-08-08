import type { WalletAdapter } from '@solana/wallet-adapter-base';
import type { PublicKey } from '@solana/web3.js';
import { vi } from 'vitest';

/**
 * Shared mock utilities for testing
 */

// Mock localStorage implementation
export const createMockLocalStorage = () => ({
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
});

// Mock Solana wallet state
export interface MockWalletState {
  wallet?: WalletAdapter | null;
  adapter?: WalletAdapter | null;
  publicKey?: PublicKey | null;
  connected?: boolean;
  connecting?: boolean;
  disconnecting?: boolean;
  connect?: () => Promise<void>;
  disconnect?: () => Promise<void>;
  select?: (walletName: string) => void;
  wallets?: WalletAdapter[];
  autoConnect?: boolean;
}

// Create mock Solana wallet with customizable state
export const createMockSolanaWallet = (overrides: MockWalletState = {}) => ({
  wallet: null,
  adapter: null,
  publicKey: null,
  connected: false,
  connecting: false,
  disconnecting: false,
  connect: vi.fn(),
  disconnect: vi.fn(),
  select: vi.fn(),
  wallets: [],
  autoConnect: false,
  ...overrides,
});

// Mock Solana connection
export const createMockConnection = () => ({
  getBalance: vi.fn().mockResolvedValue(0),
  getAccountInfo: vi.fn().mockResolvedValue(null),
  getLatestBlockhash: vi
    .fn()
    .mockResolvedValue({ blockhash: 'test', lastValidBlockHeight: 100 }),
});

// Mock window.crypto for tests
export const createMockCrypto = () => ({
  getRandomValues: vi.fn((array: Uint8Array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  }),
});

// Mock Next.js router
export const createMockRouter = () => ({
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
});

// Mock Next.js navigation hooks
export const mockNextNavigation = () => {
  vi.mock('next/navigation', () => ({
    useRouter: () => createMockRouter(),
    useSearchParams: () => new URLSearchParams(),
    usePathname: () => '/',
  }));
};

// Mock Solana wallet adapter hooks
export const mockSolanaWalletAdapter = (walletState: MockWalletState = {}) => {
  const mockWallet = createMockSolanaWallet(walletState);
  const mockConnection = createMockConnection();

  vi.mock('@solana/wallet-adapter-react', () => ({
    useWallet: () => mockWallet,
    useConnection: () => ({ connection: mockConnection }),
  }));

  return { mockWallet, mockConnection };
};

// Mock user data for authentication tests
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-123',
  walletAddress: 'HN7cABqLq46Es1jh92dQQi5DKyXJxfogVQKMrNDK9HbB',
  username: 'testuser',
  createdAt: Date.now(),
  ...overrides,
});

// Mock auth session
export const createMockAuthSession = (overrides = {}) => ({
  token: 'mock-jwt-token',
  user: createMockUser(),
  expiresAt: Date.now() + 3_600_000, // 1 hour
  ...overrides,
});

// Mock API responses
export const createMockResponse = <T = unknown>(data: T, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: () => Promise.resolve(data),
  text: () => Promise.resolve(JSON.stringify(data)),
});

// Mock window for tests
export const createMockWindow = () => {
  const mockLocalStorage = createMockLocalStorage();
  const mockCrypto = createMockCrypto();

  return {
    localStorage: mockLocalStorage,
    location: { host: 'localhost:3001' },
    crypto: mockCrypto,
  };
};

// Setup global window mock
export const setupWindowMock = () => {
  const mockWindow = createMockWindow();

  Object.defineProperty(globalThis, 'window', {
    value: mockWindow,
    writable: true,
  });

  Object.defineProperty(globalThis, 'localStorage', {
    value: mockWindow.localStorage,
    writable: true,
  });

  return mockWindow;
};
