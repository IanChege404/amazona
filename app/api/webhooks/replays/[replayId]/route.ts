import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { withApiHandler } from '@/lib/api-handler'
import {
  getWebhookReplay,
  executeWebhookReplay,
  cancelWebhookReplay,
} from '@/lib/actions/webhook-replay'

async function getReplayIdFromUrl(url: string): Promise<string> {
  const match = url.match(/\/replays\/([a-f0-9]+)/)
  if (!match) {
    throw new Error('Invalid replay ID in URL')
  }
  return match[1]
}

/**
 * GET /api/webhooks/replays/[replayId]
 * Get a specific replay
 */
export const GET = withApiHandler(async (req: NextRequest) => {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const replayId = await getReplayIdFromUrl(req.url)
    const replay = await getWebhookReplay(replayId)

    if (!replay) {
      return NextResponse.json({ error: 'Replay not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: replay,
    })
  } catch (error) {
    console.error('[API] Failed to fetch replay:', error)
    return NextResponse.json(
      { error: 'Failed to fetch replay' },
      { status: 500 }
    )
  }
})

/**
 * POST /api/webhooks/replays/[replayId]/execute
 * Execute a replay
 */
export const POST = withApiHandler(async (req: NextRequest) => {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const replayId = await getReplayIdFromUrl(req.url)

    const result = await executeWebhookReplay(replayId)

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to execute replay'
    console.error('[API] Replay execution failed:', error)
    return NextResponse.json({ error: message }, { status: 400 })
  }
})

/**
 * DELETE /api/webhooks/replays/[replayId]
 * Cancel a replay
 */
export const DELETE = withApiHandler(async (req: NextRequest) => {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const replayId = await getReplayIdFromUrl(req.url)

    await cancelWebhookReplay(replayId)

    return NextResponse.json({
      success: true,
      message: 'Replay cancelled successfully',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to cancel replay'
    console.error('[API] Replay cancellation failed:', error)
    return NextResponse.json({ error: message }, { status: 400 })
  }
})
