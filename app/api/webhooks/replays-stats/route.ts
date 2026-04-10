import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { withApiHandler } from '@/lib/api-handler'
import { getReplayStats } from '@/lib/actions/webhook-replay'

/**
 * GET /api/webhooks/replays/stats
 * Get replay statistics
 */
export const GET = withApiHandler(async (req: NextRequest) => {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const isVendor = session.user.role?.includes('vendor')

  try {
    const stats = await getReplayStats({
      vendorId: isVendor ? session.user.id : undefined,
      days: searchParams.get('days') ? parseInt(searchParams.get('days')!) : 30,
    })

    return NextResponse.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error('[API] Failed to fetch replay stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch replay stats' },
      { status: 500 }
    )
  }
})
