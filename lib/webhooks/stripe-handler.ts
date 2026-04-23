/**
 * Stripe Webhook Handler
 * Processes Stripe events and updates order/payment statuses
 * Note: Import stripe instance from your Stripe config
 */

import { WebhookEventType } from '@/lib/webhooks/types'
import { dispatchWebhook } from '@/lib/webhooks/dispatcher'
import { stripe } from '@/lib/stripe/connect'
import Stripe from 'stripe'

/**
 * Handle Stripe webhook events
 */
export async function handleStripeWebhook(event: any) {
  console.log('[STRIPE WEBHOOK] Event:', event.type)

  try {
    // Note: Import stripe from your configured instance at top of file:
    // import { stripe } from '@/lib/stripe'
    switch (event.type) {
      // Payment intent succeeded
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await handlePaymentIntentSucceeded(paymentIntent)
        break
      }

      // Payment intent failed
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await handlePaymentIntentFailed(paymentIntent)
        break
      }

      // Charge refunded
      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        await handleChargeRefunded(charge)
        break
      }

      // Dispute created
      case 'charge.dispute.created': {
        const dispute = event.data.object as Stripe.Dispute
        await handleDisputeCreated(dispute)
        break
      }

      // Payout paid
      case 'payout.paid': {
        const payout = event.data.object as Stripe.Payout
        await handlePayoutPaid(payout)
        break
      }

      // Payout failed
      case 'payout.failed': {
        const payout = event.data.object as Stripe.Payout
        await handlePayoutFailed(payout)
        break
      }

      // Account updated
      case 'account.updated': {
        const account = event.data.object as Stripe.Account
        await handleAccountUpdated(account)
        break
      }

      default:
        console.log('[STRIPE WEBHOOK] Unhandled event:', event.type)
    }

    return { success: true }
  } catch (error) {
    console.error('[STRIPE WEBHOOK] Error handling event:', error)
    throw error
  }
}

/**
 * Handle payment intent succeeded
 */
async function handlePaymentIntentSucceeded(paymentIntent: any) {
  const metadata = paymentIntent.metadata as Record<string, string>
  const orderId = metadata?.orderId
  const vendorId = metadata?.vendorId

  if (!orderId) {
    console.warn('[STRIPE] No orderId in payment intent', paymentIntent.id)
    return
  }

  // Update order to paid
  console.log(`[STRIPE] Payment succeeded for order: ${orderId}`)

  // Dispatch webhook
  await dispatchWebhook(WebhookEventType.PAYMENT_SUCCEEDED, {
    paymentIntentId: paymentIntent.id,
    orderId,
    vendorId,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    chargeId: paymentIntent.latest_charge,
  })
}

/**
 * Handle payment intent failed
 */
async function handlePaymentIntentFailed(paymentIntent: any) {
  const metadata = paymentIntent.metadata as Record<string, string>
  const orderId = metadata?.orderId

  if (!orderId) {
    console.warn('[STRIPE] No orderId in failed payment', paymentIntent.id)
    return
  }

  console.log(`[STRIPE] Payment failed for order: ${orderId}`)

  // Dispatch webhook
  await dispatchWebhook(WebhookEventType.PAYMENT_FAILED, {
    paymentIntentId: paymentIntent.id,
    orderId,
    error: paymentIntent.last_payment_error?.message,
  })
}

/**
 * Handle charge refunded
 */
async function handleChargeRefunded(charge: any) {
  const metadata = charge.metadata as Record<string, string>
  const orderId = metadata?.orderId

  if (!orderId) {
    console.warn('[STRIPE] No orderId in refund', charge.id)
    return
  }

  console.log(`[STRIPE] Charge refunded for order: ${orderId}`)

  // Dispatch webhook
  await dispatchWebhook(WebhookEventType.PAYMENT_REFUNDED, {
    chargeId: charge.id,
    orderId,
    refundAmount: charge.amount_refunded,
    currency: charge.currency,
    reason: charge.refunded,
  })
}

/**
 * Handle dispute created
 */
async function handleDisputeCreated(dispute: any) {
  const metadata = dispute.metadata as Record<string, string>
  const orderId = metadata?.orderId

  console.log('[STRIPE] Dispute created:', dispute.id, orderId)

  // Dispatch webhook
  await dispatchWebhook(WebhookEventType.PAYMENT_DISPUTED, {
    disputeId: dispute.id,
    orderId,
    chargeId: dispute.charge,
    amount: dispute.amount,
    reason: dispute.reason,
    status: dispute.status,
  })
}

/**
 * Handle payout paid
 */
async function handlePayoutPaid(payout: any) {
  const metadata = payout.metadata as Record<string, string>
  const vendorId = metadata?.vendorId

  if (!vendorId) {
    console.warn('[STRIPE] No vendorId in payout', payout.id)
    return
  }

  console.log(`[STRIPE] Payout paid for vendor: ${vendorId}`)

  // Dispatch webhook
  await dispatchWebhook(WebhookEventType.PAYOUT_COMPLETED, {
    payoutId: payout.id,
    vendorId,
    amount: payout.amount,
    currency: payout.currency,
    arrivalDate: new Date(payout.arrival_date * 1000),
  })
}

/**
 * Handle payout failed
 */
async function handlePayoutFailed(payout: any) {
  const metadata = payout.metadata as Record<string, string>
  const vendorId = metadata?.vendorId

  console.log('[STRIPE] Payout failed:', payout.id, vendorId)

  // Dispatch webhook
  await dispatchWebhook(WebhookEventType.PAYOUT_FAILED, {
    payoutId: payout.id,
    vendorId,
    failure_code: payout.failure_code,
  })
}

/**
 * Handle account updated
 */
async function handleAccountUpdated(account: any) {
  console.log('[STRIPE] Connected account updated:', account.id)

  // Dispatch webhook for vendor settings
  await dispatchWebhook(WebhookEventType.VENDOR_SETTINGS_UPDATED, {
    stripeAccountId: account.id,
    charges_enabled: account.charges_enabled,
    payouts_enabled: account.payouts_enabled,
  })
}

/**
 * Verify Stripe webhook signature
 */
export function verifyStripeWebhookSignature(
  rawBody: string | Buffer,
  signature: string,
  secret: string
): any {
  try {
    return stripe.webhooks.constructEvent(rawBody, signature, secret)
  } catch (error) {
    console.error('[STRIPE] Webhook signature verification failed:', error)
    throw error
  }
}
