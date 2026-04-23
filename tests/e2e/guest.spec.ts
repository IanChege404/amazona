import { test, expect } from './fixtures/e2e'
import { E2E_PRODUCTS, E2E_VENDOR_SLUG } from './fixtures/test-data'

test.describe('Guest storefront flows', () => {
  test('home loads and product list renders', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('link', { name: /Amazona/i })).toBeVisible()
    await expect(page.getByTestId('product-card').first()).toBeVisible()
  })

  test('search returns deterministic results', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('searchbox').fill('E2E')
    await page.getByRole('searchbox').press('Enter')

    await expect(page).toHaveURL(/\/search/)
    await expect(page.getByText(/results/i)).toBeVisible()
    await expect(page.getByTestId('product-card').first()).toBeVisible()
  })

  test('product details page renders', async ({ page }) => {
    await page.goto(`/product/${E2E_PRODUCTS.stripe}`)

    await expect(
      page.getByRole('heading', { name: 'E2E Stripe Tee' })
    ).toBeVisible()
    await expect(page.getByRole('button', { name: 'Add to Cart' })).toBeVisible()
  })

  test('guest can add, update and remove cart item', async ({ page }) => {
    await page.goto(`/product/${E2E_PRODUCTS.stripe}`)
    await page.getByRole('button', { name: 'Add to Cart' }).click()

    await expect(page).toHaveURL(/\/cart\//)
    await page.goto('/cart')

    await expect(page.getByRole('heading', { name: /Shopping Cart/i })).toBeVisible()

    await page.getByRole('combobox', { name: /Quantity: 1/i }).click()
    await page.getByRole('option', { name: '2', exact: true }).click()

    await expect(page.getByText(/Subtotal \(2 (items|Items)\)/)).toBeVisible()

    await page.getByRole('button', { name: 'Delete' }).first().click()
    await expect(page.getByText(/Your Shopping Cart is empty/i)).toBeVisible()
  })

  test('guest can open public vendor storefront', async ({ page }) => {
    await page.goto(`/store/${E2E_VENDOR_SLUG}`)

    await expect(page.getByRole('heading', { name: 'E2E Vendor Store' })).toBeVisible()
  })
})
