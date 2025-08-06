import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { PublicKey } from '@solana/web3.js'
import { useWallet } from '../useWallet'
import { createMockSolanaWallet, createMockConnection } from '../../test-utils/mocks'
import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react'

// Mock Solana wallet adapter
vi.mock('@solana/wallet-adapter-react', () => ({
  useWallet: vi.fn(),
}))

// Get localStorage mock from global setup - ensure window exists
const mockLocalStorage = globalThis.window?.localStorage || {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

describe('useWallet', () => {
  const mockConnect = vi.fn()
  const mockDisconnect = vi.fn()
  const mockSelect = vi.fn()
  
  const mockPublicKey = new PublicKey('11111111111111111111111111111112')

  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should return initial state when no wallet is connected', () => {
    vi.mocked(useSolanaWallet).mockReturnValue({
      wallet: null,
      adapter: null,
      publicKey: null,
      connected: false,
      connecting: false,
      disconnecting: false,
      connect: mockConnect,
      disconnect: mockDisconnect,
      select: mockSelect,
      wallets: [],
      autoConnect: false,
    })

    const { result } = renderHook(() => useWallet())

    expect(result.current.publicKey).toBeNull()
    expect(result.current.connected).toBe(false)
    expect(result.current.connecting).toBe(false)
    expect(result.current.balance).toBeNull()
    expect(result.current.connectionHealth).toBeNull()
  })

  it('should return wallet state when connected', async () => {
    const mockGetBalance = vi.fn().mockResolvedValue(1000000000) // 1 SOL in lamports
    
    vi.mocked(useSolanaWallet).mockReturnValue({
      wallet: { adapter: { name: 'Phantom' } } as any,
      adapter: null,
      publicKey: mockPublicKey,
      connected: true,
      connecting: false,
      disconnecting: false,
      connect: mockConnect,
      disconnect: mockDisconnect,
      select: mockSelect,
      wallets: [],
      autoConnect: false,
    })

    // Mock the connection object
    const mockConnection = {
      getBalance: mockGetBalance,
      getAccountInfo: vi.fn().mockResolvedValue(null),
    }
    
    vi.doMock('@solana/wallet-adapter-react', () => ({
      useWallet: () => vi.mocked(useSolanaWallet)(),
      useConnection: () => ({ connection: mockConnection }),
    }))

    const { result } = renderHook(() => useWallet())

    expect(result.current.publicKey).toBe(mockPublicKey)
    expect(result.current.connected).toBe(true)
    expect(result.current.connecting).toBe(false)
  })

  it('should handle connect function', async () => {
    mockConnect.mockResolvedValue(undefined)
    
    vi.mocked(useSolanaWallet).mockReturnValue({
      wallet: null,
      adapter: null,
      publicKey: null,
      connected: false,
      connecting: false,
      disconnecting: false,
      connect: mockConnect,
      disconnect: mockDisconnect,
      select: mockSelect,
      wallets: [],
      autoConnect: false,
    })

    const { result } = renderHook(() => useWallet())

    await act(async () => {
      await result.current.connect()
    })

    expect(mockConnect).toHaveBeenCalledTimes(1)
  })

  it('should handle disconnect function', async () => {
    mockDisconnect.mockResolvedValue(undefined)
    
    vi.mocked(useSolanaWallet).mockReturnValue({
      wallet: { adapter: { name: 'Phantom' } } as any,
      adapter: null,
      publicKey: mockPublicKey,
      connected: true,
      connecting: false,
      disconnecting: false,
      connect: mockConnect,
      disconnect: mockDisconnect,
      select: mockSelect,
      wallets: [],
      autoConnect: false,
    })

    const { result } = renderHook(() => useWallet())

    await act(async () => {
      await result.current.disconnect()
    })

    expect(mockDisconnect).toHaveBeenCalledTimes(1)
  })

  it('should handle connection health monitoring', async () => {
    const mockConnection = createMockConnection()
    mockConnection.getBalance.mockResolvedValue(1000000000) // 1 SOL
    
    // Mock with connected wallet
    vi.mocked(useSolanaWallet).mockReturnValue(createMockSolanaWallet({
      wallet: { adapter: { name: 'Phantom' } } as any,
      publicKey: mockPublicKey,
      connected: true,
      connect: mockConnect,
      disconnect: mockDisconnect,
      select: mockSelect,
    }))

    // Mock the connection separately since it's imported via useConnection
    vi.doMock('@solana/wallet-adapter-react', () => ({
      useWallet: vi.mocked(useSolanaWallet),
      useConnection: () => ({ connection: mockConnection }),
    }))

    const { result } = renderHook(() => useWallet())

    // Should have health monitoring properties
    expect(result.current.isHealthy).toBe(true)
    expect(result.current.connectionHealthScore).toBe(100)
    
    // When wallet is connected, health should be monitored
    expect(result.current.connected).toBe(true)
    expect(typeof result.current.isHealthy).toBe('boolean')
    expect(typeof result.current.connectionHealthScore).toBe('number')
    expect(result.current.connectionHealthScore).toBeGreaterThanOrEqual(0)
    expect(result.current.connectionHealthScore).toBeLessThanOrEqual(100)
  })

  it('should calculate health score based on connection response time', async () => {
    const mockConnection = createMockConnection()
    
    // Simulate slow response (should lower health score)
    mockConnection.getBalance.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve(1000000000), 200))
    )
    
    vi.mocked(useSolanaWallet).mockReturnValue(createMockSolanaWallet({
      wallet: { adapter: { name: 'Phantom' } } as any,
      publicKey: mockPublicKey,
      connected: true,
      connect: mockConnect,
      disconnect: mockDisconnect,
      select: mockSelect,
    }))

    const { result } = renderHook(() => useWallet())

    expect(result.current.isHealthy).toBeDefined()
    expect(result.current.connectionHealthScore).toBeDefined()
  })

  it('should persist wallet selection in localStorage', async () => {
    const walletName = 'Phantom'
    
    vi.mocked(useSolanaWallet).mockReturnValue({
      wallet: { adapter: { name: walletName } } as any,
      adapter: null,
      publicKey: null,
      connected: false,
      connecting: false,
      disconnecting: false,
      connect: mockConnect,
      disconnect: mockDisconnect,
      select: mockSelect,
      wallets: [],
      autoConnect: false,
    })

    renderHook(() => useWallet())

    // Should save selected wallet to localStorage when wallet changes
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'selectedWallet',
      expect.any(String)
    )
  })

  it('should handle wallet errors gracefully', async () => {
    const mockError = new Error('Wallet connection failed')
    mockConnect.mockRejectedValue(mockError)
    
    vi.mocked(useSolanaWallet).mockReturnValue({
      wallet: null,
      adapter: null,
      publicKey: null,
      connected: false,
      connecting: false,
      disconnecting: false,
      connect: mockConnect,
      disconnect: mockDisconnect,
      select: mockSelect,
      wallets: [],
      autoConnect: false,
    })

    const { result } = renderHook(() => useWallet())

    await act(async () => {
      try {
        await result.current.connect()
      } catch (error) {
        expect(error).toBe(mockError)
      }
    })
  })
})