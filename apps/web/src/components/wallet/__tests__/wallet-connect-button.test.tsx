import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WalletConnectButton } from '../wallet-connect-button'

// Mock the wallet hook
const mockConnect = vi.fn()
const mockDisconnect = vi.fn()
const mockWallet = {
  connected: false,
  connecting: false,
  publicKey: null,
  connect: mockConnect,
  disconnect: mockDisconnect,
  wallet: null,
}

vi.mock('../../../hooks/useWallet', () => ({
  useWallet: () => mockWallet,
}))

describe('WalletConnectButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render connect button when wallet is not connected', () => {
    render(<WalletConnectButton />)
    
    expect(screen.getByRole('button')).toHaveTextContent(/connect wallet/i)
  })

  it('should render connecting state when wallet is connecting', () => {
    mockWallet.connecting = true
    
    render(<WalletConnectButton />)
    
    expect(screen.getByRole('button')).toHaveTextContent(/connecting/i)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('should render connected state when wallet is connected', () => {
    mockWallet.connected = true
    mockWallet.publicKey = {
      toString: () => 'HN7cABqLq46Es1jh92dQQi5DKyXJxfogVQKMrNDK9HbB'
    } as any
    
    render(<WalletConnectButton />)
    
    expect(screen.getByRole('button')).toHaveTextContent(/HN7c...HbB/i)
  })

  it('should call connect when clicked in disconnected state', async () => {
    const user = userEvent.setup()
    mockConnect.mockResolvedValue(undefined)
    
    render(<WalletConnectButton />)
    
    const button = screen.getByRole('button')
    await user.click(button)
    
    expect(mockConnect).toHaveBeenCalledTimes(1)
  })

  it('should call disconnect when clicked in connected state', async () => {
    const user = userEvent.setup()
    mockWallet.connected = true
    mockDisconnect.mockResolvedValue(undefined)
    
    render(<WalletConnectButton />)
    
    const button = screen.getByRole('button')
    await user.click(button)
    
    expect(mockDisconnect).toHaveBeenCalledTimes(1)
  })

  it('should handle connection errors gracefully', async () => {
    const user = userEvent.setup()
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockConnect.mockRejectedValue(new Error('Connection failed'))
    
    render(<WalletConnectButton />)
    
    const button = screen.getByRole('button')
    await user.click(button)
    
    expect(mockConnect).toHaveBeenCalledTimes(1)
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining('Failed to connect wallet'),
      expect.any(Error)
    )
    
    consoleError.mockRestore()
  })

  it('should display wallet name when available', () => {
    mockWallet.connected = true
    mockWallet.wallet = { adapter: { name: 'Phantom' } } as any
    mockWallet.publicKey = {
      toString: () => 'HN7cABqLq46Es1jh92dQQi5DKyXJxfogVQKMrNDK9HbB'
    } as any
    
    render(<WalletConnectButton />)
    
    expect(screen.getByText(/phantom/i)).toBeInTheDocument()
  })

  it('should be accessible with proper ARIA labels', () => {
    render(<WalletConnectButton />)
    
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-label', expect.stringMatching(/wallet/i))
  })

  it('should handle disabled state correctly', () => {
    mockWallet.connecting = true
    
    render(<WalletConnectButton />)
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-disabled', 'true')
  })
})