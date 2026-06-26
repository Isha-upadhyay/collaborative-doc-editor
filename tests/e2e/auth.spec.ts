import { test, expect } from '@playwright/test'

test.describe('Authentication and Document Access', () => {
  test('unauthenticated users are redirected to sign-in', async ({ page }) => {
    await page.goto('/')
    // Basic check that we are not allowing unauthorized access
    // This assumes your middleware or page logic redirects or shows Auth buttons
    await expect(page).toHaveURL(/.*sign-in/)
  })
})
