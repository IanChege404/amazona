import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { withApiHandler } from '@/lib/api-handler'
import { getWebhookTrends } from '@/lib/actions/webhook-analytics'

/**
 * GET /api/analytics/webhooks/trends
 * Get webhook trends over time
 */
export const GET = withApiHandler(async (req: NextRequest) => {
  const session = await auth()

  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const eventType = searchParams.get('eventType') || undefined
  const days = parseInt(searchParams.get('days') || '30')

  const trends = await getWebhookTrends(eventType, days)

  return NextResponse.json({
    success: true,
    data: trends,
  })
})
