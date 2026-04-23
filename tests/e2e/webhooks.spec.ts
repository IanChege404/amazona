import { test, expect } from './fixtures/e2e'
import { STORAGE_STATES } from './fixtures/auth'

test.describe('Webhook analytics and management', () => {
  test.describe('Admin webhook analytics', () => {
    test.use({ storageState: STORAGE_STATES.admin })

    test('admin can view webhook analytics, logs, filters and pagination', async ({
      page,
    }) => {
      await page.goto('/admin/webhook-analytics')

      await expect(
        page.getByRole('heading', { name: 'Webhook Analytics' })
      ).toBeVisible()
      await expect(page.getByText('Webhook Event Logs')).toBeVisible()
      await expect(page.getByText('ORDER.CREATED').first()).toBeVisible()

      await page.getByRole('combobox', { name: /Status/i }).click()
      await page.getByRole('option', { name: 'Failed' }).click()

      await expect(page.getByText('failed').first()).toBeVisible()

      const nextPageButton = page
        .locator('button')
        .filter({ has: page.locator('svg.lucide-chevron-right') })
        .last()

      await expect(nextPageButton).toBeVisible()
      await expect(nextPageButton).toBeEnabled()

      await nextPageButton.click()
      await expect(page.getByText(/Page 2 of/i)).toBeVisible()
    })
  })

  test.describe('Vendor webhook subscriptions', () => {
    test.use({ storageState: STORAGE_STATES.vendor })

    test('vendor can create and see webhook subscription in UI', async ({ page }) => {
      await page.goto('/vendor/webhooks')

      await expect(
        page.getByRole('heading', { name: 'Webhook Management' })
      ).toBeVisible()

      await page.getByRole('button', { name: 'Create Webhook' }).click()
      await page.getByLabel('Webhook URL *').fill('https://example.com/e2e-webhook')
      await page
        .getByLabel('order.created')
        .check()
      await page.getByRole('button', { name: 'Create Webhook' }).last().click()

      await expect(page.getByText('https://example.com/e2e-webhook')).toBeVisible()
      await expect(page.getByText(/Manage your webhook subscriptions/i)).toBeVisible()
    })
  })
})
