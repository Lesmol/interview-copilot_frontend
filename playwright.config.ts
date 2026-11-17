import { defineConfig } from '@playwright/test'

// End-to-end smoke test against a running workbench (docker compose up).
export default defineConfig({
  testDir: './e2e',
  use: { baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:8080' },
})
