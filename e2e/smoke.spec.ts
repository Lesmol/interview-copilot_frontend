import { expect, test, type Page } from '@playwright/test'

async function signIn(page: Page) {
  await page.goto('/')
  await page.getByLabel('Email or username').fill(process.env.E2E_USER ?? 'journalist')
  await page.getByLabel('Password', { exact: true }).fill(process.env.E2E_PASSWORD ?? '')
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

test('sign up, sign out, then reset the password from the emailed link', async ({ page, request }) => {
  const mailpit = process.env.E2E_MAILPIT_URL ?? 'http://localhost:8025'
  const email = `e2e-${Date.now()}@example.test`
  const first = `first-${Date.now()}-passphrase`
  const second = `second-${Date.now()}-passphrase`

  await page.goto('/')
  await page.getByRole('link', { name: 'Create an account' }).click()
  await page.getByLabel('Your name').fill('E2E Tester')
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByLabel('Password', { exact: true }).fill(first)
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page.getByTestId('user-id')).toBeVisible()
  await page.getByRole('button', { name: 'Sign out' }).click()

  await page.getByRole('link', { name: 'Forgot your password?' }).click()
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByRole('button', { name: 'Send reset link' }).click()
  await expect(page.getByRole('status')).toContainText('reset link is on its way')

  let link = ''
  await expect(async () => {
    const found = await (await request.get(`${mailpit}/api/v1/search?query=to:${email}`)).json()
    expect(found.messages.length).toBeGreaterThan(0)
    const message = await (await request.get(`${mailpit}/api/v1/message/${found.messages[0].ID}`)).json()
    link = /https?:\/\/\S+reset-password\?token=[\w-]+/.exec(message.Text)![0]
  }).toPass({ timeout: 20_000 })

  await page.goto(link)
  await page.getByLabel('New password', { exact: true }).fill(second)
  await page.getByRole('button', { name: 'Change password' }).click()
  await expect(page.getByRole('status')).toContainText('Your password has been changed')

  await page.getByRole('link', { name: 'Back to sign in' }).click()
  await page.getByLabel('Email or username').fill(email)
  await page.getByLabel('Password', { exact: true }).fill(second)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByTestId('user-id')).toBeVisible()
})
