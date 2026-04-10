/**
 * Stripe webhook handler for subscription billing events
 */

import { stripe } from '@/lib/stripe/subscriptions'
import Vendor from '@/lib/db/models/vendor.model'
import { connectToDatabase } from '@/lib/db'

const webhookSecret = process.env.STRIPE_BILLING_WEBHOOK_SECRET

export async function POST(req: Request) {
  if (!webhookSecret) {
    console.error('STRIPE_BILLING_WEBHOOK_SECRET not configured')
    return Response.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    )
  }

  const sig = req.headers.get('stripe-signature')
  if (!sig) {
    return Response.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event

  try {
    const body = await req.text()
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return Response.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    await connectToDatabase()

    switch (event.type) {
      case 'customer.subscription.updated': {
        const subscription = event.data.object
        const vendorId = subscription.metadata?.vendorId

        if (vendorId) {
          await Vendor.findByIdAndUpdate(vendorId, {
            subscriptionStatus: subscription.status,
            subscriptionCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
          })

          console.log(`Subscription updated for vendor ${vendorId}`)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        const vendorId = subscription.metadata?.vendorId

        if (vendorId) {
          // Downgrade to free tier
          await Vendor.findByIdAndUpdate(vendorId, {
            subscriptionTier: 'free',
            subscriptionStatus: 'canceled',
            subscriptionId: '',
          })

          console.log(`Subscription canceled for vendor ${vendorId}`)
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object
        const subscriptionId = invoice.subscription

        if (subscriptionId && typeof subscriptionId === 'string') {
          const vendor = await Vendor.findOne({ subscriptionId })
          if (vendor) {
            console.log(`Payment succeeded for vendor ${vendor._id}`)
          }
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object
        const subscriptionId = invoice.subscription

        if (subscriptionId && typeof subscriptionId === 'string') {
          const vendor = await Vendor.findOne({ subscriptionId })
          if (vendor) {
            // Update status to past_due
            await Vendor.findByIdAndUpdate(vendor._id, {
              subscriptionStatus: 'past_due',
            })

            console.log(`Payment failed for vendor ${vendor._id}`)
            // TODO: Send email notification to vendor
          }
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return Response.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return Response.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
