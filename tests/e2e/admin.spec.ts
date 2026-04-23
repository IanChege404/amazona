import { test, expect } from './fixtures/e2e'
import { STORAGE_STATES } from './fixtures/auth'

test.describe('Admin flows', () => {
  test.use({ storageState: STORAGE_STATES.admin })

  test('admin can access dashboard and core admin pages', async ({ page }) => {
    await page.goto('/admin/dashboard')
    await expect(page).toHaveURL(/\/admin\/(dashboard|overview)/)
    await expect(page.getByRole('heading', { name: /Dashboard/i })).toBeVisible()

    await page.goto('/admin/products')
    await expect(page.getByRole('heading', { name: 'Products' })).toBeVisible()

    await page.goto('/admin/orders')
    await expect(page.getByRole('heading', { name: 'Orders' })).toBeVisible()

    await page.goto('/admin/users')
    await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible()
  })
})
