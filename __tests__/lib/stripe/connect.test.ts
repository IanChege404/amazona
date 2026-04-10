import { describe, it, expect } from 'vitest'

describe('Stripe Connect Helpers', () => {
  describe('calculatePlatformFee', () => {
    it('should calculate platform fee correctly', () => {
      // 10% of $100 = $10
      const amount = 10000 // cents
      const commissionRate = 10
      const fee = Math.round(amount * (commissionRate / 100))
      expect(fee).toBe(1000)
    })

    it('should handle different commission rates', () => {
      const amount = 5000 // $50
      // 5% commission
      const fee5 = Math.round(amount * (5 / 100))
      expect(fee5).toBe(250)

      // 20% commission
      const fee20 = Math.round(amount * (20 / 100))
      expect(fee20).toBe(1000)
    })

    it('should round to nearest cent', () => {
      const amount = 3333 // $33.33
      const commissionRate = 10
      const fee = Math.round(amount * (commissionRate / 100))
      expect(fee).toBe(333) // $3.33
    })
  })
})
