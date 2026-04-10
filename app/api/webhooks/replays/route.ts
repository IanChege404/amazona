import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { withApiHandler } from '@/lib/api-handler'
import {
  createWebhookReplay,
  getWebhookReplays,
  executeWebhookReplay,
  cancelWebhookReplay,
  getReplayStats,
} from '@/lib/actions/webhook-replay'

/**
 * GET /api/webhooks/replays
 * List webhook replays
 */
export const GET = withApiHandler(async (req: NextRequest) => {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const isAdmin = session.user.role === 'admin'
  const isVendor = session.user.role === 'vendor' || !session.user.role?.includes('admin')

  try {
    const result = await getWebhookReplays({
      vendorId: isVendor && isAdmin === false ? session.user.id : undefined,
      status: searchParams.get('status') || undefined,
      eventType: searchParams.get('eventType') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    })

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('[API] Failed to fetch replays:', error)
    return NextResponse.json(
      { error: 'Failed to fetch replays' },
      { status: 500 }
    )
  }
})

/**
 * POST /api/webhooks/replays
 * Create a new replay
 */
export const POST = withApiHandler(async (req: NextRequest) => {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const {
      originalEventId,
      eventType,
      payload,
      reason,
      subscriptionId,
      maxAttempts,
      url,
      secret,
    } = body

    if (!originalEventId || !eventType || !payload || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const replay = await createWebhookReplay(
      originalEventId,
      eventType,
      payload,
      reason,
      session.user.id || '',
      {
        subscriptionId,
        vendorId: session.user.role?.includes('vendor') ? session.user.id || '' : undefined,
        url,
        secret,
        maxAttempts,
      }
    )

    return NextResponse.json(
      {
        success: true,
        data: replay,
      },
      { status: 201 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create replay'
    console.error('[API] Replay creation failed:', error)
    return NextResponse.json({ error: message }, { status: 400 })
  }
})
