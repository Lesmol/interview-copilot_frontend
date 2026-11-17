import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import App from './App'

vi.mock('@/auth/auth', () => ({
  completeSignInIfRedirected: vi.fn().mockResolvedValue(null),
  signIn: vi.fn(),
  signOut: vi.fn(),
  getAccessToken: vi.fn(),
}))

describe('App', () => {
  it('offers sign in when there is no session', async () => {
    render(<App />)
    expect(await screen.findByRole('button', { name: 'Sign in' })).toBeInTheDocument()
  })
})
