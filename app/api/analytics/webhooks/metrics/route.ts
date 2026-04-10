import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { withApiHandler } from '@/lib/api-handler'
import {
  getWebhookMetrics,
  getWebhookEventLogs,
  getWebhookStats,
  getFailedWebhooks,
  getWebhookSuccessRate,
  getWebhookTrends,
} from '@/lib/actions/webhook-analytics'

/**
 * GET /api/analytics/webhooks/metrics
 * Get webhook metrics overview
 */
export const GET = withApiHandler(async (req: NextRequest) => {
  const session = await auth()

  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const startDate = searchParams.get('startDate')
    ? new Date(searchParams.get('startDate')!)
    : undefined
  const endDate = searchParams.get('endDate')
    ? new Date(searchParams.get('endDate')!)
    : undefined

  const metrics = await getWebhookMetrics(startDate, endDate)

  return NextResponse.json({
    success: true,
    data: metrics,
  })
})
