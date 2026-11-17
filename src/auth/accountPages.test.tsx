import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ForgotPasswordPage from './ForgotPasswordPage'
import ResetPasswordPage from './ResetPasswordPage'
import SignUpPage from './SignUpPage'

const signIn = vi.hoisted(() => vi.fn())
vi.mock('@/auth/auth', () => ({ signIn, getAccessToken: () => undefined }))

const problem = (status: number, detail: string) =>
  new Response(JSON.stringify({ detail }), { status, headers: { 'Content-Type': 'application/problem+json' } })

describe('account pages', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    signIn.mockReset()
    vi.stubGlobal('fetch', fetchMock)
    window.__CONFIG__ = { apiUrl: 'http://edge.test' } // Request needs an absolute URL under jsdom
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    window.history.replaceState({}, '', '/')
    delete window.__CONFIG__
  })

  async function lastRequestBody() {
    const request = fetchMock.mock.calls.at(-1)![0] as Request
    return { url: new URL(request.url).pathname, body: await request.json() }
  }

  describe('sign up', () => {
    it('creates the account, then signs in with the same credentials', async () => {
      fetchMock.mockResolvedValue(new Response(null, { status: 201 }))
      render(<SignUpPage />)
      const user = userEvent.setup()
      await user.type(screen.getByLabelText('Your name'), 'Dana Okafor')
      await user.type(screen.getByLabelText('Email'), 'dana@example.test')
      await user.type(screen.getByLabelText('Password'), 'a long enough password')
      await user.click(screen.getByRole('button', { name: 'Create account' }))
      await waitFor(() => expect(signIn).toHaveBeenCalledWith('dana@example.test', 'a long enough password'))
      expect(await lastRequestBody()).toEqual({
        url: '/api/v1/accounts/sign-up',
        body: { name: 'Dana Okafor', email: 'dana@example.test', password: 'a long enough password' },
      })
    })

    it('keeps the button disabled until the password is long enough', async () => {
      render(<SignUpPage />)
      const user = userEvent.setup()
      await user.type(screen.getByLabelText('Your name'), 'Dana')
      await user.type(screen.getByLabelText('Email'), 'dana@example.test')
      await user.type(screen.getByLabelText('Password'), 'short')
      expect(screen.getByRole('button', { name: 'Create account' })).toBeDisabled()
    })

    it('shows the backend message when the email is taken and does not sign in', async () => {
      fetchMock.mockResolvedValue(problem(409, 'An account with this email already exists.'))
      render(<SignUpPage />)
      const user = userEvent.setup()
      await user.type(screen.getByLabelText('Your name'), 'Dana')
      await user.type(screen.getByLabelText('Email'), 'dana@example.test')
      await user.type(screen.getByLabelText('Password'), 'a long enough password')
      await user.click(screen.getByRole('button', { name: 'Create account' }))
      expect(await screen.findByRole('alert')).toHaveTextContent('An account with this email already exists.')
      expect(signIn).not.toHaveBeenCalled()
    })
  })

  describe('forgot password', () => {
    it('confirms without revealing whether the account exists', async () => {
      fetchMock.mockResolvedValue(new Response(null, { status: 202 }))
      render(<ForgotPasswordPage />)
      const user = userEvent.setup()
      await user.type(screen.getByLabelText('Email'), 'dana@example.test')
      await user.click(screen.getByRole('button', { name: 'Send reset link' }))
      expect(await screen.findByRole('status')).toHaveTextContent('If an account exists for dana@example.test')
      expect((await lastRequestBody()).url).toBe('/api/v1/accounts/password-reset/request')
    })

    it('explains rate limiting', async () => {
      fetchMock.mockResolvedValue(new Response(null, { status: 429 }))
      render(<ForgotPasswordPage />)
      const user = userEvent.setup()
      await user.type(screen.getByLabelText('Email'), 'dana@example.test')
      await user.click(screen.getByRole('button', { name: 'Send reset link' }))
      expect(await screen.findByRole('alert')).toHaveTextContent('Too many attempts')
    })
  })

  describe('reset password', () => {
    it('sends the token from the link, then removes it from the address bar', async () => {
      window.history.replaceState({}, '', '/reset-password?token=abc123')
      fetchMock.mockResolvedValue(new Response(null, { status: 204 }))
      render(<ResetPasswordPage />)
      expect(window.location.search).toBe('')
      const user = userEvent.setup()
      await user.type(screen.getByLabelText('New password'), 'a brand new passphrase')
      await user.click(screen.getByRole('button', { name: 'Change password' }))
      expect(await screen.findByRole('status')).toHaveTextContent('Your password has been changed')
      expect(await lastRequestBody()).toEqual({
        url: '/api/v1/accounts/password-reset/confirm',
        body: { token: 'abc123', newPassword: 'a brand new passphrase' },
      })
    })

    it('offers a new link when the token is missing or rejected', async () => {
      render(<ResetPasswordPage />)
      expect(screen.getByRole('alert')).toHaveTextContent('incomplete')
    })

    it('shows the backend message for an expired link', async () => {
      window.history.replaceState({}, '', '/reset-password?token=old')
      fetchMock.mockResolvedValue(problem(400, 'This reset link is invalid or has expired.'))
      render(<ResetPasswordPage />)
      const user = userEvent.setup()
      await user.type(screen.getByLabelText('New password'), 'a brand new passphrase')
      await user.click(screen.getByRole('button', { name: 'Change password' }))
      expect(await screen.findByRole('alert')).toHaveTextContent('invalid or has expired')
    })
  })
})
