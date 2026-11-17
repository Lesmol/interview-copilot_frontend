import { useState, type FormEvent } from 'react'
import { createApiClient } from '@/api/client'
import AuthLayout, { Field } from '@/auth/AuthLayout'
import { Button } from '@/components/ui/button'
import { Link } from '@/routing'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError(undefined)
    setBusy(true)
    try {
      const { response } = await createApiClient().POST('/api/v1/accounts/password-reset/request', {
        body: { email: email.trim() },
      })
      if (response.status === 429) setError('Too many attempts. Please wait a minute and try again.')
      else if (!response.ok) setError('We could not send the email. Please try again.')
      else setSent(true)
    } catch {
      setError('We could not reach the service. Check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout title="Reset your password" intro="Enter your email and we will send you a link to choose a new password.">
      <div className="space-y-4 rounded-lg border bg-card p-6">
        {sent ? (
          <p role="status">
            If an account exists for <strong>{email.trim()}</strong>, a reset link is on its way. It works once and
            expires in 30 minutes.
          </p>
        ) : (
          <form onSubmit={(e) => void submit(e)} className="space-y-4" aria-label="Request password reset">
            <Field label="Email" name="email" type="email" autoComplete="email" required autoFocus
              value={email} onChange={(e) => setEmail(e.target.value)} />
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={busy || !email.trim()}>
              {busy ? 'Sending…' : 'Send reset link'}
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
