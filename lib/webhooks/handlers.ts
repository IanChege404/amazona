/**
 * Webhook Routing API
 * Routes webhooks from third-party providers
 */

import { NextRequest, NextResponse } from 'next/server'
import { handleStripeWebhook, verifyStripeWebhookSignature } from '@/lib/webhooks/stripe-handler'
import { captureException } from '@/lib/sentry'

/**
 * POST /api/webhooks/stripe
 * Handle Stripe webhooks
 */
export async function POST(request: NextRequest) {
  if (request.nextUrl.pathname !== '/api/webhooks/stripe') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const signature = request.headers.get('stripe-signature')
  const secret = process.env.STRIPE_WEBHOOK_SECRET

  if (!signature || !secret) {
    console.error('[WEBHOOK] Missing signature or secret')
    return NextResponse.json(
      { error: 'Missing webhook credentials' },
      { status: 401 }
    )
  }

  try {
    // Get raw body for signature verification
    const rawBody = await request.text()

    // Verify webhook signature
    const event = verifyStripeWebhookSignature(rawBody, signature, secret)

    // Handle the event
    await handleStripeWebhook(event)

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error) {
    console.error('[WEBHOOK] Stripe webhook error:', error)

    // Capture in Sentry
    captureException(error instanceof Error ? error : new Error(String(error)), {
      webhook: 'stripe',
    })

    // Return 400 to tell Stripe webhook delivery failed
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Webhook processing failed',
      },
      { status: 400 }
    )
  }
}

/**
 * POST /api/webhooks/razorpay
 * Handle Razorpay webhooks (for India/international users)
 */
export async function handleRazorpayWebhook(
  event: string,
  payload: Record<string, any>,
  signature: string,
  secret: string
): Promise<void> {
  try {
    // Verify signature
    const crypto = require('crypto')
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex')

    if (expectedSignature !== signature) {
      throw new Error('Invalid Razorpay signature')
    }

    switch (event) {
      case 'payment.authorized':
        console.log('[RAZORPAY] Payment authorized:', payload.payment_id)
        break
      case 'payment.failed':
        console.log('[RAZORPAY] Payment failed:', payload.payment_id)
        break
      case 'payment.captured':
        console.log('[RAZORPAY] Payment captured:', payload.payment_id)
        break
      default:
        console.log('[RAZORPAY] Unknown event:', event)
    }
  } catch (error) {
    console.error('[RAZORPAY] Webhook error:', error)
    throw error
  }
}

/**
 * POST /api/webhooks/shipment
 * Handle shipment/logistics webhooks
 */
export async function handleShipmentWebhook(
  carrier: string,
  event: string,
  data: Record<string, any>
): Promise<void> {
  try {
    switch (carrier) {
      case 'dhl':
      case 'fedex':
      case 'ups':
      case 'local':
        console.log(`[SHIPMENT] ${carrier.toUpperCase()} webhook:`, event, data.trackingNumber)
        // Update order tracking status
        break
      default:
        console.warn('[SHIPMENT] Unknown carrier:', carrier)
    }
  } catch (error) {
    console.error('[SHIPMENT] Webhook error:', error)
    throw error
  }
}

/**
 * POST /api/webhooks/email
 * Handle email delivery webhooks (Resend, SendGrid, etc.)
 */
export async function handleEmailWebhook(
  provider: string,
  event: string,
  data: Record<string, any>
): Promise<void> {
  try {
    switch (provider) {
      case 'resend':
        console.log('[EMAIL] Resend webhook:', event, data.email)
        // Track email delivery status
        break
      case 'sendgrid':
        console.log('[EMAIL] SendGrid webhook:', event)
        break
      default:
        console.warn('[EMAIL] Unknown provider:', provider)
    }
  } catch (error) {
    console.error('[EMAIL] Webhook error:', error)
    throw error
  }
}

/**
 * Health check for webhook endpoint
 */
export async function handleWebhookHealth(request: NextRequest): Promise<NextResponse> {
  return NextResponse.json(
    {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  )
}
