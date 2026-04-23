/* eslint-disable @typescript-eslint/no-explicit-any */
import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY && process.env.NODE_ENV === 'production') {
  console.warn('STRIPE_SECRET_KEY not configured. Stripe operations will not be available.')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
  apiVersion: '2024-12-18.acacia',
})

/**
 * Create a Stripe Express account for a vendor
 * This allows the vendor to accept payments and receive payouts
 */
export async function createStripeConnectAccount(email: string): Promise<string> {
  try {
    const account = await stripe.accounts.create({
      type: 'express',
      email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    })
    return account.id
  } catch (error) {
    console.error('Failed to create Stripe Connect account:', error)
    throw error
  }
}

/**
 * Generate a Stripe onboarding link for account setup
 * Vendor will complete KYC and payment details via this link
 */
export async function createAccountLink(accountId: string): Promise<string> {
  try {
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      type: 'account_onboarding',
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/vendor/stripe/refresh`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/vendor/stripe/success`,
    })
    return accountLink.url
  } catch (error) {
    console.error('Failed to create Stripe account link:', error)
    throw error
  }
}

/**
 * Generate a Stripe dashboard link for vendor to manage their connected account
 */
export async function createDashboardLink(accountId: string): Promise<string> {
  try {
    const link = await stripe.accounts.createLoginLink(accountId)
    return link.url
  } catch (error) {
    console.error('Failed to create dashboard link:', error)
    throw error
  }
}

/**
 * Calculate the platform fee amount in cents
 * Platform keeps this percentage, vendor gets the rest
 */
export function calculatePlatformFee(amountInCents: number, commissionRate: number): number {
  return Math.round(amountInCents * (commissionRate / 100))
}

/**
 * Calculate vendor payout amount after platform fee
 */
export function calculateVendorPayout(
  amountInCents: number,
  commissionRate: number
): number {
  const platformFee = calculatePlatformFee(amountInCents, commissionRate)
  return amountInCents - platformFee
}

/**
 * Retrieve account details from Stripe Connect
 */
export async function getAccountDetails(accountId: string) {
  try {
    const account = await stripe.accounts.retrieve(accountId)
    return {
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      requirements_past_due: account.requirements?.past_due || [],
      requirements_currently_due: account.requirements?.currently_due || [],
      is_verified: account.charges_enabled && account.payouts_enabled,
    }
  } catch (error) {
    console.error('Failed to retrieve account details:', error)
    throw error
  }
}

/**
 * Create a payment intent with automatic transfer to vendor
 * The platform fee is deducted, remainder transferred to vendor's connected account
 */
export async function createPaymentIntentWithTransfer(
  amountInCents: number,
  vendorStripeAccountId: string,
  commissionRate: number,
  orderId: string,
  description?: string,
  currency: string = 'kes'
) {
  try {
    const platformFee = calculatePlatformFee(amountInCents, commissionRate)

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency.toLowerCase(),
      description: description || `Order ${orderId}`,
      transfer_data: {
        destination: vendorStripeAccountId,
      },
      application_fee_amount: platformFee,
      metadata: {
        orderId,
        vendorStripeAccountId,
      },
    })

    return paymentIntent
  } catch (error) {
    console.error('Failed to create payment intent with transfer:', error)
    throw error
  }
}

/**
 * Retrieve payment intent details
 */
export async function getPaymentIntent(paymentIntentId: string) {
  try {
    return await stripe.paymentIntents.retrieve(paymentIntentId)
  } catch (error) {
    console.error('Failed to retrieve payment intent:', error)
    throw error
  }
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): Record<string, any> | null {
  try {
    return stripe.webhooks.constructEvent(body, signature, secret)
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return null
  }
}

/**
 * Handle Stripe webhook events
 */
export async function handleStripeWebhook(event: Stripe.Event) {
  switch (event.type) {
    case 'account.updated':
      // Vendor's Stripe account status changed
      return { action: 'account_updated', accountId: event.data.object.id }

    case 'payment_intent.succeeded':
      // Payment successful, transfer will be automatic
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      return {
        action: 'payment_succeeded',
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
      }

    case 'payment_intent.payment_failed':
      // Payment failed
      return {
        action: 'payment_failed',
        paymentIntentId: (event.data.object as Stripe.PaymentIntent).id,
      }

    case 'charge.refunded':
      // Refund issued
      const charge = event.data.object as Stripe.Charge
      return {
        action: 'charge_refunded',
        chargeId: charge.id,
        amount: charge.amount,
      }

    case 'transfer.created':
      // Transfer to vendor initiated
      const transfer = event.data.object as Stripe.Transfer
      return {
        action: 'transfer_created',
        transferId: transfer.id,
        amount: transfer.amount,
        destination: transfer.destination,
      }

    case 'transfer.updated':
      // Transfer to vendor updated
      return {
        action: 'transfer_updated',
        transferId: (event.data.object as Stripe.Transfer).id,
      }

    default:
      return { action: 'unknown', eventType: event.type }
  }
}
