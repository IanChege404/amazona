import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { withApiHandler } from '@/lib/api-handler'
import { testVendorWebhook } from '@/lib/actions/vendor-webhook'

async function getWebhookIdFromUrl(url: string): Promise<string> {
  const match = url.match(/\/webhooks\/([a-f0-9]+)\/test/)
  if (!match) {
    throw new Error('Invalid webhook ID in URL')
  }
  return match[1]
}

/**
 * POST /api/vendor/webhooks/[webhookId]/test
 * Test a webhook by sending a sample event
 */
export const POST = withApiHandler(async (req: NextRequest) => {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const webhookId = await getWebhookIdFromUrl(req.url)
    const body = await req.json()
    const { eventType } = body

    const result = await testVendorWebhook(session.user.id, webhookId, eventType)

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to test webhook'
    console.error('[API] Webhook test failed:', error)
    return NextResponse.json({ error: message }, { status: 400 })
  }
})
