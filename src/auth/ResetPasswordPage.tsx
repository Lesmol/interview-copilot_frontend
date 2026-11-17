import { useState, type FormEvent } from 'react'
import { createApiClient } from '@/api/client'
import { problemMessage } from '@/api/problem'
import AuthLayout, { Field } from '@/auth/AuthLayout'
import { MIN_PASSWORD_LENGTH } from '@/auth/SignUpPage'
import { Button } from '@/components/ui/button'
import { Link } from '@/routing'

export default function ResetPasswordPage() {
  // Read once, then take the token out of the address bar and history.
  const [token] = useState(() => {
    const value = new URLSearchParams(window.location.search).get('token') ?? ''
    if (value) window.history.replaceState({}, '', window.location.pathname)
    return value
  })
  const [password, setPassword] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError(undefined)
    setBusy(true)
    try {
      const { error: apiError, response } = await createApiClient().POST('/api/v1/accounts/password-reset/confirm', {
        body: { token, newPassword: password },
      })
      if (response.ok) setDone(true)
      else setError(problemMessage(apiError, 'We could not change your password. Please try again.'))
    } catch {
      setError('We could not reach the service. Check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout title="Choose a new password">
      <div className="space-y-4 rounded-lg border bg-card p-6">
        {done ? (
          <p role="status">Your password has been changed. You can sign in with it now.</p>
        ) : !token ? (
          <p role="alert" className="text-destructive">
            This reset link is incomplete.{' '}
            <Link to="/forgot-password" className="underline">
              Ask for a new one
            </Link>
            .
          </p>
        ) : (
          <form onSubmit={(e) => void submit(e)} className="space-y-4" aria-label="Choose a new password">
            <Field label="New password" name="newPassword" type="password" autoComplete="new-password" required
              autoFocus minLength={MIN_PASSWORD_LENGTH} hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
              value={password} onChange={(e) => setPassword(e.target.value)} />
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}{' '}
                <Link to="/forgot-password" className="underline">
                  Ask for a new link
                </Link>
              </p>
            )}
            <Button type="submit" className="w-full" disabled={busy || password.length < MIN_PASSWORD_LENGTH}>
              {busy ? 'Saving…' : 'Change password'}
            </Button>
          </form>
        )}
        <p className="text-sm">
          <Link to="/" className="text-primary underline-offset-4 hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
