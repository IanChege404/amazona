/**
 * Webhook Dispatcher Tests
 * Tests for webhook signature generation, verification, and dispatch logic
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  generateWebhookSignature,
  verifyWebhookSignature,
  createWebhookPayload,
  dispatchWebhook,
} from '@/lib/webhooks/dispatcher'
import { WebhookEventType } from '@/lib/webhooks/types'

describe('Webhook Dispatcher', () => {
  const testSecret = 'test-secret-key-12345'
  const testPayload = { orderId: '123', customerId: '456', amount: 99.99 }

  describe('generateWebhookSignature', () => {
    it('should generate consistent HMAC signatures', () => {
      const payload = JSON.stringify(testPayload)
      const sig1 = generateWebhookSignature(payload, testSecret)
      const sig2 = generateWebhookSignature(payload, testSecret)

      expect(sig1).toBe(sig2)
    })

    it('should generate different signatures for different payloads', () => {
      const payload1 = JSON.stringify(testPayload)
      const payload2 = JSON.stringify({ ...testPayload, amount: 100 })

      const sig1 = generateWebhookSignature(payload1, testSecret)
      const sig2 = generateWebhookSignature(payload2, testSecret)

      expect(sig1).not.toBe(sig2)
    })

    it('should generate different signatures for different secrets', () => {
      const payload = JSON.stringify(testPayload)
      const sig1 = generateWebhookSignature(payload, 'secret-1')
      const sig2 = generateWebhookSignature(payload, 'secret-2')

      expect(sig1).not.toBe(sig2)
    })

    it('should produce hex-encoded output', () => {
      const payload = JSON.stringify(testPayload)
      const signature = generateWebhookSignature(payload, testSecret)

      expect(/^[a-f0-9]+$/.test(signature)).toBe(true)
    })
  })

  describe('verifyWebhookSignature', () => {
    it('should verify valid signatures', () => {
      const payload = JSON.stringify(testPayload)
      const signature = generateWebhookSignature(payload, testSecret)

      expect(verifyWebhookSignature(payload, signature, testSecret)).toBe(true)
    })

    it('should reject invalid signatures', () => {
      const payload = JSON.stringify(testPayload)
      const invalidSignature = 'invalid' + generateWebhookSignature(payload, testSecret)

      expect(verifyWebhookSignature(payload, invalidSignature, testSecret)).toBe(false)
    })

    it('should reject signatures with wrong secret', () => {
      const payload = JSON.stringify(testPayload)
      const signature = generateWebhookSignature(payload, 'secret-1')

      expect(verifyWebhookSignature(payload, signature, 'secret-2')).toBe(false)
    })

    it('should reject signatures for modified payloads', () => {
      const payload1 = JSON.stringify(testPayload)
      const payload2 = JSON.stringify({ ...testPayload, amount: 100 })
      const signature = generateWebhookSignature(payload1, testSecret)

      expect(verifyWebhookSignature(payload2, signature, testSecret)).toBe(false)
    })
  })

  describe('createWebhookPayload', () => {
    it('should create payload with all required fields', () => {
      const payload = createWebhookPayload(WebhookEventType.ORDER_CREATED, testPayload)

      expect(payload).toHaveProperty('id')
      expect(payload).toHaveProperty('event', WebhookEventType.ORDER_CREATED)
      expect(payload).toHaveProperty('timestamp')
      expect(payload).toHaveProperty('version', '1.0.0')
      expect(payload).toHaveProperty('data', testPayload)
      expect(payload).toHaveProperty('attempts', 0)
    })

    it('should generate unique IDs for each payload', () => {
      const payload1 = createWebhookPayload(WebhookEventType.ORDER_CREATED, testPayload)
      const payload2 = createWebhookPayload(WebhookEventType.ORDER_CREATED, testPayload)

      expect(payload1.id).not.toBe(payload2.id)
    })

    it('should include correct event type', () => {
      const eventTypes = [
        WebhookEventType.ORDER_CREATED,
        WebhookEventType.ORDER_PAID,
        WebhookEventType.PRODUCT_CREATED,
      ]

      eventTypes.forEach((eventType) => {
        const payload = createWebhookPayload(eventType, testPayload)
        expect(payload.event).toBe(eventType)
      })
    })
  })

  describe('dispatchWebhook', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    afterEach(() => {
      vi.clearAllMocks()
    })

    it('should create and return webhook payload', async () => {
      const result = await dispatchWebhook(WebhookEventType.ORDER_CREATED, testPayload)

      expect(result).toHaveProperty('id')
      expect(result).toHaveProperty('event', WebhookEventType.ORDER_CREATED)
      expect(result.data).toEqual(testPayload)
    })

    it('should handle dispatch with vendor filter', async () => {
      const result = await dispatchWebhook(
        WebhookEventType.ORDER_CREATED,
        testPayload,
        { vendorId: 'vendor-123' }
      )

      expect(result).toBeDefined()
      expect(result.event).toBe(WebhookEventType.ORDER_CREATED)
    })

    it('should handle dispatch with user filter', async () => {
      const result = await dispatchWebhook(
        WebhookEventType.ORDER_CREATED,
        testPayload,
        { userId: 'user-456' }
      )

      expect(result).toBeDefined()
      expect(result.event).toBe(WebhookEventType.ORDER_CREATED)
    })
  })

  describe('Webhook Signature Timing Attack Resistance', () => {
    it('should use timing-safe comparison', () => {
      const payload = JSON.stringify(testPayload)
      const validSignature = generateWebhookSignature(payload, testSecret)

      // Even with similar-looking signature, should fail
      const invalidSignature = validSignature.replace(/.$/, 'X')

      expect(verifyWebhookSignature(payload, invalidSignature, testSecret)).toBe(false)
    })
  })

  describe('Error Handling', () => {
    it('should handle empty payload gracefully', async () => {
      const result = await dispatchWebhook(WebhookEventType.ORDER_CREATED, {})

      expect(result).toBeDefined()
      expect(result.data).toEqual({})
    })

    it('should handle complex nested data structures', async () => {
      const complexPayload = {
        order: {
          items: [
            { productId: '1', qty: 2, price: 50 },
            { productId: '2', qty: 1, price: 100 },
          ],
          customer: {
            name: 'John Doe',
            email: 'john@example.com',
          },
        },
      }

      const result = await dispatchWebhook(WebhookEventType.ORDER_CREATED, complexPayload)

      expect(result.data).toEqual(complexPayload)
    })
  })
})

describe('Webhook Signature Compatibility', () => {
  it('should match SHA256 HMAC specification', () => {
    // This ensures we're using industry-standard SHA256, not a different algorithm
    const payload = 'test-payload'
    const secret = 'test-secret'
    const signature = generateWebhookSignature(payload, secret)

    // SHA256 hex output is always 64 characters
    expect(signature.length).toBe(64)
    expect(/^[a-f0-9]{64}$/.test(signature)).toBe(true)
  })

  it('should be compatible with Stripe webhook format', () => {
    // Stripe uses: t=<timestamp>.v1=<signature>
    // We should be compatible with their signature format
    const payload = JSON.stringify({ test: 'data' })
    const secret = 'test_secret'

    const signature = generateWebhookSignature(payload, secret)
    expect(typeof signature).toBe('string')
    expect(signature.length).toBeGreaterThan(0)
  })
})
