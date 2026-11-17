import { expect, test } from '@playwright/test'

test('signs in through Keycloak and reaches the backend whoami', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.locator('#username').fill(process.env.E2E_USER ?? 'journalist')
  await page.locator('#password').fill(process.env.E2E_PASSWORD ?? '')
  await page.locator('#kc-login').click()
  await expect(page.getByTestId('user-id')).toBeVisible()
})
