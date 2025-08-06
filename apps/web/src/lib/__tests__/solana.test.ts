import { describe, it, expect, vi } from 'vitest'
import { PublicKey } from '@solana/web3.js'
import { formatSolanaAddress, lamportsToSol, solToLamports, validateSolanaAddress, createSignInMessage } from '../solana'

describe('solana utilities', () => {
  describe('formatSolanaAddress', () => {
    it('should format valid address with default length', () => {
      const address = 'HN7cABqLq46Es1jh92dQQi5DKyXJxfogVQKMrNDK9HbB'
      const result = formatSolanaAddress(address)
      expect(result).toBe('HN7c...9HbB')
    })

    it('should format address with custom length', () => {
      const address = 'HN7cABqLq46Es1jh92dQQi5DKyXJxfogVQKMrNDK9HbB'
      const result = formatSolanaAddress(address, 6)
      expect(result).toBe('HN7cAB...DK9HbB')
    })

    it('should return original address if shorter than format length', () => {
      const address = 'short'
      const result = formatSolanaAddress(address)
      expect(result).toBe(address)
    })

    it('should handle empty string', () => {
      const result = formatSolanaAddress('')
      expect(result).toBe('')
    })

    it('should handle null/undefined', () => {
      expect(formatSolanaAddress(null as any)).toBe('')
      expect(formatSolanaAddress(undefined as any)).toBe('')
    })

    it('should handle edge cases for address formatting', () => {
      // Very long address
      const longAddress = 'HN7cABqLq46Es1jh92dQQi5DKyXJxfogVQKMrNDK9HbBExtraLongAddressForTesting'
      expect(formatSolanaAddress(longAddress, 8)).toBe('HN7cABqL...rTesting')
      
      // Address with exactly the threshold length
      const exactLengthAddress = 'HN7c...HbB'
      expect(formatSolanaAddress(exactLengthAddress)).toBe(exactLengthAddress)
      
      // Single character
      expect(formatSolanaAddress('X')).toBe('X')
      
      // Empty string
      expect(formatSolanaAddress('')).toBe('')
      
      // Length parameter edge cases
      expect(formatSolanaAddress('HN7cABqLq46Es1jh92dQQi5DKyXJxfogVQKMrNDK9HbB', 0)).toBe('...')
      expect(formatSolanaAddress('HN7cABqLq46Es1jh92dQQi5DKyXJxfogVQKMrNDK9HbB', 20)).toBe('HN7cABqLq46Es1jh92dQ...KyXJxfogVQKMrNDK9HbB')
    })
  })

  describe('lamportsToSol', () => {
    it('should convert lamports to SOL correctly', () => {
      expect(lamportsToSol(1000000000)).toBe(1) // 1 SOL
      expect(lamportsToSol(500000000)).toBe(0.5) // 0.5 SOL
      expect(lamportsToSol(0)).toBe(0)
      expect(lamportsToSol(1)).toBe(0.000000001)
    })

    it('should handle large numbers', () => {
      expect(lamportsToSol(10000000000000)).toBe(10000) // 10,000 SOL
    })

    it('should throw error for negative numbers', () => {
      expect(() => lamportsToSol(-1000000000)).toThrow('Invalid lamports value: must be a non-negative finite number')
    })

    it('should throw error for non-finite numbers', () => {
      expect(() => lamportsToSol(NaN)).toThrow('Invalid lamports value: must be a non-negative finite number')
      expect(() => lamportsToSol(Infinity)).toThrow('Invalid lamports value: must be a non-negative finite number')
      expect(() => lamportsToSol(-Infinity)).toThrow('Invalid lamports value: must be a non-negative finite number')
    })
  })

  describe('solToLamports', () => {
    it('should convert SOL to lamports correctly', () => {
      expect(solToLamports(1)).toBe(1000000000) // 1 SOL
      expect(solToLamports(0.5)).toBe(500000000) // 0.5 SOL
      expect(solToLamports(0)).toBe(0)
      expect(solToLamports(0.000000001)).toBe(1)
    })

    it('should handle large numbers', () => {
      expect(solToLamports(10000)).toBe(10000000000000)
    })

    it('should throw error for negative numbers', () => {
      expect(() => solToLamports(-1)).toThrow('Invalid SOL value: must be a non-negative finite number')
    })

    it('should throw error for non-finite numbers', () => {
      expect(() => solToLamports(NaN)).toThrow('Invalid SOL value: must be a non-negative finite number')
      expect(() => solToLamports(Infinity)).toThrow('Invalid SOL value: must be a non-negative finite number')
      expect(() => solToLamports(-Infinity)).toThrow('Invalid SOL value: must be a non-negative finite number')
    })
  })

  describe('validateSolanaAddress', () => {
    it('should validate correct Solana address', () => {
      const validAddress = 'HN7cABqLq46Es1jh92dQQi5DKyXJxfogVQKMrNDK9HbB'
      expect(validateSolanaAddress(validAddress)).toBe(true)
    })

    it('should reject invalid addresses', () => {
      expect(validateSolanaAddress('invalid')).toBe(false)
      expect(validateSolanaAddress('')).toBe(false)
      expect(validateSolanaAddress('0x1234567890')).toBe(false) // Ethereum style
      expect(validateSolanaAddress('HN7cABqLq46Es1jh92dQQi5DKyXJxfogVQKMrNDK9HbBX')).toBe(false) // Too long
    })

    it('should handle null/undefined', () => {
      expect(validateSolanaAddress(null as any)).toBe(false)
      expect(validateSolanaAddress(undefined as any)).toBe(false)
    })

    it('should validate PublicKey objects', () => {
      const publicKey = new PublicKey('HN7cABqLq46Es1jh92dQQi5DKyXJxfogVQKMrNDK9HbB')
      expect(validateSolanaAddress(publicKey.toString())).toBe(true)
    })

    it('should reject addresses with invalid characters', () => {
      expect(validateSolanaAddress('HN7cABqLq46Es1jh92dQQi5DKyXJxfogVQKMrNDK9Hb@')).toBe(false)
      expect(validateSolanaAddress('HN7cABqLq46Es1jh92dQQi5DKyXJxfogVQKMrNDK9Hb#')).toBe(false)
    })

    it('should handle system program address', () => {
      const systemProgram = '11111111111111111111111111111112'
      expect(validateSolanaAddress(systemProgram)).toBe(true)
    })
  })

  describe('createSignInMessage', () => {
    beforeEach(() => {
      // Mock Date.now for consistent testing
      vi.spyOn(Date.prototype, 'toISOString').mockReturnValue('2024-01-15T12:00:00.000Z')
      
      // Mock window.location for consistent host
      Object.defineProperty(globalThis, 'window', {
        value: {
          location: { host: 'isis.chat' },
          crypto: {
            getRandomValues: vi.fn((array: Uint8Array) => {
              // Mock to return predictable values for testing
              for (let i = 0; i < array.length; i++) {
                array[i] = i + 1 // Predictable sequence: 1, 2, 3, ...
              }
              return array
            })
          }
        },
        configurable: true
      })
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('should create a valid SIWS message with all required fields', () => {
      const publicKey = 'HN7cABqLq46Es1jh92dQQi5DKyXJxfogVQKMrNDK9HbB'
      const message = createSignInMessage(publicKey)

      expect(message).toContain('ISIS Chat wants you to sign in with your Solana account:')
      expect(message).toContain(publicKey)
      expect(message).toContain('Domain: isis.chat')
      expect(message).toContain('Issued At: 2024-01-15T12:00:00.000Z')
      expect(message).toContain('Chain ID: devnet')
      expect(message).toContain('Nonce:')
    })

    it('should generate unique nonces for different calls', () => {
      const publicKey = 'HN7cABqLq46Es1jh92dQQi5DKyXJxfogVQKMrNDK9HbB'
      
      // Reset the mock to return different values each time
      let callCount = 0
      globalThis.window.crypto.getRandomValues = vi.fn((array: Uint8Array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = (i + callCount * 10) % 256
        }
        callCount++
        return array
      })

      const message1 = createSignInMessage(publicKey)
      const message2 = createSignInMessage(publicKey)

      const nonce1 = message1.match(/Nonce: (.+)$/)?.[1]
      const nonce2 = message2.match(/Nonce: (.+)$/)?.[1]

      expect(nonce1).toBeDefined()
      expect(nonce2).toBeDefined()
      expect(nonce1).not.toBe(nonce2)
    })

    it('should throw error for invalid public key', () => {
      expect(() => createSignInMessage('')).toThrow('Invalid public key provided')
      expect(() => createSignInMessage('invalid')).toThrow('Invalid public key provided')
      expect(() => createSignInMessage('123')).toThrow('Invalid public key provided')
    })

    it('should handle server-side environment (no window.crypto)', () => {
      // Remove window.crypto to simulate server-side
      const originalWindow = globalThis.window
      Object.defineProperty(globalThis, 'window', {
        value: {
          location: { host: 'isis.chat' }
        },
        configurable: true
      })

      const publicKey = 'HN7cABqLq46Es1jh92dQQi5DKyXJxfogVQKMrNDK9HbB'
      
      // Should still work but use fallback random generation
      const message = createSignInMessage(publicKey)
      expect(message).toContain('ISIS Chat wants you to sign in with your Solana account:')
      expect(message).toContain('Nonce:')

      // Restore original window
      Object.defineProperty(globalThis, 'window', {
        value: originalWindow,
        configurable: true
      })
    })

    it('should handle different domain contexts', () => {
      // Test different domains
      Object.defineProperty(globalThis.window, 'location', {
        value: { host: 'localhost:3001' },
        configurable: true
      })

      const publicKey = 'HN7cABqLq46Es1jh92dQQi5DKyXJxfogVQKMrNDK9HbB'
      const message = createSignInMessage(publicKey)

      expect(message).toContain('Domain: localhost:3001')
    })

    it('should use devnet as chain ID', () => {
      const publicKey = 'HN7cABqLq46Es1jh92dQQi5DKyXJxfogVQKMrNDK9HbB'
      const message = createSignInMessage(publicKey)

      expect(message).toContain('Chain ID: devnet')
    })
  })
})