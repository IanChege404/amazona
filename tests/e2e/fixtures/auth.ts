import { expect, Page } from '@playwright/test'
import path from 'path'

export const E2E_USERS = {
  admin: { email: 'admin@example.com', password: '123456' },
  vendor: { email: 'vendor@example.com', password: '123456' },
  user: { email: 'user@example.com', password: '123456' },
} as const

export const STORAGE_STATES = {
  user: path.resolve(process.cwd(), 'storage/user.json'),
  vendor: path.resolve(process.cwd(), 'storage/vendor.json'),
  admin: path.resolve(process.cwd(), 'storage/admin.json'),
} as const

async function loginWithCredentials(
  page: Page,
  credentials: { email: string; password: string }
) {
  await page.goto('/sign-in')
  await expect(page.getByLabel('Email')).toBeVisible()
  await expect(page.getByLabel('Password')).toBeVisible()

  await page.getByLabel('Email').fill(credentials.email)
  await page.getByLabel('Password').fill(credentials.password)
  await page.getByRole('button', { name: 'Sign In', exact: true }).click()

  await page.waitForURL((url) => !url.pathname.includes('/sign-in'))
}

export async function loginAsUser(page: Page) {
  await loginWithCredentials(page, E2E_USERS.user)
}

export async function loginAsVendor(page: Page) {
  await loginWithCredentials(page, E2E_USERS.vendor)
}

export async function loginAsAdmin(page: Page) {
  await loginWithCredentials(page, E2E_USERS.admin)
}

export async function logout(page: Page) {
  await page.context().clearCookies()
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
  await page.goto('/')
}
