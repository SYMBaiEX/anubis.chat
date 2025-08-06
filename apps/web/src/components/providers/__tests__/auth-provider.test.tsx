import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { AuthProvider } from '../auth-provider'
import { useAuth } from '../../../hooks/useAuth'

// Create a test component that uses the auth context
const TestComponent = () => {
  try {
    const auth = useAuth()
    return (
      <div>
        <div data-testid="authenticated">{auth.isAuthenticated.toString()}</div>
        <div data-testid="loading">{auth.isLoading.toString()}</div>
        <div data-testid="user">{auth.user?.username ?? 'none'}</div>
        <div data-testid="error">{auth.error?.message ?? 'none'}</div>
      </div>
    )
  } catch (error) {
    return <div data-testid="error">Context error</div>
  }
}

// Mock wallet hook
vi.mock('../../../hooks/useWallet', () => ({
  useWallet: () => ({
    publicKey: null,
    connected: false,
    signMessage: vi.fn(),
  }),
}))

// Mock fetch
global.fetch = vi.fn()

// Get localStorage mock from global setup
const mockLocalStorage = window.localStorage

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
  })

  it('should provide initial authentication state', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
    expect(screen.getByTestId('loading')).toHaveTextContent('false')
    expect(screen.getByTestId('user')).toHaveTextContent('none')
    expect(screen.getByTestId('error')).toHaveTextContent('none')
  })

  it('should handle authentication state changes', async () => {
    const mockUser = {
      id: 'user1',
      publicKey: 'test-key',
      username: 'testuser',
      createdAt: Date.now(),
    }

    // Mock token validation
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ user: mockUser }),
    } as Response)

    mockLocalStorage.getItem.mockReturnValue('valid-token')

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true')
      expect(screen.getByTestId('user')).toHaveTextContent('testuser')
    })
  })

  it('should handle invalid tokens', async () => {
    // Mock failed token validation
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 401,
    } as Response)

    mockLocalStorage.getItem.mockReturnValue('invalid-token')

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_token')
    })
  })

  it('should handle loading states', async () => {
    // Mock slow API response
    vi.mocked(fetch).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: () => Promise.resolve({ user: null }),
      } as Response), 100))
    )

    mockLocalStorage.getItem.mockReturnValue('token')

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // Should show loading initially
    expect(screen.getByTestId('loading')).toHaveTextContent('true')

    // Should stop loading after API call
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
    })
  })

  it('should handle authentication errors', async () => {
    const mockError = new Error('Network error')
    vi.mocked(fetch).mockRejectedValue(mockError)

    mockLocalStorage.getItem.mockReturnValue('token')

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Network error')
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
    })
  })

  it('should provide all auth methods to children', () => {
    const TestMethodsComponent = () => {
      const auth = useAuth()
      return (
        <div>
          <div data-testid="has-authenticate">{typeof auth.authenticate === 'function' ? 'true' : 'false'}</div>
          <div data-testid="has-logout">{typeof auth.logout === 'function' ? 'true' : 'false'}</div>
          <div data-testid="has-refresh">{typeof auth.refreshToken === 'function' ? 'true' : 'false'}</div>
        </div>
      )
    }

    render(
      <AuthProvider>
        <TestMethodsComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('has-authenticate')).toHaveTextContent('true')
    expect(screen.getByTestId('has-logout')).toHaveTextContent('true')
    expect(screen.getByTestId('has-refresh')).toHaveTextContent('true')
  })

  it('should throw error when used outside provider', () => {
    // Mock console.error to suppress error output in test
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      render(<TestComponent />)
    }).toThrow()

    consoleError.mockRestore()
  })

  it('should handle token refresh automatically', async () => {
    const mockUser = {
      id: 'user1',
      publicKey: 'test-key',
      username: 'testuser',
      createdAt: Date.now(),
    }

    // Mock initial token validation
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ user: mockUser }),
    } as Response)

    // Mock token refresh
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ token: 'new-token' }),
    } as Response)

    mockLocalStorage.getItem.mockReturnValue('old-token')

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true')
    })
  })
})