import Stripe from 'stripe'
import { test, expect } from './fixtures/e2e'
import { STORAGE_STATES } from './fixtures/auth'
import { E2E_PRODUCTS } from './fixtures/test-data'

async function waitForPaymentIntent(orderId: string, stripeSecretKey: string) {
  const stripe = new Stripe(stripeSecretKey)

  for (let attempt = 0; attempt < 15; attempt++) {
    const intents = await stripe.paymentIntents.list({ limit: 20 })
    const paymentIntent = intents.data.find(
      (intent) => intent.metadata?.orderId === orderId
    )

    if (paymentIntent) {
      return { stripe, paymentIntent }
    }

    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  throw new Error(`No payment intent found for order ${orderId}`)
}

test.describe('User authentication and checkout flows', () => {
  test('user can sign in and sign out', async ({ page, auth }) => {
    await auth.loginAsUser()

    await expect(page).not.toHaveURL(/\/sign-in/)

    await auth.logout()
    await page.goto('/account')
    await expect(page).toHaveURL(/\/sign-in/)
  })

  test.describe('authenticated user flows', () => {
    test.use({ storageState: STORAGE_STATES.user })

    test('user can checkout with Stripe sandbox and sees paid order in history', async ({
      page,
    }) => {
      test.setTimeout(120000)

      const stripeSecretKey = process.env.STRIPE_SECRET_KEY
      test.skip(!stripeSecretKey, 'STRIPE_SECRET_KEY is required for Stripe sandbox E2E')

      await page.goto(`/product/${E2E_PRODUCTS.stripe}`)
      await page.getByRole('button', { name: 'Add to Cart' }).click()

      await expect(page).toHaveURL(/\/cart\//)
      await page.getByRole('link', { name: /Proceed to checkout/i }).click()

      await expect(page).toHaveURL(/\/checkout$/)

      await page.getByLabel('Full Name').fill('E2E User')
      await page.getByLabel('Address').fill('3 User Road')
      await page.getByLabel('City').fill('Nairobi')
      await page.getByLabel('Province').fill('Nairobi')
      await page.getByLabel('Country').fill('Kenya')
      await page.getByLabel('Postal Code').fill('00100')
      await page.getByLabel('Phone number').fill('0700000003')

      await page.getByRole('button', { name: 'Ship to this address' }).click()
      await page.getByLabel('Stripe').click()
      await page.getByRole('button', { name: 'Use this payment method' }).click()
      await page.getByRole('button', { name: 'Place Your Order' }).first().click()

      await expect(page).toHaveURL(/\/checkout\/[a-zA-Z0-9]+$/)

      const orderId = page.url().split('/checkout/')[1]
      const { stripe, paymentIntent } = await waitForPaymentIntent(orderId, stripeSecretKey!)

      await stripe.paymentIntents.confirm(paymentIntent.id, {
        payment_method: 'pm_card_visa',
      })

      await page.goto(
        `/checkout/${orderId}/stripe-payment-success?payment_intent=${paymentIntent.id}`
      )

      await expect(
        page.getByRole('heading', { name: 'Thanks for your purchase' })
      ).toBeVisible()

      await page.goto(`/account/orders/${orderId}`)
      await expect(page.getByText(/Paid at/i)).toBeVisible()

      await page.goto('/account/orders')
      await expect(page.getByRole('link', { name: /Details/i }).first()).toBeVisible()
    })

    test('user is blocked from vendor and admin routes', async ({ page }) => {
      await page.goto('/vendor/dashboard')
      expect(page.url()).not.toContain('/vendor/dashboard')

      await page.goto('/admin/dashboard')
      expect(page.url()).not.toContain('/admin/')
    })
  })
})
