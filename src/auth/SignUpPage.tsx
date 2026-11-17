import { useState, type FormEvent } from 'react'
import { createApiClient } from '@/api/client'
import { problemMessage } from '@/api/problem'
import AuthLayout, { Field } from '@/auth/AuthLayout'
import { signIn } from '@/auth/auth'
import { Button } from '@/components/ui/button'
import { Link, navigate } from '@/routing'

export const MIN_PASSWORD_LENGTH = 10

export default function SignUpPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError(undefined)
    setBusy(true)
    try {
      const { error: apiError, response } = await createApiClient().POST('/api/v1/accounts/sign-up', {
        body: { name: name.trim(), email: email.trim(), password },
      })
      if (!response.ok) {
        setError(
          response.status === 429
            ? 'Too many attempts. Please wait a minute and try again.'
            : problemMessage(apiError, 'We could not create your account. Please try again.'),
        )
        return
      }
      await signIn(email.trim(), password)
      navigate('/')
    } catch {
      setError('We could not reach the service. Check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  const valid = name.trim() && email.trim() && password.length >= MIN_PASSWORD_LENGTH

  return (
    <AuthLayout title="Create your account" intro="Your interviews and transcripts are saved to your account.">
      <form onSubmit={(e) => void submit(e)} className="space-y-4 rounded-lg border bg-card p-6" aria-label="Create account">
        <Field label="Your name" name="name" autoComplete="name" required autoFocus
          value={name} onChange={(e) => setName(e.target.value)} />
        <Field label="Email" name="email" type="email" autoComplete="email" required
          value={email} onChange={(e) => setEmail(e.target.value)} />
        <Field label="Password" name="password" type="password" autoComplete="new-password" required
          minLength={MIN_PASSWORD_LENGTH} hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
          value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={busy || !valid}>
          {busy ? 'Creating account…' : 'Create account'}
        </Button>
        <p className="text-sm">
          Already have an account?{' '}
          <Link to="/" className="text-primary underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
