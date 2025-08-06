import { describe, it, expect, vi } from 'vitest'
import { PublicKey } from '@solana/web3.js'
import { formatSolanaAddress, lamportsToSol, solToLamports, validateSolanaAddress } from '../solana'

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

    it('should handle negative numbers', () => {
      expect(lamportsToSol(-1000000000)).toBe(-1)
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

    it('should handle negative numbers', () => {
      expect(solToLamports(-1)).toBe(-1000000000)
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
})