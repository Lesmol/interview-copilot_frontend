import { useState, type FormEvent } from 'react'
import { SignInError, signIn } from '@/auth/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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
    <main className="mx-auto grid min-h-screen max-w-md content-center gap-8 px-4">
      <header className="space-y-3">
        <p className="text-sm tracking-widest text-primary uppercase">Interview Co-Pilot</p>
        <h1 className="font-serif text-4xl leading-tight">Follow-ups, while the story is still talking.</h1>
        <p className="text-muted-foreground">Sign in to record an interview and keep your transcripts.</p>
      </header>

      <form onSubmit={(e) => void submit(e)} className="space-y-4 rounded-lg border bg-card p-6" aria-label="Sign in">
        <div className="space-y-1.5">
          <label htmlFor="username" className="text-sm font-medium">
            Email or username
          </label>
          <Input
            id="username"
            name="username"
            autoComplete="username"
            required
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={busy || !username || !password}>
          {busy ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </main>
  )
}
