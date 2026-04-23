import { test as base, expect } from '@playwright/test'
import {
  loginAsAdmin,
  loginAsUser,
  loginAsVendor,
  logout,
} from './auth'

type AuthFixtures = {
  auth: {
    loginAsUser: () => Promise<void>
    loginAsVendor: () => Promise<void>
    loginAsAdmin: () => Promise<void>
    logout: () => Promise<void>
  }
}

export const test = base.extend<AuthFixtures>({
  auth: async ({ page }, use) => {
    await use({
      loginAsUser: () => loginAsUser(page),
      loginAsVendor: () => loginAsVendor(page),
      loginAsAdmin: () => loginAsAdmin(page),
      logout: () => logout(page),
    })
  },
})

export { expect }
