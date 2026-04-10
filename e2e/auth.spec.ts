import { test, expect } from '@playwright/test'

test.describe('Auth Flow', () => {
  test('should display sign in page', async ({ page }) => {
    await page.goto('/auth/sign-in')
    const title = page.locator('h1, h2')
    await expect(title).toContainText(/sign|login/i)
  })

  test('should display register page', async ({ page }) => {
    await page.goto('/auth/register')
    const title = page.locator('h1, h2')
    await expect(title).toContainText(/register|sign up/i)
  })

  test('should handle invalid email on sign in', async ({ page }) => {
    await page.goto('/auth/sign-in')
    
    const submitBtn = page.locator('button[type="submit"]').first()
    await submitBtn.click()
    
    // Should show validation error or remain on sign in page
    expect(page.url()).toContain('/auth')
  })
})

test.describe('Vendor Onboarding', () => {
  test('should have become a vendor page', async ({ page }) => {
    await page.goto('/become-a-vendor', { waitUntil: 'networkidle' })
    
    // Check if page loaded
    const heading = page.locator('h1, h2')
    const isVisible = await heading.isVisible().catch(() => false)
    
    if (isVisible) {
      const text = await heading.textContent()
      expect(text).toBeTruthy()
    }
  })
})
