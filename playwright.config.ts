import { defineConfig } from '@playwright/test'

// End-to-end tests against a running workbench (docker compose up).
// E2E_AUDIO: path to a 16-bit PCM WAV that Chromium plays as the microphone.
const audio = process.env.E2E_AUDIO

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:8080',
    permissions: ['microphone'],
    launchOptions: {
      args: [
        '--use-fake-ui-for-media-stream',
        ...(audio ? ['--use-fake-device-for-media-stream', `--use-file-for-fake-audio-capture=${audio}`] : []),
      ],
    },
  },
})
