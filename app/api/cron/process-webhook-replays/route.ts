import { NextRequest, NextResponse } from 'next/server'
import { processPerndingReplays } from '@/lib/actions/webhook-replay'

/**
 * POST /api/cron/process-webhook-replays
 * Process pending webhook replays with exponential backoff
 * 
 * This endpoint should be called periodically by a cron job service
 * Authorization: Uses CRON_SECRET header for verification
 */
export async function POST(req: NextRequest) {
  try {
    // Verify cron secret
    const cronSecret = req.headers.get('authorization')?.replace('Bearer ', '')
    if (cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Process pending replays
    const result = await processPerndingReplays()

    return NextResponse.json({
      success: true,
      message: 'Pending replays processed',
      data: result,
    })
  } catch (error) {
    console.error('[CRON] Failed to process webhook replays:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to process replays',
      },
      { status: 500 }
    )
  }
}
