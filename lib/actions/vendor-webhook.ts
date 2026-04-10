import crypto from 'crypto'
import {
  VendorWebhookSubscriptionModel,
  VendorWebhookTestModel,
  VendorWebhookDeliveryModel,
  VendorWebhookSubscription,
} from '@/lib/models/vendor-webhook'
import { dispatchWebhook, generateWebhookSignature } from '@/lib/webhooks/dispatcher'
import { recordWebhookDelivery } from '@/lib/actions/webhook-analytics'

/**
 * Create a new webhook subscription for a vendor
 */
export async function createVendorWebhook(
  vendorId: string,
  data: {
    url: string
    events: string[]
    description?: string
    retryAttempts?: number
    timeoutSeconds?: number
    headers?: Record<string, string>
  }
): Promise<VendorWebhookSubscription> {
  try {
    // Validate URL
    try {
      new URL(data.url)
    } catch {
      throw new Error('Invalid webhook URL')
    }

    // Validate events
    if (!data.events || data.events.length === 0) {
      throw new Error('At least one event type must be selected')
    }

    // Generate secure secret
    const secret = crypto.randomBytes(32).toString('hex')

    const subscription = new VendorWebhookSubscriptionModel({
      vendorId,
      url: data.url,
      events: data.events,
      secret,
      description: data.description,
      retryAttempts: data.retryAttempts || 5,
      timeoutSeconds: data.timeoutSeconds || 10,
      headers: data.headers,
    })

    await subscription.save()
    console.log(`[VENDOR WEBHOOK] Created webhook for vendor ${vendorId}`)

    return subscription
  } catch (error) {
    console.error('[VENDOR WEBHOOK] Creation failed:', error)
    throw error
  }
}

/**
 * Get all webhook subscriptions for a vendor
 */
export async function getVendorWebhooks(
  vendorId: string,
  options?: { activeOnly?: boolean; includeStats?: boolean }
): Promise<any[]> {
  try {
    let query = VendorWebhookSubscriptionModel.find({ vendorId })

    if (options?.activeOnly) {
      query = query.where('isActive').equals(true)
    }

    const subscriptions = await query.sort({ createdAt: -1 }).lean()

    if (options?.includeStats) {
      return Promise.all(
        subscriptions.map(async (sub: any) => {
          const deliveryCount = await VendorWebhookDeliveryModel.countDocuments({
            subscriptionId: sub._id.toString(),
          })
          const successCount = await VendorWebhookDeliveryModel.countDocuments({
            subscriptionId: sub._id.toString(),
            status: 'success',
          })

          return {
            ...sub,
            deliveryCount,
            successRate: deliveryCount > 0 ? (successCount / deliveryCount) * 100 : 0,
          }
        })
      )
    }

    return subscriptions as any
  } catch (error) {
    console.error('[VENDOR WEBHOOK] Failed to fetch webhooks:', error)
    throw error
  }
}

/**
 * Get a specific webhook subscription
 */
export async function getVendorWebhook(
  vendorId: string,
  webhookId: string
): Promise<any> {
  try {
    return await VendorWebhookSubscriptionModel.findOne({
      _id: webhookId,
      vendorId,
    }).lean()
  } catch (error) {
    console.error('[VENDOR WEBHOOK] Failed to fetch webhook:', error)
    throw error
  }
}

/**
 * Update a webhook subscription
 */
export async function updateVendorWebhook(
  vendorId: string,
  webhookId: string,
  data: Partial<VendorWebhookSubscription>
): Promise<VendorWebhookSubscription> {
  try {
    const webhook = await VendorWebhookSubscriptionModel.findOne({
      _id: webhookId,
      vendorId,
    })

    if (!webhook) {
      throw new Error('Webhook subscription not found')
    }

    // Validate URL if updating
    if (data.url) {
      try {
        new URL(data.url)
        webhook.url = data.url
      } catch {
        throw new Error('Invalid webhook URL')
      }
    }

    // Update allowed fields
    if (data.events) webhook.events = data.events
    if (data.description !== undefined) webhook.description = data.description
    if (data.retryAttempts !== undefined) webhook.retryAttempts = data.retryAttempts
    if (data.timeoutSeconds !== undefined) webhook.timeoutSeconds = data.timeoutSeconds
    if (data.headers !== undefined) webhook.headers = data.headers
    if (data.isActive !== undefined) webhook.isActive = data.isActive

    await webhook.save()
    console.log(`[VENDOR WEBHOOK] Updated webhook ${webhookId}`)

    return webhook
  } catch (error) {
    console.error('[VENDOR WEBHOOK] Update failed:', error)
    throw error
  }
}

/**
 * Delete a webhook subscription
 */
export async function deleteVendorWebhook(
  vendorId: string,
  webhookId: string
): Promise<void> {
  try {
    const result = await VendorWebhookSubscriptionModel.deleteOne({
      _id: webhookId,
      vendorId,
    })

    if (result.deletedCount === 0) {
      throw new Error('Webhook subscription not found')
    }

    // Also clean up related delivery logs
    await VendorWebhookDeliveryModel.deleteMany({ subscriptionId: webhookId })

    console.log(`[VENDOR WEBHOOK] Deleted webhook ${webhookId}`)
  } catch (error) {
    console.error('[VENDOR WEBHOOK] Deletion failed:', error)
    throw error
  }
}

/**
 * Test webhook delivery
 */
export async function testVendorWebhook(
  vendorId: string,
  webhookId: string,
  eventType?: string
): Promise<any> {
  try {
    const webhook = await VendorWebhookSubscriptionModel.findOne({
      _id: webhookId,
      vendorId,
    })

    if (!webhook) {
      throw new Error('Webhook subscription not found')
    }

    const event = eventType || webhook.events[0]
    if (!event) {
      throw new Error('No event type specified or configured')
    }

    // Create test payload
    const payload = {
      id: crypto.randomUUID(),
      event: `${event}.test`,
      timestamp: new Date(),
      version: '1.0.0',
      data: {
        message: 'This is a test webhook delivery',
        test: true,
      },
    }

    const payloadString = JSON.stringify(payload)
    const signature = generateWebhookSignature(payloadString, webhook.secret)

    const startTime = Date.now()

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), webhook.timeoutSeconds * 1000)

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Amazona-VendorWebhook/1.0',
          'X-Webhook-Signature': signature,
          'X-Webhook-ID': payload.id,
          'X-Webhook-Event': payload.event,
          ...webhook.headers,
        },
        body: payloadString,
        signal: controller.signal,
      })

      clearTimeout(timeout)
      const duration = Date.now() - startTime

      const responseText = await response.text()

      const test = new VendorWebhookTestModel({
        vendorId,
        subscriptionId: webhookId,
        eventType: event,
        status: response.ok ? 'success' : 'failed',
        responseStatus: response.status,
        responseBody: responseText.substring(0, 5000),
        duration,
      })

      if (response.ok) {
        await webhook.recordSuccess()
      } else {
        await webhook.recordFailure()
      }

      await test.save()

      console.log(`[VENDOR WEBHOOK] Test delivery status: ${response.status} (${duration}ms)`)

      return {
        success: response.ok,
        status: response.status,
        duration,
        testId: test._id,
      }
    } catch (fetchError) {
      const duration = Date.now() - startTime
      const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown error'

      const test = new VendorWebhookTestModel({
        vendorId,
        subscriptionId: webhookId,
        eventType: event,
        status: 'failed',
        responseBody: errorMessage,
        duration,
      })

      await test.save()
      await webhook.recordFailure()

      throw new Error(`Webhook test failed: ${errorMessage}`)
    }
  } catch (error) {
    console.error('[VENDOR WEBHOOK] Test failed:', error)
    throw error
  }
}

/**
 * Get webhook delivery history
 */
export async function getVendorWebhookDeliveries(
  vendorId: string,
  webhookId: string,
  options?: {
    status?: string
    startDate?: Date
    endDate?: Date
    page?: number
    limit?: number
  }
): Promise<{
  deliveries: any[]
  total: number
  page: number
  limit: number
}> {
  try {
    const { status, startDate, endDate, page = 1, limit = 20 } = options || {}

    let query: any = VendorWebhookDeliveryModel.find({
      vendorId,
      subscriptionId: webhookId,
    })

    if (status) {
      query = query.where('status').equals(status)
    }

    if (startDate || endDate) {
      const dateFilter: any = {}
      if (startDate) dateFilter.$gte = startDate
      if (endDate) dateFilter.$lte = endDate
      query.where('createdAt').within(dateFilter)
    }

    const total = await VendorWebhookDeliveryModel.countDocuments(query.getFilter())
    const deliveries = await query
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()

    return { deliveries: deliveries as any, total, page, limit }
  } catch (error) {
    console.error('[VENDOR WEBHOOK] Failed to fetch deliveries:', error)
    throw error
  }
}

/**
 * Dispatch event to vendor webhooks
 */
export async function dispatchToVendorWebhooks(
  vendorId: string,
  eventType: string,
  eventData: Record<string, any>
): Promise<void> {
  try {
    const subscriptions = await VendorWebhookSubscriptionModel.find({
      vendorId,
      isActive: true,
      events: eventType,
    })

    if (subscriptions.length === 0) {
      console.log(`[VENDOR WEBHOOK] No active subscriptions for vendor ${vendorId} event ${eventType}`)
      return
    }

    for (const subscription of subscriptions) {
      try {
        const payload = {
          id: crypto.randomUUID(),
          event: eventType,
          timestamp: new Date(),
          version: '1.0.0',
          data: eventData,
          vendorId,
        }

        const payloadString = JSON.stringify(payload)
        const signature = generateWebhookSignature(payloadString, subscription.secret)

        const startTime = Date.now()

        try {
          const controller = new AbortController()
          const timeout = setTimeout(
            () => controller.abort(),
            subscription.timeoutSeconds * 1000
          )

          const response = await fetch(subscription.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'Amazona-VendorWebhook/1.0',
              'X-Webhook-Signature': signature,
              'X-Webhook-ID': payload.id,
              'X-Webhook-Event': payload.event,
              ...subscription.headers,
            },
            body: payloadString,
            signal: controller.signal,
          })

          clearTimeout(timeout)
          const latency = Date.now() - startTime

          await recordVendorWebhookDelivery(
            vendorId,
            subscription._id.toString(),
            payload.id,
            eventType,
            response.ok ? 'success' : 'failed',
            response.status,
            latency,
            response.ok ? undefined : `HTTP ${response.status}`
          )

          if (response.ok) {
            await subscription.recordSuccess()
          } else {
            await subscription.recordFailure()
          }
        } catch (error) {
          const latency = Date.now() - startTime
          const errorMsg = error instanceof Error ? error.message : 'Unknown error'

          await recordVendorWebhookDelivery(
            vendorId,
            subscription._id.toString(),
            payload.id,
            eventType,
            'failed',
            0,
            latency,
            errorMsg
          )

          await subscription.recordFailure()
        }
      } catch (subError) {
        console.error('[VENDOR WEBHOOK] Error processing subscription:', subError)
      }
    }
  } catch (error) {
    console.error('[VENDOR WEBHOOK] Dispatch failed:', error)
  }
}

/**
 * Record webhook delivery for vendor
 */
async function recordVendorWebhookDelivery(
  vendorId: string,
  subscriptionId: string,
  eventId: string,
  eventType: string,
  status: 'success' | 'failed' | 'pending' | 'retry',
  statusCode: number,
  latency: number,
  errorMessage?: string
): Promise<void> {
  try {
    const delivery = new VendorWebhookDeliveryModel({
      vendorId,
      subscriptionId,
      eventId,
      eventType,
      status,
      statusCode,
      latency,
      errorMessage,
    })

    await delivery.save()
  } catch (error) {
    console.error('[VENDOR WEBHOOK] Failed to record delivery:', error)
  }
}

/**
 * Get webhook health status
 */
export async function getVendorWebhookHealth(
  vendorId: string,
  webhookId: string
): Promise<{
  isHealthy: boolean
  successRate: number
  failureCount: number
  lastSuccessAt?: Date
  lastFailureAt?: Date
  recentDeliveries: number
}> {
  try {
    const webhook = await VendorWebhookSubscriptionModel.findOne({
      _id: webhookId,
      vendorId,
    })

    if (!webhook) {
      throw new Error('Webhook subscription not found')
    }

    const totalDeliveries = await VendorWebhookDeliveryModel.countDocuments({
      subscriptionId: webhookId,
    })

    const successfulDeliveries = await VendorWebhookDeliveryModel.countDocuments({
      subscriptionId: webhookId,
      status: 'success',
    })

    const recentDeliveries = await VendorWebhookDeliveryModel.countDocuments({
      subscriptionId: webhookId,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    })

    return {
      isHealthy: webhook.isHealthy(),
      successRate: totalDeliveries > 0 ? (successfulDeliveries / totalDeliveries) * 100 : 0,
      failureCount: webhook.failureCount,
      lastSuccessAt: webhook.lastSuccessAt,
      lastFailureAt: webhook.lastFailureAt,
      recentDeliveries,
    }
  } catch (error) {
    console.error('[VENDOR WEBHOOK] Health check failed:', error)
    throw error
  }
}
