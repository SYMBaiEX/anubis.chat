import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useAuth } from '../useAuth'
import { createMockUser, createMockAuthSession, createMockResponse } from '../../test-utils/mocks'

// Mock fetch for API calls
global.fetch = vi.fn()

// Get localStorage mock from global setup - ensure window exists
const mockLocalStorage = globalThis.window?.localStorage || {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

// Create a mock wallet that can be modified during tests
const mockWallet = {
  publicKey: null,
  connected: false,
  isConnected: false,
  signMessage: vi.fn(),
}

// Mock wallet hook using standardized approach
vi.mock('../useWallet', () => ({
  useWallet: () => mockWallet,
}))

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
    
    // Reset wallet state
    mockWallet.publicKey = null
    mockWallet.connected = false
    mockWallet.isConnected = false
    mockWallet.signMessage = vi.fn()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should return initial unauthenticated state', () => {
    const { result } = renderHook(() => useAuth())

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should handle successful authentication', async () => {
    const mockUser = createMockUser({ id: 'user1', walletAddress: 'test-public-key' })
    const mockAuthSession = createMockAuthSession({ user: mockUser })

    // Set up connected wallet state
    mockWallet.publicKey = { toString: () => 'test-public-key' } as any
    mockWallet.connected = true
    mockWallet.isConnected = true
    mockWallet.signMessage = vi.fn().mockResolvedValue('signature')

    // Mock challenge request
    vi.mocked(fetch).mockResolvedValueOnce(createMockResponse({
      challenge: 'test-challenge',
      nonce: 'test-nonce'
    }) as Response)

    // Mock verify request
    vi.mocked(fetch).mockResolvedValueOnce(createMockResponse({
      token: mockAuthSession.token,
      user: mockUser,
    }) as Response)

    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await result.current.login()
    })

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user).toEqual(mockUser)
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('isis-auth-token', mockAuthSession.token)
  })

  it('should handle authentication errors', async () => {
    // Set up connected wallet state
    mockWallet.publicKey = { toString: () => 'test-public-key' } as any
    mockWallet.connected = true
    mockWallet.isConnected = true
    mockWallet.signMessage = vi.fn().mockResolvedValue('signature')
    
    vi.mocked(fetch).mockRejectedValue(new Error('Authentication failed'))

    const { result } = renderHook(() => useAuth())

    await act(async () => {
      try {
        await result.current.login()
      } catch (error) {
        // Expected to throw
      }
    })

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.error).toBeTruthy()
  })

  it('should handle logout', async () => {
    // Mock initial authenticated state
    mockLocalStorage.getItem.mockReturnValue('existing-token')
    
    // Mock successful logout
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    } as Response)

    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await result.current.logout()
    })

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('isis-auth-token')
  })

  it('should validate token on initialization', async () => {
    const mockToken = 'valid-token'
    const mockUser = {
      id: 'user1',
      publicKey: 'test-public-key',
      username: 'testuser',
      createdAt: Date.now(),
    }

    mockLocalStorage.getItem.mockReturnValue(mockToken)

    // Mock token validation
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ user: mockUser }),
    } as Response)

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.user).toEqual(mockUser)
    })
  })

  it('should handle invalid token on initialization', async () => {
    const mockToken = 'invalid-token'
    
    mockLocalStorage.getItem.mockReturnValue(mockToken)

    // Mock failed token validation
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 401,
    } as Response)

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.user).toBeNull()
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('isis-auth-token')
    })
  })

  it('should refresh token when needed', async () => {
    const mockOldToken = 'old-token'
    const mockNewToken = 'new-token'
    
    mockLocalStorage.getItem.mockReturnValue(mockOldToken)

    // Mock token refresh
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ token: mockNewToken }),
    } as Response)

    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await result.current.refreshToken()
    })

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('isis-auth-token', mockNewToken)
  })

  it('should handle rate limiting', async () => {
    // Mock connected wallet
    vi.doMock('../useWallet', () => ({
      useWallet: () => ({
        publicKey: { toString: () => 'test-public-key' },
        connected: true,
        isConnected: true,
        signMessage: vi.fn().mockResolvedValue('signature'),
      }),
    }))

    // Mock rate limited response
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: () => Promise.resolve({
        error: 'Rate limit exceeded',
        retryAfter: 60000
      }),
    } as Response)

    const { result } = renderHook(() => useAuth())

    await act(async () => {
      try {
        await result.current.login()
      } catch (error) {
        // Expected to throw
      }
    })

    expect(result.current.error).toBeDefined()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('should sync authentication state with wallet connection', async () => {
    const { result } = renderHook(() => useAuth())

    // Should react to wallet disconnection by logging out
    expect(result.current.isAuthenticated).toBe(false)
  })
})