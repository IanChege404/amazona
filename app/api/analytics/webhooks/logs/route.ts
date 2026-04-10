import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { withApiHandler } from '@/lib/api-handler'
import { getWebhookEventLogs } from '@/lib/actions/webhook-analytics'

/**
 * GET /api/analytics/webhooks/logs
 * Get webhook event logs with filtering
 */
export const GET = withApiHandler(async (req: NextRequest) => {
  const session = await auth()

  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)

  const result = await getWebhookEventLogs({
    eventType: searchParams.get('eventType') || undefined,
    status: searchParams.get('status') || undefined,
    subscriptionId: searchParams.get('subscriptionId') || undefined,
    startDate: searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : undefined,
    endDate: searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : undefined,
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '20'),
  })

  return NextResponse.json({
    success: true,
    data: result,
  })
})
