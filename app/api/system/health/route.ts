/**
 * System Health and Monitoring API
 * Provides metrics for system uptime, error rates, and performance
 */

import { NextRequest, NextResponse } from 'next/server'
import { withApiHandler } from '@/lib/api-handler'
import { getHealthMetrics } from '@/lib/system/health-metrics'

/**
 * GET /api/system/health
 * Returns system health metrics
 */
export const GET = withApiHandler(async (request: NextRequest) => {
  const healthMetrics = getHealthMetrics()

  return NextResponse.json({
    uptime: healthMetrics.uptime,
    errorRate: healthMetrics.errorRate,
    avgResponseTime: healthMetrics.avgResponseTime,
    totalRequests: healthMetrics.totalRequests,
    totalErrors: healthMetrics.totalErrors,
    status: healthMetrics.status,
    errorsByType: healthMetrics.errorsByType,
    timestamp: new Date().toISOString(),
  })
}, { rateLimit: 'api.default' })
