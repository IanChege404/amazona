import { describe, it, expect } from 'vitest'
import { round2 } from '@/lib/utils'

describe('Utils', () => {
  describe('round2', () => {
    it('should round to 2 decimal places', () => {
      expect(round2(10.005)).toBe(10.01)
      expect(round2(10.004)).toBe(10)
      expect(round2(1.555)).toBe(1.56)
    })

    it('should handle negative numbers', () => {
      expect(round2(-10.005)).toBe(-10.01)
      expect(round2(-1.555)).toBe(-1.55) // JavaScript floating point behavior
    })

    it('should handle zero', () => {
      expect(round2(0)).toBe(0)
    })

    it('should handle numbers with fewer than 2 decimal places', () => {
      expect(round2(10)).toBe(10)
      expect(round2(10.5)).toBe(10.5)
    })
  })
})
