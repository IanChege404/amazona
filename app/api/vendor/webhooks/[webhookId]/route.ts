import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { withApiHandler } from '@/lib/api-handler'
import {
  getVendorWebhook,
  updateVendorWebhook,
  deleteVendorWebhook,
  getVendorWebhookDeliveries,
  testVendorWebhook,
  getVendorWebhookHealth,
} from '@/lib/actions/vendor-webhook'

async function getWebhookIdFromUrl(url: string): Promise<string> {
  const match = url.match(/\/webhooks\/([a-f0-9]+)/)
  if (!match) {
    throw new Error('Invalid webhook ID in URL')
  }
  return match[1]
}

/**
 * GET /api/vendor/webhooks/[webhookId]
 * Get a specific webhook or list deliveries
 */
export const GET = withApiHandler(async (req: NextRequest) => {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const webhookId = await getWebhookIdFromUrl(req.url)
    const { searchParams } = new URL(req.url)

    // If requesting deliveries
    if (searchParams.get('deliveries') === 'true') {
      const result = await getVendorWebhookDeliveries(session.user.id, webhookId, {
        status: searchParams.get('status') || undefined,
        page: parseInt(searchParams.get('page') || '1'),
        limit: parseInt(searchParams.get('limit') || '20'),
      })

      return NextResponse.json({
        success: true,
        data: result,
      })
    }

    // If requesting health
    if (searchParams.get('health') === 'true') {
      const health = await getVendorWebhookHealth(session.user.id, webhookId)
      return NextResponse.json({
        success: true,
        data: health,
      })
    }

    // Otherwise return webhook details
    const webhook = await getVendorWebhook(session.user.id, webhookId)

    if (!webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: webhook,
    })
  } catch (error) {
    console.error('[API] Failed to fetch webhook:', error)
    return NextResponse.json(
      { error: 'Failed to fetch webhook' },
      { status: 500 }
    )
  }
})

/**
 * PATCH /api/vendor/webhooks/[webhookId]
 * Update a webhook subscription
 */
export const PATCH = withApiHandler(async (req: NextRequest) => {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const webhookId = await getWebhookIdFromUrl(req.url)
    const body = await req.json()

    const webhook = await updateVendorWebhook(session.user.id, webhookId, body)

    return NextResponse.json({
      success: true,
      data: webhook,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update webhook'
    console.error('[API] Webhook update failed:', error)
    return NextResponse.json({ error: message }, { status: 400 })
  }
})

/**
 * DELETE /api/vendor/webhooks/[webhookId]
 * Delete a webhook subscription
 */
export const DELETE = withApiHandler(async (req: NextRequest) => {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const webhookId = await getWebhookIdFromUrl(req.url)

    await deleteVendorWebhook(session.user.id, webhookId)

    return NextResponse.json({
      success: true,
      message: 'Webhook deleted successfully',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete webhook'
    console.error('[API] Webhook deletion failed:', error)
    return NextResponse.json({ error: message }, { status: 400 })
  }
})
