/**
 * Stripe Webhook API Route
 * Receives and processes Stripe webhook events
 */

import { NextRequest, NextResponse } from 'next/server'
import { handleStripeWebhook, verifyStripeWebhookSignature } from '@/lib/webhooks/stripe-handler'

/**
 * POST /api/webhooks/stripe
 * Handle all Stripe webhook events
 */
export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature')
  const secret = process.env.STRIPE_WEBHOOK_SECRET

  if (!signature || !secret) {
    console.error('[STRIPE WEBHOOK] Missing signature or secret')
    return NextResponse.json(
      {
        error: 'Missing authentication',
      },
      { status: 401 }
    )
  }

  try {
    // Get raw body for signature verification
    const rawBody = await request.text()

    // Verify and construct event
    const event = verifyStripeWebhookSignature(rawBody, signature, secret)

    // Log event
    console.log('[STRIPE WEBHOOK] Received:', event.type, 'ID:', event.id)

    // Handle the event
    await handleStripeWebhook(event)

    // Acknowledge receipt
    return NextResponse.json(
      {
        success: true,
        eventId: event.id,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[STRIPE WEBHOOK] Processing error:', error)

    const errorMessage = error instanceof Error ? error.message : String(error)

    // Return appropriate error code
    if (errorMessage.includes('signature')) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      {
        error: 'Webhook processing failed',
        message: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 400 }
    )
  }
}

/**
 * GET /api/webhooks/stripe
 * Health check for Stripe webhook endpoint
 */
export async function GET() {
  return NextResponse.json(
    {
      status: 'active',
      service: 'Stripe Webhook Handler',
      configured: !!process.env.STRIPE_WEBHOOK_SECRET,
    },
    { status: 200 }
  )
}
