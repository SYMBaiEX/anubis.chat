import { describe, it, expect } from 'vitest'
import { success, failure, isSuccess, isFailure, all } from '../result'

describe('Result utilities', () => {
  describe('success', () => {
    it('should create a success result', () => {
      const result = success('test data')
      
      expect(result.success).toBe(true)
      expect(result.data).toBe('test data')
      expect('error' in result).toBe(false)
    })
  })

  describe('failure', () => {
    it('should create a failure result', () => {
      const error = new Error('test error')
      const result = failure(error)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe(error)
      expect('data' in result).toBe(false)
    })
  })

  describe('isSuccess', () => {
    it('should return true for success results', () => {
      const result = success('test')
      expect(isSuccess(result)).toBe(true)
    })

    it('should return false for failure results', () => {
      const result = failure(new Error('test'))
      expect(isSuccess(result)).toBe(false)
    })
  })

  describe('isFailure', () => {
    it('should return true for failure results', () => {
      const result = failure(new Error('test'))
      expect(isFailure(result)).toBe(true)
    })

    it('should return false for success results', () => {
      const result = success('test')
      expect(isFailure(result)).toBe(false)
    })
  })

  describe('all', () => {
    it('should return success when all results are successful', () => {
      const results = [
        success('a'),
        success('b'),
        success('c')
      ]
      
      const combined = all(results)
      
      expect(isSuccess(combined)).toBe(true)
      if (isSuccess(combined)) {
        expect(combined.data).toEqual(['a', 'b', 'c'])
      }
    })

    it('should return failure when any result fails', () => {
      const error = new Error('test error')
      const results = [
        success('a'),
        failure(error),
        success('c')
      ]
      
      const combined = all(results)
      
      expect(isFailure(combined)).toBe(true)
      if (isFailure(combined)) {
        expect(combined.error).toBe(error)
      }
    })

    it('should return the first error when multiple failures occur', () => {
      const error1 = new Error('first error')
      const error2 = new Error('second error')
      const results = [
        failure(error1),
        failure(error2),
        success('c')
      ]
      
      const combined = all(results)
      
      expect(isFailure(combined)).toBe(true)
      if (isFailure(combined)) {
        expect(combined.error).toBe(error1)
      }
    })

    it('should handle empty array', () => {
      const results: any[] = []
      const combined = all(results)
      
      expect(isSuccess(combined)).toBe(true)
      if (isSuccess(combined)) {
        expect(combined.data).toEqual([])
      }
    })
  })
})