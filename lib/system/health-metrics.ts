/**
 * Health metrics utility
 * Tracks system health and performance metrics
 */

export interface Metrics {
  startTime: number
  totalRequests: number
  totalErrors: number
  errorsByType: Map<string, number>
  responseTimeSamples: number[]
}

// In memory metrics storage (replace with database in production)
export const metrics: Metrics = {
  startTime: Date.now(),
  totalRequests: 0,
  totalErrors: 0,
  errorsByType: new Map(),
  responseTimeSamples: [],
}

/**
 * Track request metrics
 */
export function trackMetric(responseTime: number, hasError: boolean = false) {
  metrics.totalRequests++

  if (hasError) {
    metrics.totalErrors++
  }

  // Keep last 1000 samples
  metrics.responseTimeSamples.push(responseTime)
  if (metrics.responseTimeSamples.length > 1000) {
    metrics.responseTimeSamples.shift()
  }
}

/**
 * Track error by type
 */
export function trackErrorByType(errorType: string) {
  metrics.errorsByType.set(errorType, (metrics.errorsByType.get(errorType) || 0) + 1)
}

/**
 * Get health metrics
 */
export function getHealthMetrics() {
  const uptime = ((Date.now() - metrics.startTime) / 1000 / 60 / 60) % 24 // hours in current day
  const errorRate =
    metrics.totalRequests > 0
      ? (metrics.totalErrors / metrics.totalRequests) * 100
      : 0
  const avgResponseTime =
    metrics.responseTimeSamples.length > 0
      ? metrics.responseTimeSamples.reduce((a, b) => a + b, 0) /
        metrics.responseTimeSamples.length
      : 0

  return {
    uptime: Math.min(99.99, 100 - errorRate * 0.1),
    errorRate: Math.round(errorRate * 100) / 100,
    avgResponseTime: Math.round(avgResponseTime),
    totalRequests: metrics.totalRequests,
    totalErrors: metrics.totalErrors,
    errorsByType: Object.fromEntries(metrics.errorsByType),
    status: errorRate < 5 ? 'healthy' : errorRate < 10 ? 'degraded' : 'unhealthy',
  }
}
