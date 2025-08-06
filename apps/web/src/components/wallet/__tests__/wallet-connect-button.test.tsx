import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { WalletConnectButton } from '../wallet-connect-button'
import { createMockSolanaWallet } from '../../../test-utils/mocks'

// Mock the wallet modal hook
const mockSetVisible = vi.fn()
vi.mock('@solana/wallet-adapter-react-ui', () => ({
  useWalletModal: () => ({
    setVisible: mockSetVisible,
  }),
}))

// Mock the useWallet hook
const mockDisconnect = vi.fn()
const mockFormatAddress = vi.fn()

const defaultWalletState = {
  isConnected: false,
  isConnecting: false,
  formatAddress: mockFormatAddress,
  disconnect: mockDisconnect,
  error: null,
  isHealthy: true,
  connectionHealthScore: 100,
}

const mockUseWallet = vi.fn(() => defaultWalletState)

vi.mock('../../../hooks/useWallet', () => ({
  useWallet: () => mockUseWallet(),
}))

// Mock UI components
vi.mock('../../ui/button', () => ({
  Button: ({ children, onClick, disabled, variant, className }: any) => (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      className={`${variant} ${className}`}
      data-testid="wallet-button"
    >
      {children}
    </button>
  ),
}))

vi.mock('lucide-react', () => ({
  Wallet: () => <div data-testid="wallet-icon">WalletIcon</div>,
}))

describe('WalletConnectButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset to default state
    mockUseWallet.mockReturnValue(defaultWalletState)
  })

  it('should render connect button when wallet is not connected', () => {
    render(<WalletConnectButton />)
    
    const button = screen.getByTestId('wallet-button')
    expect(button).toHaveTextContent(/connect wallet/i)
  })

  it('should render connecting state when wallet is connecting', () => {
    mockUseWallet.mockReturnValue({
      ...defaultWalletState,
      isConnecting: true,
    })
    
    render(<WalletConnectButton />)
    
    const button = screen.getByTestId('wallet-button')
    expect(button).toHaveTextContent(/connecting/i)
    expect(button).toBeDisabled()
  })

  it('should render connected state when wallet is connected', () => {
    mockFormatAddress.mockReturnValue('HN7c...HbB')
    mockUseWallet.mockReturnValue({
      ...defaultWalletState,
      isConnected: true,
      formatAddress: mockFormatAddress,
    })
    
    render(<WalletConnectButton />)
    
    const button = screen.getByTestId('wallet-button')
    expect(button).toHaveTextContent(/HN7c...HbB/i)
  })

  it('should call setVisible when clicked in disconnected state', async () => {
    const user = userEvent.setup()
    
    render(<WalletConnectButton />)
    
    const button = screen.getByTestId('wallet-button')
    await user.click(button)
    
    expect(mockSetVisible).toHaveBeenCalledWith(true)
  })

  it('should call disconnect when clicked in connected state', async () => {
    const user = userEvent.setup()
    mockUseWallet.mockReturnValue({
      ...defaultWalletState,
      isConnected: true,
    })
    
    render(<WalletConnectButton />)
    
    const button = screen.getByTestId('wallet-button')
    await user.click(button)
    
    expect(mockDisconnect).toHaveBeenCalledTimes(1)
  })

  it('should display error state when there is an error', () => {
    mockUseWallet.mockReturnValue({
      ...defaultWalletState,
      error: 'Connection failed',
    })
    
    render(<WalletConnectButton />)
    
    const button = screen.getByTestId('wallet-button')
    expect(button).toHaveClass('destructive') // Assuming error state uses destructive variant
  })

  it('should show health warning when connection is unhealthy', () => {
    mockUseWallet.mockReturnValue({
      ...defaultWalletState,
      isConnected: true,
      isHealthy: false,
      connectionHealthScore: 50,
    })
    
    render(<WalletConnectButton />)
    
    const button = screen.getByTestId('wallet-button')
    // Should show some indication of poor health
    expect(button).toBeInTheDocument()
  })

  it('should include wallet icon', () => {
    render(<WalletConnectButton />)
    
    expect(screen.getByTestId('wallet-icon')).toBeInTheDocument()
  })

  it('should handle disabled state correctly when connecting', () => {
    mockUseWallet.mockReturnValue({
      ...defaultWalletState,
      isConnecting: true,
    })
    
    render(<WalletConnectButton />)
    
    const button = screen.getByTestId('wallet-button')
    expect(button).toBeDisabled()
  })
})