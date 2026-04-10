import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { withApiHandler } from '@/lib/api-handler'
import { createBatchReplay, getBatchReplays } from '@/lib/actions/webhook-replay'

/**
 * GET /api/webhooks/replays/batch
 * List batch replays
 */
export const GET = withApiHandler(async (req: NextRequest) => {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const isVendor = session.user.role?.includes('vendor')

  try {
    const result = await getBatchReplays({
      vendorId: isVendor ? session.user.id : undefined,
      status: searchParams.get('status') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    })

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('[API] Failed to fetch batch replays:', error)
    return NextResponse.json(
      { error: 'Failed to fetch batch replays' },
      { status: 500 }
    )
  }
})

/**
 * POST /api/webhooks/replays/batch
 * Create a batch replay
 */
export const POST = withApiHandler(async (req: NextRequest) => {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { eventIds, eventType, reason, subscriptionId } = body

    if (!eventIds || !Array.isArray(eventIds) || eventIds.length === 0) {
      return NextResponse.json(
        { error: 'Event IDs array is required' },
        { status: 400 }
      )
    }

    if (!eventType || !reason) {
      return NextResponse.json(
        { error: 'Event type and reason are required' },
        { status: 400 }
      )
    }

    const batch = await createBatchReplay(
      eventIds,
      eventType,
      reason,
      session.user.id || '',
      {
        subscriptionId,
        vendorId: session.user.role?.includes('vendor') ? session.user.id || '' : undefined,
      }
    )

    return NextResponse.json(
      {
        success: true,
        data: batch,
      },
      { status: 201 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create batch replay'
    console.error('[API] Batch creation failed:', error)
    return NextResponse.json({ error: message }, { status: 400 })
  }
})
