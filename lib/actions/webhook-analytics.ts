import {
  WebhookMetricModel,
  WebhookEventLogModel,
  WebhookTrendModel,
  WebhookEventLog,
  WebhookMetric,
  WebhookTrend,
} from '@/lib/models/webhook-analytics'

/**
 * Record webhook event delivery attempt
 */
export async function recordWebhookDelivery(
  eventId: string,
  eventType: string,
  subscriptionId: string,
  url: string,
  status: 'success' | 'failed' | 'pending' | 'retry',
  latency: number,
  statusCode?: number,
  errorMessage?: string,
  retryAttempt: number = 0,
  signature: string = ''
): Promise<WebhookEventLog> {
  try {
    const log = new WebhookEventLogModel({
      eventId,
      eventType,
      subscriptionId,
      url,
      status,
      statusCode,
      deliveredAt: status === 'success' ? new Date() : undefined,
      latency,
      errorMessage,
      retryAttempt,
      signature,
      timestamp: new Date(),
    })

    await log.save()

    // Update metrics
    await updateWebhookMetrics(eventType, status === 'success', latency)

    return log
  } catch (error) {
    console.error('[WEBHOOK ANALYTICS] Failed to record delivery:', error)
    throw error
  }
}

/**
 * Update webhook metrics after each delivery
 */
async function updateWebhookMetrics(
  eventType: string,
  isSuccess: boolean,
  latency: number
): Promise<void> {
  try {
    // Get or create metric
    let metric = await WebhookMetricModel.findOne({ eventType })

    if (!metric) {
      metric = new WebhookMetricModel({ eventType })
    }

    // Update counts
    metric.totalDispatched += 1
    if (isSuccess) {
      metric.successfulDeliveries += 1
    } else {
      metric.failedDeliveries += 1
    }

    // Update latency stats
    const allLatencies = await WebhookEventLogModel.find({ eventType }).select(
      'latency'
    )
    const latencies = allLatencies.map((l) => l.latency).sort((a, b) => a - b)

    if (latencies.length > 0) {
      metric.minLatency = latencies[0]
      metric.maxLatency = latencies[latencies.length - 1]
      metric.averageLatency =
        latencies.reduce((a, b) => a + b, 0) / latencies.length
      metric.p95Latency = latencies[Math.floor(latencies.length * 0.95)]
      metric.p99Latency = latencies[Math.floor(latencies.length * 0.99)]
    }

    metric.lastOccurrence = new Date()
    await metric.save()
  } catch (error) {
    console.error('[WEBHOOK ANALYTICS] Failed to update metrics:', error)
  }
}

/**
 * Get webhook metrics for a date range
 */
export async function getWebhookMetrics(
  startDate?: Date,
  endDate?: Date
): Promise<any[]> {
  try {
    const query = WebhookMetricModel.find()

    if (startDate || endDate) {
      const dateFilter: any = {}
      if (startDate) dateFilter.$gte = startDate
      if (endDate) dateFilter.$lte = endDate
      query.where('lastOccurrence').within(dateFilter)
    }

    const result = await query.sort({ lastOccurrence: -1 }).lean()
    return result as any
  } catch (error) {
    console.error('[WEBHOOK ANALYTICS] Failed to get metrics:', error)
    throw error
  }
}

/**
 * Get webhook event logs with filtering
 */
export async function getWebhookEventLogs(
  filters?: {
    eventType?: string
    status?: string
    subscriptionId?: string
    startDate?: Date
    endDate?: Date
    page?: number
    limit?: number
  }
): Promise<{
  logs: any[]
  total: number
  page: number
  limit: number
}> {
  try {
    const {
      eventType,
      status,
      subscriptionId,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = filters || {}

    let query = WebhookEventLogModel.find()

    if (eventType) query = query.where('eventType').equals(eventType)
    if (status) query = query.where('status').equals(status)
    if (subscriptionId)
      query = query.where('subscriptionId').equals(subscriptionId)

    if (startDate || endDate) {
      const dateFilter: any = {}
      if (startDate) dateFilter.$gte = startDate
      if (endDate) dateFilter.$lte = endDate
      query.where('timestamp').within(dateFilter)
    }

    const total = await WebhookEventLogModel.countDocuments(query.getFilter())
    const logsRaw = await query
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()

    return { logs: logsRaw as any, total, page, limit }
  } catch (error) {
    console.error('[WEBHOOK ANALYTICS] Failed to get event logs:', error)
    throw error
  }
}

/**
 * Get webhook trends over time
 */
export async function getWebhookTrends(
  eventType?: string,
  days: number = 30
): Promise<any[]> {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    let query: any = WebhookTrendModel.find({
      date: { $gte: startDate },
    })

    if (eventType) {
      query = query.where('eventType').equals(eventType)
    }

    const result = await query.sort({ date: 1 }).lean()
    return result as any
  } catch (error) {
    console.error('[WEBHOOK ANALYTICS] Failed to get trends:', error)
    throw error
  }
}

/**
 * Calculate daily trends from event logs
 */
export async function consolidateDailyTrends(): Promise<void> {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const logs = await WebhookEventLogModel.find({
      timestamp: { $gte: today },
    })

    // Group by event type
    const grouped = logs.reduce(
      (acc: any, log: any) => {
        if (!acc[log.eventType]) {
          acc[log.eventType] = {
            eventType: log.eventType,
            logs: [],
          }
        }
        acc[log.eventType].logs.push(log)
        return acc
      },
      {}
    )

    // Calculate trends for each event type
    for (const { eventType, logs } of Object.values(grouped) as any[]) {
      const successfulLogs = (logs as any[]).filter((l: any) => l.status === 'success')
      const successRate =
        logs.length > 0 ? (successfulLogs.length / logs.length) * 100 : 0
      const failureRate = 100 - successRate
      const averageLatency =
        logs.length > 0
          ? (logs as any[]).reduce((sum: number, l: any) => sum + l.latency, 0) / logs.length
          : 0

      const trend = await WebhookTrendModel.findOneAndUpdate(
        { date: today, eventType },
        {
          count: logs.length,
          successRate,
          failureRate,
          averageLatency,
        },
        { upsert: true, new: true }
      )

      if (trend) {
        await trend.save()
      }
    }
  } catch (error) {
    console.error('[WEBHOOK ANALYTICS] Failed to consolidate trends:', error)
  }
}

/**
 * Get success rate for an event type
 */
export async function getWebhookSuccessRate(
  eventType: string,
  hours: number = 24
): Promise<number> {
  try {
    const startDate = new Date()
    startDate.setHours(startDate.getHours() - hours)

    const logs = await WebhookEventLogModel.find({
      eventType,
      timestamp: { $gte: startDate },
    })

    if (logs.length === 0) return 100

    const successful = logs.filter((l) => l.status === 'success').length
    return (successful / logs.length) * 100
  } catch (error) {
    console.error('[WEBHOOK ANALYTICS] Failed to get success rate:', error)
    return 0
  }
}

/**
 * Get failed webhooks requiring attention
 */
export async function getFailedWebhooks(
  limit: number = 10
): Promise<any[]> {
  try {
    const twentyFourHoursAgo = new Date()
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

    const result = await WebhookEventLogModel.find({
      status: { $in: ['failed', 'retry'] },
      timestamp: { $gte: twentyFourHoursAgo },
    })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean()
    return result as any
  } catch (error) {
    console.error('[WEBHOOK ANALYTICS] Failed to get failed webhooks:', error)
    return []
  }
}

/**
 * Get webhook delivery statistics
 */
export async function getWebhookStats(
  hours: number = 24
): Promise<{
  totalEvents: number
  successfulDeliveries: number
  failedDeliveries: number
  pendingDeliveries: number
  averageLatency: number
  successRate: number
}> {
  try {
    const startDate = new Date()
    startDate.setHours(startDate.getHours() - hours)

    const logs = await WebhookEventLogModel.find({
      timestamp: { $gte: startDate },
    })

    const successful = logs.filter((l) => l.status === 'success').length
    const failed = logs.filter((l) => l.status === 'failed').length
    const pending = logs.filter((l) => l.status === 'pending').length
    const averageLatency =
      logs.length > 0
        ? logs.reduce((sum, l) => sum + l.latency, 0) / logs.length
        : 0

    return {
      totalEvents: logs.length,
      successfulDeliveries: successful,
      failedDeliveries: failed,
      pendingDeliveries: pending,
      averageLatency,
      successRate:
        logs.length > 0 ? (successful / logs.length) * 100 : 100,
    }
  } catch (error) {
    console.error('[WEBHOOK ANALYTICS] Failed to get stats:', error)
    return {
      totalEvents: 0,
      successfulDeliveries: 0,
      failedDeliveries: 0,
      pendingDeliveries: 0,
      averageLatency: 0,
      successRate: 0,
    }
  }
}
