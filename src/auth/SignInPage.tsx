import { useState, type FormEvent } from 'react'
import AuthLayout, { Field } from '@/auth/AuthLayout'
import { SignInError, signIn } from '@/auth/auth'
import { Button } from '@/components/ui/button'
import { Link } from '@/routing'

export default function SignInPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError(undefined)
    setBusy(true)
    try {
      await signIn(username.trim(), password)
    } catch (e) {
      setError(e instanceof SignInError ? e.message : 'Sign-in failed. Please try again.')
      setPassword('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout
      title="Follow-ups, while the story is still talking."
      intro="Sign in to record an interview and keep your transcripts."
    >
      <form onSubmit={(e) => void submit(e)} className="space-y-4 rounded-lg border bg-card p-6" aria-label="Sign in">
        <Field label="Email or username" name="username" autoComplete="username" required autoFocus
          value={username} onChange={(e) => setUsername(e.target.value)} />
        <Field label="Password" name="password" type="password" autoComplete="current-password" required
          value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={busy || !username || !password}>
          {busy ? 'Signing in…' : 'Sign in'}
        </Button>
        <div className="flex justify-between text-sm">
          <Link to="/forgot-password" className="text-primary underline-offset-4 hover:underline">
            Forgot your password?
          </Link>
          <Link to="/sign-up" className="text-primary underline-offset-4 hover:underline">
            Create an account
          </Link>
        </div>
      </form>
    </AuthLayout>
  )
}
