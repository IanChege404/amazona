# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: guest.spec.ts >> Guest storefront flows >> guest can add, update and remove cart item
- Location: tests/e2e/guest.spec.ts:31:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: /Quantity:/i }).first()

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - banner [ref=e4]:
      - generic [ref=e6]:
        - link "NxtAmzn logo NxtAmzn" [ref=e8] [cursor=pointer]:
          - /url: /
          - img "NxtAmzn logo" [ref=e9]
          - text: NxtAmzn
        - generic [ref=e11]:
          - combobox [ref=e12] [cursor=pointer]:
            - generic: All
            - img [ref=e13]
          - combobox [ref=e15]
          - searchbox "Search NxtAmzn" [ref=e16]
          - button [ref=e17] [cursor=pointer]:
            - img [ref=e18]
        - navigation [ref=e22]:
          - button "🇺🇸 EN" [ref=e23] [cursor=pointer]:
            - generic [ref=e24]:
              - generic [ref=e25]: 🇺🇸
              - text: EN
              - img [ref=e26]
          - button "Light" [ref=e28] [cursor=pointer]:
            - generic [ref=e29]:
              - img [ref=e30]
              - text: Light
              - img [ref=e36]
          - generic [ref=e39] [cursor=pointer]:
            - generic [ref=e40]:
              - generic [ref=e41]: Hello, sign in
              - generic [ref=e42]: Account & Orders
            - img [ref=e43]
          - link "1 Cart" [ref=e45] [cursor=pointer]:
            - /url: /cart
            - generic [ref=e46]:
              - img [ref=e47]
              - generic [ref=e51]: "1"
              - generic [ref=e52]: Cart
      - button "All" [ref=e54] [cursor=pointer]:
        - img [ref=e55]
        - text: All
    - main [ref=e56]:
      - generic [ref=e57]:
        - generic [ref=e58]:
          - generic [ref=e60]:
            - generic [ref=e61]: Shopping Cart
            - generic [ref=e62]:
              - generic [ref=e63]: Price
              - generic [ref=e64]:
                - link "E2E Stripe Tee" [ref=e65] [cursor=pointer]:
                  - /url: /product/e2e-stripe-tee
                  - img "E2E Stripe Tee" [ref=e67]
                - generic [ref=e68]:
                  - link "E2E Stripe Tee" [ref=e69] [cursor=pointer]:
                    - /url: /product/e2e-stripe-tee
                  - generic [ref=e70]:
                    - paragraph [ref=e71]:
                      - generic [ref=e72]: "Color:"
                      - text: Black
                    - paragraph [ref=e73]:
                      - generic [ref=e74]: "Size:"
                      - text: M
                  - generic [ref=e75]:
                    - combobox [ref=e76] [cursor=pointer]:
                      - generic: "Quantity: 1"
                      - img [ref=e77]
                    - button "Delete" [ref=e79] [cursor=pointer]
                - paragraph [ref=e81]: KES 49.99
              - generic [ref=e82]:
                - text: "Subtotal (1 Items):"
                - generic [ref=e83]: KES 49.99
          - generic [ref=e86]:
            - generic [ref=e87]: Your order qualifies for FREE Shipping. Choose this option at checkout.
            - generic [ref=e88]: "Subtotal (1 items): KES 49.99"
            - button "Proceed to Checkout" [ref=e89] [cursor=pointer]
        - generic [ref=e90]:
          - generic [ref=e91]:
            - heading "Related to items that you've viewed" [level=2] [ref=e92]
            - region [ref=e93]:
              - group [ref=e96]:
                - generic [ref=e97]:
                  - link "E2E Vendor Hoodie" [ref=e98] [cursor=pointer]:
                    - /url: /product/e2e-vendor-hoodie
                    - img "E2E Vendor Hoodie" [ref=e101]
                  - generic [ref=e103]:
                    - paragraph [ref=e104]: E2E Brand
                    - link "E2E Vendor Hoodie" [ref=e105] [cursor=pointer]:
                      - /url: /product/e2e-vendor-hoodie
                    - generic [ref=e106]:
                      - 'generic "Rating: 4.2 out of 5 stars" [ref=e107]':
                        - img [ref=e108]
                        - img [ref=e110]
                        - img [ref=e112]
                        - img [ref=e114]
                        - generic [ref=e116]:
                          - img [ref=e117]
                          - img [ref=e120]
                      - generic [ref=e122]: (2)
                    - generic [ref=e123]:
                      - generic [ref=e124]:
                        - generic [ref=e125]: "-18%"
                        - generic [ref=e126]: KSh8999
                      - generic [ref=e127]: "List price: KES 109.99"
              - button "Previous slide" [disabled]:
                - img
                - generic: Previous slide
              - button "Next slide" [disabled]:
                - img
                - generic: Next slide
          - generic [ref=e128]:
            - heading "Your browsing history" [level=2] [ref=e129]
            - region [ref=e130]:
              - group [ref=e133]:
                - link "E2E Stripe Tee" [ref=e135] [cursor=pointer]:
                  - /url: /product/e2e-stripe-tee
                  - img "E2E Stripe Tee" [ref=e138]
              - button "Previous slide" [disabled]:
                - img
                - generic: Previous slide
              - button "Next slide" [disabled]:
                - img
                - generic: Next slide
    - contentinfo [ref=e139]:
      - generic [ref=e140]:
        - button "Back to top" [ref=e141] [cursor=pointer]:
          - img
          - text: Back to top
        - generic [ref=e145]:
          - img "NxtAmzn logo" [ref=e146]
          - combobox [ref=e147] [cursor=pointer]:
            - generic:
              - link "🇺🇸 English":
                - /url: /cart
                - generic: 🇺🇸
                - text: English
            - img [ref=e148]
          - combobox [ref=e150] [cursor=pointer]:
            - generic: Kenyan Shilling (KES)
            - img [ref=e151]
      - generic [ref=e153]:
        - generic [ref=e154]:
          - link "Conditions of Use" [ref=e155] [cursor=pointer]:
            - /url: /page/conditions-of-use
          - link "Privacy Notice" [ref=e156] [cursor=pointer]:
            - /url: /page/privacy-policy
          - link "Help" [ref=e157] [cursor=pointer]:
            - /url: /page/help
        - paragraph [ref=e159]: © 2000-2024, Next-Ecommerce.com, Inc. or its affiliates
        - generic [ref=e160]: Westlands, Nairobi, Kenya | +254 700 000000 | admin@example.com
  - region "Notifications (F8)":
    - list
  - generic [ref=e163] [cursor=pointer]:
    - img [ref=e164]
    - generic [ref=e166]: 2 errors
    - button "Hide Errors" [ref=e167]:
      - img [ref=e168]
  - alert [ref=e171]
```

# Test source

```ts
  1  | import { test, expect } from './fixtures/e2e'
  2  | import { E2E_PRODUCTS, E2E_VENDOR_SLUG } from './fixtures/test-data'
  3  | 
  4  | test.describe('Guest storefront flows', () => {
  5  |   test('home loads and product list renders', async ({ page }) => {
  6  |     await page.goto('/')
  7  | 
  8  |     await expect(page.getByRole('searchbox')).toBeVisible()
  9  |     await expect(page.getByTestId('product-card').first()).toBeVisible()
  10 |   })
  11 | 
  12 |   test('search returns deterministic results', async ({ page }) => {
  13 |     await page.goto('/')
  14 | 
  15 |     await page.getByRole('searchbox').fill('E2E')
  16 |     await page.getByRole('searchbox').press('Enter')
  17 | 
  18 |     await expect(page).toHaveURL(/\/search/)
  19 |     await expect(page.getByTestId('product-card').first()).toBeVisible()
  20 |   })
  21 | 
  22 |   test('product details page renders', async ({ page }) => {
  23 |     await page.goto(`/product/${E2E_PRODUCTS.stripe}`)
  24 | 
  25 |     await expect(
  26 |       page.getByRole('heading', { name: 'E2E Stripe Tee' })
  27 |     ).toBeVisible()
  28 |     await expect(page.getByRole('button', { name: 'Add to Cart' })).toBeVisible()
  29 |   })
  30 | 
  31 |   test('guest can add, update and remove cart item', async ({ page }) => {
  32 |     await page.goto(`/product/${E2E_PRODUCTS.stripe}`)
  33 |     await page.getByRole('button', { name: 'Add to Cart' }).click()
  34 | 
  35 |     await expect(page).toHaveURL(/\/cart\//)
  36 |     await page.goto('/cart')
  37 | 
  38 |     await expect(page.getByText(/Shopping Cart/i).first()).toBeVisible()
  39 | 
> 40 |     await page.getByRole('button', { name: /Quantity:/i }).first().click()
     |                                                                    ^ Error: locator.click: Test timeout of 30000ms exceeded.
  41 |     await page.getByRole('option', { name: '2', exact: true }).click()
  42 | 
  43 |     await expect(page.getByText(/Subtotal \(2 (items|Items)\)/)).toBeVisible()
  44 | 
  45 |     await page.getByRole('button', { name: 'Delete' }).first().click()
  46 |     await expect(page.getByText(/Your Shopping Cart is empty/i)).toBeVisible()
  47 |   })
  48 | 
  49 |   test('guest can open public vendor storefront', async ({ page }) => {
  50 |     await page.goto(`/store/${E2E_VENDOR_SLUG}`)
  51 | 
  52 |     await expect(page.getByRole('heading', { name: 'E2E Vendor Store' })).toBeVisible()
  53 |   })
  54 | })
  55 | 
```