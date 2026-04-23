import { test, expect } from './fixtures/e2e'
import { STORAGE_STATES } from './fixtures/auth'

test.describe('Vendor flows and RBAC', () => {
  test.use({ storageState: STORAGE_STATES.vendor })

  test('vendor can access vendor dashboard', async ({ page }) => {
    await page.goto('/vendor/dashboard')

    await expect(page).toHaveURL(/\/vendor\/dashboard/)
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  })

  test('vendor can create a product and see it in vendor products list', async ({ page }) => {
    const uniqueSuffix = Date.now()
    const productName = `E2E Vendor Product ${uniqueSuffix}`

    await page.goto('/vendor/products/new')

    await page.getByLabel('Product Name').fill(productName)
    await page.getByRole('button', { name: 'Generate' }).click()
    await page.getByLabel('Category').fill('E2E Clothing')
    await page.getByLabel('Brand').fill('E2E Vendor Brand')
    await page.getByLabel('List Price (Original)').fill('120')
    await page.getByLabel('Selling Price').fill('90')
    await page.getByLabel('Stock Quantity').fill('8')
    await page.getByLabel('Description').fill('Deterministic product created in Playwright E2E test')

    await page
      .getByPlaceholder('Or paste image URL (e.g. /images/p11-1.jpg)')
      .fill('/images/p11-1.jpg')
    await page.getByRole('button', { name: 'Add' }).click()

    await page.getByText('Publish this product').click()
    await page.getByRole('button', { name: 'Create Product' }).click()

    await expect(page).toHaveURL(/\/vendor\/products/)
    await expect(page.getByText(productName)).toBeVisible()
  })

  test('vendor is blocked from admin routes', async ({ page }) => {
    await page.goto('/admin/dashboard')

    expect(page.url()).not.toContain('/admin/')
  })
})
