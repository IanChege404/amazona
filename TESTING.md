# Testing Guide

This project uses **Vitest** for unit testing and **Playwright** for end-to-end (E2E) testing.

## Running Tests

### Unit Tests

```bash
# Run all unit tests
npm run test

# Run tests in watch mode (rerun on file changes)
npm run test -- --watch

# Run tests with UI dashboard
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### End-to-End Tests

```bash
# Run all E2E tests
npm run e2e

# Run tests in UI mode (visual interface)
npm run e2e:ui

# Debug tests step-by-step
npm run e2e:debug

# Run specific test file
npm run e2e -- tests/e2e/shopper.spec.ts

# Run tests in specific browser
npm run e2e -- --project=chromium
```

## Test Structure

```
tests/
├── unit/
│   ├── utils.test.ts          # Utility function tests
│   └── vendor.test.ts         # Vendor logic tests
└── e2e/
    ├── shopper.spec.ts        # Customer shopping flow
    └── auth.spec.ts           # Authentication flows
```

## Unit Tests

Unit tests verify individual functions and utilities in isolation.

### What to Test
- **Utility functions** (round2, slug generation, calculation logic)
- **Validation functions** (Zod schemas, input validation)
- **Payment calculations** (platform fee, tier limits)
- **Data transformations** (filtering, mapping, aggregation)

### Example
```typescript
import { describe, it, expect } from 'vitest'
import { round2 } from '@/lib/utils'

describe('round2()', () => {
  it('rounds to 2 decimal places', () => {
    expect(round2(10.567)).toBe(10.57)
  })
})
```

## E2E Tests

E2E tests verify complete user workflows across the entire application.

### Key Testing Scenarios

#### Shopper Flow
- [ ] Search for products
- [ ] View product details
- [ ] Add to cart
- [ ] Proceed to checkout
- [ ] Complete payment

#### Vendor Flow
- [ ] Apply to become vendor
- [ ] Receive approval
- [ ] Access dashboard
- [ ] Create product
- [ ] View analytics

#### Admin Flow
- [ ] Review vendor applications
- [ ] Approve/suspend vendors
- [ ] View platform analytics
- [ ] Manage webhook events

### Example
```typescript
import { test, expect } from '@playwright/test'

test('can add product to cart', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('article').first().click()
  await page.getByRole('button', { name: /add to cart/i }).click()
  await page.waitForTimeout(500)
})
```

## Best Practices

### Unit Tests
1. **Keep tests focused** — test one thing per `it()` block
2. **Use descriptive names** — `it('rounds 10.567 to 10.57')`
3. **Arrange-Act-Assert** — setup data, perform action, verify result
4. **Test edge cases** — zero, negative, extreme values

### E2E Tests
1. **Focus on user journeys** — not implementation details
2. **Use semantic queries** — `getByRole('button')` not `getByTestId()`
3. **Wait for stability** — use `waitForLoadState('networkidle')`
4. **Keep tests independent** — run in any order
5. **Avoid hard waits** — use proper wait conditions

## CI/CD Integration

Tests run automatically on:
- Pull requests
- Commits to main branch
- Pre-deployment validation

Failed tests block merges.

## Coverage Goals

| Category | Target |
|----------|--------|
| Critical business logic | >90% |
| Utilities | >85% |
| UI Components | >70% |
| Overall | >75% |

Check coverage report:
```bash
npm run test:coverage
# Open coverage/index.html in browser
```

## Debugging

### Vitest Debugging
```bash
# Run single test file
npm run test tests/unit/utils.test.ts

# Use VS Code debugger
node --inspect-brk ./node_modules/.bin/vitest
```

### Playwright Debugging
```bash
# Open inspector
npm run e2e:debug

# Generate trace for failure analysis
npm run e2e -- --trace on
```

## Writing Better Tests

### ❌ Bad Test
```typescript
it('works', async ({ page }) => {
  await page.goto('/')
  await page.click('button')
  await page.waitForTimeout(1000)
})
```

### ✅ Good Test
```typescript
it('can add product to cart from homepage', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('article').first().click()
  await page.getByRole('button', { name: /add to cart/i }).click()
  await expect(page.getByText(/item added/i)).toBeVisible()
})
```

## Resources

- [Vitest Documentation](https://vitest.dev)
- [Playwright Testing Guide](https://playwright.dev/docs/intro)
- [Testing Best Practices](https://playwright.dev/docs/best-practices)
