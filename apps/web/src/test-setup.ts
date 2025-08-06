import { expect, afterEach, vi, beforeAll } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

expect.extend(matchers)

// Setup environment variables before all tests
beforeAll(() => {
  process.env.NEXT_PUBLIC_CONVEX_URL = 'https://test-convex.cloud'
  process.env.JWT_SECRET = 'test-secret'
  // NODE_ENV is read-only in some environments
  // process.env.NODE_ENV = 'test'
})

afterEach(() => {
  cleanup()
})

// Setup global DOM for jsdom
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
})

Object.defineProperty(window, 'crypto', {
  value: {
    getRandomValues: vi.fn((array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256)
      }
      return array
    }),
  },
  writable: true,
})

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))

// Mock Solana wallet adapters
vi.mock('@solana/wallet-adapter-react', () => ({
  useWallet: () => ({
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
  }),
  useConnection: () => ({
    connection: {
      getBalance: vi.fn().mockResolvedValue(0),
      getAccountInfo: vi.fn().mockResolvedValue(null),
    },
  }),
}))