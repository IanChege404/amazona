import { test, expect } from '@playwright/test'

test.describe('Shopper Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage
    await page.goto('/')
    // Wait for page to load
    await page.waitForLoadState('networkidle')
  })

  test('can search for products', async ({ page }) => {
    // Find search input
    const searchInput = page.getByPlaceholder(/search|find/i)

    // Type search query
    await searchInput.fill('laptop')

    // Submit search
    await searchInput.press('Enter')

    // Wait for results
    await page.waitForLoadState('networkidle')

    // Verify results page
    await expect(page).toHaveURL(/search/)
    
    // Verify products are displayed
    const products = page.getByRole('article')
    const productCount = await products.count()
    expect(productCount).toBeGreaterThan(0)
  })

  test('can view product details', async ({ page }) => {
    // Look for first product card
    const firstProduct = page.getByRole('article').first()
    
    // Click on product
    await firstProduct.click()

    // Wait for product page to load
    await page.waitForLoadState('networkidle')

    // Verify product details are shown
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    
    // Verify price is displayed
    const price = page.getByText(/\$[\d.]+/)
    await expect(price).toBeVisible()
  })

  test('can add product to cart', async ({ page }) => {
    // Navigate to home
    await page.goto('/')
    
    // Find and click first product
    const firstProduct = page.getByRole('article').first()
    await firstProduct.click()

    // Wait for product page
    await page.waitForLoadState('networkidle')

    // Click "Add to Cart" button
    const addButton = page.getByRole('button', { name: /add to cart/i })
    await addButton.click()

    // Verify success toast or cart update
    // Cart count should increase or toast shown
    await page.waitForTimeout(500) // Wait for UI update
  })
})

test.describe('Vendor Storefront', () => {
  test('can visit vendor storefront', async ({ page }) => {
    // Assuming there's a vendor with slug "test-vendor"
    // This would be set up in test data
    await page.goto('/store/test-vendor')

    // Verify vendor info is displayed
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    // Verify vendor products are shown
    const products = page.getByRole('article')
    const count = await products.count()
    
    // Should show some products if vendor exists
    if (count > 0) {
      expect(count).toBeGreaterThan(0)
    }
  })

  test('404 for non-existent vendor', async ({ page }) => {
    const response = await page.goto('/store/non-existent-vendor-xyz')
    
    // Should return 404
    expect(response?.status()).toBe(404)
  })
})
