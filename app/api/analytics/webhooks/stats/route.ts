import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { withApiHandler } from '@/lib/api-handler'
import {
  getWebhookStats,
  getFailedWebhooks,
  getWebhookSuccessRate,
} from '@/lib/actions/webhook-analytics'

/**
 * GET /api/analytics/webhooks/stats
 * Get webhook delivery statistics
 */
export const GET = withApiHandler(async (req: NextRequest) => {
  const session = await auth()

  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const hours = parseInt(searchParams.get('hours') || '24')

  const stats = await getWebhookStats(hours)
  const failedWebhooks = await getFailedWebhooks(10)

  return NextResponse.json({
    success: true,
    data: {
      stats,
      failedWebhooks,
    },
  })
})
