/**
 * Webhook Event Dispatcher
 * Handles webhook event triggering and delivery
 */

import crypto from 'crypto'
import { WebhookEventType, WebhookPayload } from './types'
import { recordWebhookDelivery } from '@/lib/actions/webhook-analytics'

const WEBHOOK_VERSION = '1.0.0'
const MAX_RETRIES = 5
const RETRY_INTERVALS = [60, 300, 900, 3600, 86400] // 1min, 5min, 15min, 1hr, 24hr

/**
 * Generate HMAC signature for webhook payload
 */
export function generateWebhookSignature(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex')
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const computed = generateWebhookSignature(payload, secret)
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signature))
}

/**
 * Create webhook payload
 */
export function createWebhookPayload(
  event: WebhookEventType,
  data: Record<string, any>
): WebhookPayload {
  return {
    id: crypto.randomUUID(),
    event,
    timestamp: new Date(),
    version: WEBHOOK_VERSION,
    data,
    attempts: 0,
  }
}

/**
 * Dispatch webhook to subscribers
 */
export async function dispatchWebhook(
  event: WebhookEventType,
  data: Record<string, any>,
  filters?: {
    userId?: string
    vendorId?: string
  }
) {
  try {
    // This would fetch from database
    // For now, return the structure
    const payload = createWebhookPayload(event, data)

    // Queue for delivery
    await queueWebhookDelivery(payload, filters)

    return payload
  } catch (error) {
    console.error('[WEBHOOK] Dispatch failed:', error)
    throw error
  }
}

/**
 * Queue webhook for delivery
 */
export async function queueWebhookDelivery(
  payload: WebhookPayload,
  filters?: {
    userId?: string
    vendorId?: string
  }
) {
  try {
    // In production, use a queue service (Bull, RabbitMQ, etc.)
    console.log(`[WEBHOOK] Queued ${payload.event} for delivery`)

    // Mock delivery
    if (process.env.NODE_ENV === 'development') {
      await deliverWebhook(payload, 'http://localhost:3001/webhooks')
    }
  } catch (error) {
    console.error('[WEBHOOK] Queue failed:', error)
  }
}

/**
 * Deliver webhook to URL
 */
export async function deliverWebhook(
  payload: WebhookPayload,
  url: string,
  secret?: string,
  subscriptionId: string = ''
) {
  const payloadString = JSON.stringify(payload)
  const signature = secret ? generateWebhookSignature(payloadString, secret) : undefined

  const startTime = Date.now()

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Amazona-Webhook/1.0',
        ...(signature && { 'X-Webhook-Signature': signature }),
        'X-Webhook-ID': payload.id,
        'X-Webhook-Event': payload.event,
        'X-Webhook-Delivery': new Date().toISOString(),
      },
      body: payloadString,
      signal: controller.signal,
    })

    clearTimeout(timeout)

    const duration = Date.now() - startTime

    // Record analytics
    await recordWebhookDelivery(
      payload.id,
      payload.event,
      subscriptionId,
      url,
      response.ok ? 'success' : 'failed',
      duration,
      response.status,
      undefined,
      0,
      signature || ''
    ).catch((err) => console.error('[ANALYTICS] Failed to record:', err))

    if (response.ok) {
      console.log(`[WEBHOOK] Delivered ${payload.event} (${duration}ms)`)
      return { success: true, statusCode: response.status, duration }
    } else {
      console.warn(`[WEBHOOK] Delivery failed: ${response.status}`)
      return { success: false, statusCode: response.status, duration }
    }
  } catch (error) {
    const duration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : String(error)

    // Record failed delivery analytics
    await recordWebhookDelivery(
      payload.id,
      payload.event,
      subscriptionId,
      url,
      'failed',
      duration,
      0,
      errorMessage,
      0,
      signature || ''
    ).catch((err) => console.error('[ANALYTICS] Failed to record error:', err))

    console.error('[WEBHOOK] Delivery error:', error)
    return {
      success: false,
      error: errorMessage,
      duration,
    }
  }
}

/**
 * Schedule webhook retry
 */
export function scheduleWebhookRetry(
  payload: WebhookPayload,
  attempt: number
): { delay: number; nextAttempt: Date } | null {
  if (attempt >= MAX_RETRIES) {
    return null
  }

  const delaySeconds = RETRY_INTERVALS[Math.min(attempt, RETRY_INTERVALS.length - 1)]
  const nextAttempt = new Date(Date.now() + delaySeconds * 1000)

  return { delay: delaySeconds, nextAttempt }
}

/**
 * Calculate webhook delivery statistics
 */
export function calculateWebhookStats(logs: any[]): {
  total: number
  succeeded: number
  failed: number
  successRate: number
  averageDeliveryTime: number
} {
  const total = logs.length
  const succeeded = logs.filter((l) => l.success).length
  const failed = total - succeeded

  const totalTime = logs.reduce((sum, log) => sum + (log.duration || 0), 0)
  const averageDeliveryTime = total > 0 ? totalTime / total : 0

  return {
    total,
    succeeded,
    failed,
    successRate: total > 0 ? (succeeded / total) * 100 : 0,
    averageDeliveryTime,
  }
}

/**
 * Format webhook payload for logging
 */
export function formatWebhookLog(payload: WebhookPayload): string {
  return `[${payload.event}] ${payload.id} - ${JSON.stringify(payload.data).substring(0, 100)}`
}
