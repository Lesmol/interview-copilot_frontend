import { useEffect, useState } from 'react'
import { createApiClient } from '@/api/client'
import { completeSignInIfRedirected, signIn, signOut } from '@/auth/auth'
import { Button } from '@/components/ui/button'

type State =
  | { status: 'loading' }
  | { status: 'signed-out' }
  | { status: 'signed-in'; userId: string }
  | { status: 'error'; message: string }

export default function App() {
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    async function init() {
      try {
        const user = await completeSignInIfRedirected()
        if (!user) return setState({ status: 'signed-out' })
        const { data, error, response } = await createApiClient().GET('/api/whoami')
        if (cancelled) return
        if (data?.userId) setState({ status: 'signed-in', userId: data.userId })
        else setState({ status: 'error', message: `whoami failed (${response.status}) ${JSON.stringify(error ?? '')}` })
      } catch (e) {
        if (!cancelled) setState({ status: 'error', message: e instanceof Error ? e.message : String(e) })
      }
    }
    void init()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-6 px-4">
      <header>
        <p className="text-sm tracking-widest text-primary uppercase">Interview Co-Pilot</p>
        <h1 className="font-serif text-4xl">Follow-ups, while the story is still talking.</h1>
      </header>

      {state.status === 'loading' && <p className="text-muted-foreground">Loading…</p>}

      {state.status === 'signed-out' && (
        <div>
          <Button onClick={() => void signIn()}>Sign in</Button>
        </div>
      )}

      {state.status === 'signed-in' && (
        <section className="flex flex-col gap-3 rounded-lg border bg-card p-4">
          <p>
            Signed in as <code data-testid="user-id">{state.userId}</code>
          </p>
          <div>
            <Button variant="secondary" onClick={() => void signOut()}>
              Sign out
            </Button>
          </div>
        </section>
      )}

      {state.status === 'error' && (
        <p role="alert" className="text-destructive">
          {state.message}
        </p>
      )}
    </main>
  )
}
