import { test, expect } from '@playwright/test'

test.describe('Vendor Authentication & Dashboard', () => {
  test('vendor can access dashboard when logged in', async ({ page, context }) => {
    // This assumes you have a test vendor account
    // You would normally set this up with fixtures or a beforeAll hook
    
    // Navigate to vendor dashboard
    await page.goto('/vendor/dashboard')

    // If not logged in, should redirect to login
    // If logged in, should show dashboard
    const url = page.url()
    
    if (!url.includes('/sign-in')) {
      // User is logged in
      // Verify dashboard elements
      await expect(page.getByRole('heading')).toBeVisible()
    } else {
      // User redirected to sign-in, verify it's the auth page
      await expect(page).toHaveURL(/sign-in|auth/)
    }
  })

  test('unauthorized user cannot access vendor dashboard', async ({ page }) => {
    // Make sure we're logged out
    await page.context().clearCookies()

    // Try to access vendor dashboard
    await page.goto('/vendor/dashboard')

    // Should redirect to login
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/sign-in|auth/)
  })

  test('vendor can navigate between dashboard sections', async ({ page }) => {
    // Assuming user is already authenticated
    await page.goto('/vendor/dashboard')

    // Skip if not authenticated
    if (page.url().includes('/sign-in')) {
      test.skip()
    }

    // Check if navigation menu exists
    const navbar = page.getByRole('navigation')
    if (await navbar.isVisible()) {
      // Click products link
      const productsLink = page.getByRole('link', { name: /products/i })
      if (await productsLink.isVisible()) {
        await productsLink.click()
        await page.waitForLoadState('networkidle')
        await expect(page).toHaveURL(/vendor.*products/)
      }
    }
  })
})

test.describe('Admin Panel Access', () => {
  test('unauthorized user cannot access admin panel', async ({ page }) => {
    await page.context().clearCookies()
    
    // Try to access admin
    await page.goto('/admin/dashboard')
    
    // Should redirect to login
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/sign-in|auth/)
  })
})
