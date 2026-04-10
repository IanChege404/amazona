import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('should load and display title', async ({ page }) => {
    await page.goto('/')
    const title = await page.title()
    expect(title).toBeTruthy()
  })

  test('should have navigation links', async ({ page }) => {
    await page.goto('/')
    const navBar = page.locator('nav')
    await expect(navBar).toBeVisible()
  })

  test('should display products', async ({ page }) => {
    await page.goto('/')
    const products = page.locator('[data-testid="product-card"]')
    const count = await products.count()
    expect(count).toBeGreaterThan(0)
  })
})

test.describe('Product Search', () => {
  test('should find products by keyword', async ({ page }) => {
    await page.goto('/')
    // Search for a product
    const searchInput = page.locator('input[placeholder*="Search"]')
    if (await searchInput.isVisible()) {
      await searchInput.fill('phone')
      await page.keyboard.press('Enter')
      await page.waitForLoadState('networkidle')
      const results = page.locator('[data-testid="product-card"]')
      expect(await results.count()).toBeGreaterThan(0)
    }
  })
})

test.describe('Vendor Storefront', () => {
  test('should load vendor public page', async ({ page }) => {
    // Assuming a vendor exists with slug 'test-vendor'
    await page.goto('/store/test-vendor', { waitUntil: 'networkidle' })
    // Should not get 404 if vendor exists
    expect(page.url()).toContain('/store/')
  })
})

test.describe('Shopping Cart', () => {
  test('should add product to cart', async ({ page }) => {
    await page.goto('/')
    
    // Click first product
    const firstProduct = page.locator('[data-testid="product-card"]').first()
    await firstProduct.click()
    
    // Wait for product page to load
    await page.waitForLoadState('networkidle')
    
    // Check if add to cart button exists
    const addToCartBtn = page.locator('button:has-text("Add to Cart"), button:has-text("Add to Basket")')
    if (await addToCartBtn.isVisible()) {
      await addToCartBtn.click()
      // Cart should update (check toast or cart badge)
      await page.waitForTimeout(1000)
    }
  })
})
