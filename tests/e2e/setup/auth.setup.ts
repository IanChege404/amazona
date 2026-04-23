import { test } from '@playwright/test'
import {
  loginAsAdmin,
  loginAsUser,
  loginAsVendor,
  STORAGE_STATES,
} from '../fixtures/auth'

test('authenticate regular user', async ({ page }) => {
  await loginAsUser(page)
  await page.context().storageState({ path: STORAGE_STATES.user })
})

test('authenticate vendor user', async ({ page }) => {
  await loginAsVendor(page)
  await page.context().storageState({ path: STORAGE_STATES.vendor })
})

test('authenticate admin user', async ({ page }) => {
  await loginAsAdmin(page)
  await page.context().storageState({ path: STORAGE_STATES.admin })
})
