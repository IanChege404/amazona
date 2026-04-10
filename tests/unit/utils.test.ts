import { describe, it, expect } from 'vitest'
import { round2 } from '@/lib/utils'
import { calculatePlatformFee } from '@/lib/stripe/connect'

describe('Utility Functions', () => {
  describe('round2()', () => {
    it('rounds to 2 decimal places', () => {
      expect(round2(10.567)).toBe(10.57)
      expect(round2(10.564)).toBe(10.56)
    })

    it('handles whole numbers', () => {
      expect(round2(100)).toBe(100)
    })

    it('handles single decimal place', () => {
      expect(round2(99.5)).toBe(99.5)
    })

    it('handles zero', () => {
      expect(round2(0)).toBe(0)
    })

    it('handles negative numbers', () => {
      expect(round2(-10.567)).toBe(-10.57)
    })

    it('handles very small numbers', () => {
      expect(round2(0.001)).toBe(0)
      expect(round2(0.015)).toBe(0.02)
    })
  })

  describe('calculatePlatformFee()', () => {
    it('calculates correct platform fee from amount in cents', () => {
      // $100 with 10% commission = $10
      const fee = calculatePlatformFee(10000, 10)
      expect(fee).toBe(1000)
    })

    it('handles 0% commission', () => {
      const fee = calculatePlatformFee(10000, 0)
      expect(fee).toBe(0)
    })

    it('handles high commission rate', () => {
      // $50 with 25% commission = $12.50
      const fee = calculatePlatformFee(5000, 25)
      expect(fee).toBe(1250)
    })

    it('rounds to whole cents', () => {
      // $99.99 with 10% = $9.999 → round to 1000 cents
      const fee = calculatePlatformFee(9999, 10)
      expect(fee).toBe(1000) // Rounded
    })

    it('handles small amounts', () => {
      // $1 with 10% = 0.10 cents
      const fee = calculatePlatformFee(100, 10)
      expect(fee).toBe(10)
    })

    it('handles zero amount', () => {
      const fee = calculatePlatformFee(0, 10)
      expect(fee).toBe(0)
    })
  })
})
