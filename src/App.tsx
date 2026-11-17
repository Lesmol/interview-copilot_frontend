import { useEffect, useState } from 'react'
import { createApiClient } from '@/api/client'
import { isSignedIn, onSessionChange, signOut } from '@/auth/auth'
import SignInPage from '@/auth/SignInPage'
import { Button } from '@/components/ui/button'
import LiveScreen from '@/live/LiveScreen'

type Profile = { status: 'loading' } | { status: 'ready'; userId: string } | { status: 'error'; message: string }

function Home() {
  const [profile, setProfile] = useState<Profile>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    createApiClient()
      .GET('/api/whoami')
      .then(({ data, response }) => {
        if (cancelled) return
        if (data?.userId) setProfile({ status: 'ready', userId: data.userId })
        else setProfile({ status: 'error', message: `Could not load your account (${response.status}).` })
      })
      .catch((e: unknown) => {
        if (!cancelled) setProfile({ status: 'error', message: e instanceof Error ? e.message : String(e) })
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-8">
      <header className="flex items-center justify-between gap-3">
        <p className="text-sm tracking-widest text-primary uppercase">Interview Co-Pilot</p>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          {profile.status === 'ready' && (
            <span>
              Signed in as <code data-testid="user-id">{profile.userId}</code>
            </span>
          )}
          <Button variant="ghost" size="sm" onClick={() => void signOut()}>
            Sign out
          </Button>
        </div>
      </header>
      {profile.status === 'error' && (
        <p role="alert" className="text-destructive">
          {profile.message}
        </p>
      )}
      <LiveScreen />
    </main>
  )
}

export default function App() {
  const [signedIn, setSignedIn] = useState(isSignedIn())
  useEffect(() => onSessionChange(setSignedIn), [])
  return signedIn ? <Home /> : <SignInPage />
}
