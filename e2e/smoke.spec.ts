import { expect, test, type Page } from '@playwright/test'

async function signIn(page: Page) {
  await page.goto('/')
  await page.getByLabel('Email or username').fill(process.env.E2E_USER ?? 'journalist')
  await page.getByLabel('Password').fill(process.env.E2E_PASSWORD ?? '')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByTestId('user-id')).toBeVisible()
}

test('signs in on our own page and reaches the backend whoami', async ({ page }) => {
  await signIn(page)
})

test('live transcript: spoken audio becomes partial and final text', async ({ page }) => {
  test.skip(!process.env.E2E_AUDIO, 'set E2E_AUDIO to a WAV file to run this test')
  const timings: string[] = []
  page.on('console', (m) => m.text().startsWith('[timing]') && timings.push(m.text()))
  await signIn(page)
  await page.getByRole('button', { name: 'Start live transcript' }).click()
  await expect(page.getByText('Listening')).toBeVisible({ timeout: 20_000 })
  await expect(page.getByTestId('transcript')).toContainText(/housing/i, { timeout: 30_000 })
  await page.getByRole('button', { name: 'Stop' }).click()
  console.log(timings.join('\n'))
})
