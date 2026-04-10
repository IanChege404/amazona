import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { withApiHandler } from '@/lib/api-handler'
import {
  createVendorWebhook,
  getVendorWebhooks,
  updateVendorWebhook,
  deleteVendorWebhook,
  testVendorWebhook,
} from '@/lib/actions/vendor-webhook'

/**
 * GET /api/vendor/webhooks
 * List all webhooks for the authenticated vendor
 */
export const GET = withApiHandler(async (req: NextRequest) => {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const includeStats = searchParams.get('includeStats') === 'true'

  try {
    const webhooks = await getVendorWebhooks(session.user.id, {
      includeStats,
    })

    return NextResponse.json({
      success: true,
      data: webhooks,
    })
  } catch (error) {
    console.error('[API] Failed to fetch webhooks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch webhooks' },
      { status: 500 }
    )
  }
})

/**
 * POST /api/vendor/webhooks
 * Create a new webhook subscription
 */
export const POST = withApiHandler(async (req: NextRequest) => {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { url, events, description, retryAttempts, timeoutSeconds, headers } = body

    if (!url || !events) {
      return NextResponse.json(
        { error: 'Missing required fields: url, events' },
        { status: 400 }
      )
    }

    const webhook = await createVendorWebhook(session.user.id, {
      url,
      events,
      description,
      retryAttempts,
      timeoutSeconds,
      headers,
    })

    return NextResponse.json(
      {
        success: true,
        data: webhook,
      },
      { status: 201 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create webhook'
    console.error('[API] Webhook creation failed:', error)
    return NextResponse.json({ error: message }, { status: 400 })
  }
})
