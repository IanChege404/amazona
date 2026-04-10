import crypto from 'crypto'
import { WebhookReplayModel, WebhookReplayBatchModel, WebhookReplay } from '@/lib/models/webhook-replay'
import { WebhookEventLogModel } from '@/lib/models/webhook-analytics'
import { VendorWebhookDeliveryModel } from '@/lib/models/vendor-webhook'
import { generateWebhookSignature } from '@/lib/webhooks/dispatcher'

/**
 * Create a replay for a failed webhook event
 */
export async function createWebhookReplay(
  originalEventId: string,
  eventType: string,
  payload: Record<string, any>,
  reason: string,
  initiatedBy: string,
  options?: {
    subscriptionId?: string
    vendorId?: string
    url?: string
    secret?: string
    maxAttempts?: number
  }
): Promise<WebhookReplay> {
  try {
    const replay = new WebhookReplayModel({
      originalEventId,
      eventType,
      payload,
      reason,
      initiatedBy,
      subscriptionId: options?.subscriptionId,
      vendorId: options?.vendorId,
      url: options?.url,
      secret: options?.secret,
      maxAttempts: options?.maxAttempts || 3,
    })

    await replay.save()
    console.log(`[WEBHOOK REPLAY] Created replay for event ${originalEventId}`)

    return replay
  } catch (error) {
    console.error('[WEBHOOK REPLAY] Failed to create replay:', error)
    throw error
  }
}

/**
 * Execute a webhook replay
 */
export async function executeWebhookReplay(replayId: string): Promise<{
  success: boolean
  status: string
  duration: number
  statusCode?: number
  error?: string
}> {
  try {
    const replay = await WebhookReplayModel.findById(replayId)

    if (!replay) {
      throw new Error('Replay not found')
    }

    if (replay.status === 'cancelled') {
      throw new Error('Cannot execute cancelled replay')
    }

    if (replay.totalAttempts >= replay.maxAttempts) {
      replay.status = 'failed'
      await replay.save()
      throw new Error('Maximum retry attempts exceeded')
    }

    replay.status = 'in_progress'
    replay.totalAttempts += 1

    const payloadString = JSON.stringify(replay.payload)
    const signature = replay.secret
      ? generateWebhookSignature(payloadString, replay.secret)
      : undefined

    const startTime = Date.now()

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000)

      const response = await fetch(replay.url || 'http://localhost:3001/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Amazona-WebhookReplay/1.0',
          ...(signature && { 'X-Webhook-Signature': signature }),
          'X-Webhook-ID': replay.originalEventId,
          'X-Webhook-Event': replay.eventType,
          'X-Webhook-Delivery': new Date().toISOString(),
          'X-Webhook-Retry': 'replay',
        },
        body: payloadString,
        signal: controller.signal,
      })

      clearTimeout(timeout)
      const duration = Date.now() - startTime
      const responseText = await response.text()

      const attempt = {
        status: response.ok ? ('success' as const) : ('failed' as const),
        statusCode: response.status,
        latency: duration,
        errorMessage: response.ok ? undefined : `HTTP ${response.status}`,
        responseBody: responseText.substring(0, 5000),
      }

      replay.attempts.push(attempt as any)

      if (response.ok) {
        replay.status = 'completed'
        replay.successCount += 1
      } else {
        replay.failureCount += 1
        if (replay.totalAttempts < replay.maxAttempts) {
          replay.status = 'pending'
          replay.nextRetryAt = new Date(Date.now() + (replay.totalAttempts * 60000))
        } else {
          replay.status = 'failed'
        }
      }

      if (replay.status === 'completed' || replay.status === 'failed') {
        replay.completedAt = new Date()
      }

      await replay.save()

      console.log(`[WEBHOOK REPLAY] Replay execution: ${attempt.status} (${duration}ms)`)

      return {
        success: response.ok,
        status: response.status.toString(),
        duration,
        statusCode: response.status,
      }
    } catch (error) {
      const duration = Date.now() - startTime
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'

      const attempt = {
        status: 'failed' as const,
        latency: duration,
        errorMessage: errorMsg,
      }

      replay.attempts.push(attempt as any)
      replay.failureCount += 1

      if (replay.totalAttempts < replay.maxAttempts) {
        replay.status = 'pending'
        replay.nextRetryAt = new Date(Date.now() + (replay.totalAttempts * 60000))
      } else {
        replay.status = 'failed'
        replay.completedAt = new Date()
      }

      await replay.save()

      throw new Error(`Replay execution failed: ${errorMsg}`)
    }
  } catch (error) {
    console.error('[WEBHOOK REPLAY] Execution error:', error)
    throw error
  }
}

/**
 * Get replay history
 */
export async function getWebhookReplays(
  filters?: {
    vendorId?: string
    subscriptionId?: string
    status?: string
    eventType?: string
    page?: number
    limit?: number
  }
): Promise<{
  replays: any[]
  total: number
  page: number
  limit: number
}> {
  try {
    const { vendorId, subscriptionId, status, eventType, page = 1, limit = 20 } = filters || {}

    let query: any = WebhookReplayModel.find()

    if (vendorId) query = query.where('vendorId').equals(vendorId)
    if (subscriptionId) query = query.where('subscriptionId').equals(subscriptionId)
    if (status) query = query.where('status').equals(status)
    if (eventType) query = query.where('eventType').equals(eventType)

    const total = await WebhookReplayModel.countDocuments(query.getFilter())
    const replays = await query
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()

    return { replays: replays as any, total, page, limit }
  } catch (error) {
    console.error('[WEBHOOK REPLAY] Failed to fetch replays:', error)
    throw error
  }
}

/**
 * Get a specific replay
 */
export async function getWebhookReplay(replayId: string): Promise<any> {
  try {
    return await WebhookReplayModel.findById(replayId).lean()
  } catch (error) {
    console.error('[WEBHOOK REPLAY] Failed to fetch replay:', error)
    throw error
  }
}

/**
 * Cancel a replay
 */
export async function cancelWebhookReplay(replayId: string): Promise<void> {
  try {
    const replay = await WebhookReplayModel.findById(replayId)

    if (!replay) {
      throw new Error('Replay not found')
    }

    if (['completed', 'failed', 'cancelled'].includes(replay.status)) {
      throw new Error(`Cannot cancel ${replay.status} replay`)
    }

    replay.status = 'cancelled'
    await replay.save()

    console.log(`[WEBHOOK REPLAY] Cancelled replay ${replayId}`)
  } catch (error) {
    console.error('[WEBHOOK REPLAY] Cancellation failed:', error)
    throw error
  }
}

/**
 * Create batch replay for multiple failed events
 */
export async function createBatchReplay(
  eventIds: string[],
  eventType: string,
  reason: string,
  initiatedBy: string,
  options?: {
    subscriptionId?: string
    vendorId?: string
  }
): Promise<any> {
  try {
    // Fetch events from delivery logs or vendor logs
    let events: any[] = []

    if (options?.vendorId) {
      events = await VendorWebhookDeliveryModel.find({
        eventId: { $in: eventIds },
        status: 'failed',
      }).lean()
    } else {
      events = await WebhookEventLogModel.find({
        eventId: { $in: eventIds },
        status: 'failed',
      }).lean()
    }

    if (events.length === 0) {
      throw new Error('No failed events found')
    }

    // Create batch record
    const batch = new WebhookReplayBatchModel({
      eventIds,
      eventType,
      subscriptionId: options?.subscriptionId,
      vendorId: options?.vendorId,
      reason,
      initiatedBy,
      totalReplays: events.length,
    })

    await batch.save()

    // Create individual replays for each event (async, non-blocking)
    for (const event of events) {
      createWebhookReplay(
        event.eventId || event._id,
        eventType,
        event.payload || event.data || {},
        `Batch replay: ${reason}`,
        initiatedBy,
        {
          subscriptionId: options?.subscriptionId,
          vendorId: options?.vendorId,
        }
      ).catch((err) => console.error('[BATCH REPLAY] Individual replay creation failed:', err))
    }

    console.log(`[WEBHOOK REPLAY] Created batch replay for ${events.length} events`)

    return batch
  } catch (error) {
    console.error('[WEBHOOK REPLAY] Batch creation failed:', error)
    throw error
  }
}

/**
 * Get batch replay history
 */
export async function getBatchReplays(
  filters?: {
    vendorId?: string
    status?: string
    page?: number
    limit?: number
  }
): Promise<{
  batches: any[]
  total: number
  page: number
  limit: number
}> {
  try {
    const { vendorId, status, page = 1, limit = 20 } = filters || {}

    let query: any = WebhookReplayBatchModel.find()

    if (vendorId) query = query.where('vendorId').equals(vendorId)
    if (status) query = query.where('status').equals(status)

    const total = await WebhookReplayBatchModel.countDocuments(query.getFilter())
    const batches = await query
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()

    return { batches: batches as any, total, page, limit }
  } catch (error) {
    console.error('[WEBHOOK REPLAY] Failed to fetch batches:', error)
    throw error
  }
}

/**
 * Update batch replay progress
 */
export async function updateBatchReplayProgress(
  batchId: string,
  successCount: number,
  failureCount: number
): Promise<void> {
  try {
    const batch = await WebhookReplayBatchModel.findById(batchId)

    if (!batch) {
      throw new Error('Batch not found')
    }

    batch.successCount = successCount
    batch.failureCount = failureCount
    batch.completedReplays = successCount + failureCount

    if (batch.completedReplays >= batch.totalReplays) {
      batch.status = failureCount > 0 ? 'failed' : 'completed'
    } else {
      batch.status = 'in_progress'
    }

    await batch.save()
  } catch (error) {
    console.error('[WEBHOOK REPLAY] Failed to update batch progress:', error)
  }
}

/**
 * Get replay statistics
 */
export async function getReplayStats(
  filters?: {
    vendorId?: string
    days?: number
  }
): Promise<{
  totalReplays: number
  successfulReplays: number
  failedReplays: number
  pendingReplays: number
  successRate: number
  averageAttempts: number
}> {
  try {
    const { vendorId, days = 30 } = filters || {}
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    let query: any = WebhookReplayModel.find({
      createdAt: { $gte: startDate },
    })

    if (vendorId) {
      query = query.where('vendorId').equals(vendorId)
    }

    const replays = await query.lean()

    const totalReplays = replays.length
    const successfulReplays = replays.filter((r: any) => r.status === 'completed').length
    const failedReplays = replays.filter((r: any) => r.status === 'failed').length
    const pendingReplays = replays.filter((r: any) => r.status === 'pending').length

    const totalAttempts = replays.reduce((sum: number, r: any) => sum + r.totalAttempts, 0)
    const averageAttempts = totalReplays > 0 ? totalAttempts / totalReplays : 0

    return {
      totalReplays,
      successfulReplays,
      failedReplays,
      pendingReplays,
      successRate: totalReplays > 0 ? (successfulReplays / totalReplays) * 100 : 0,
      averageAttempts,
    }
  } catch (error) {
    console.error('[WEBHOOK REPLAY] Failed to get stats:', error)
    throw error
  }
}

/**
 * Auto-retry pending replays (call periodically via cron)
 */
export async function processPerndingReplays(): Promise<number> {
  try {
    const now = new Date()
    const pendingReplays = await WebhookReplayModel.find({
      status: 'pending',
      nextRetryAt: { $lte: now },
    })

    let retryCount = 0

    for (const replay of pendingReplays) {
      try {
        await executeWebhookReplay(replay._id.toString())
        retryCount++
      } catch (error) {
        console.error(`[WEBHOOK REPLAY] Failed to retry ${replay._id}:`, error)
      }
    }

    console.log(`[WEBHOOK REPLAY] Processed ${retryCount} pending replays`)

    return retryCount
  } catch (error) {
    console.error('[WEBHOOK REPLAY] Failed to process pending replays:', error)
    return 0
  }
}
