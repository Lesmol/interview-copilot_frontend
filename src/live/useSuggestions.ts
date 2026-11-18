import { useCallback, useEffect, useState } from 'react'
import { createApiClient } from '@/api/client'
import { followSuggestions, type Suggestion, type SuggestionStatus } from './suggestions'

/** The session's suggestions, kept in arrival order so a new one never moves the others. */
export function useSuggestions(sessionId: string | undefined) {
  const [items, setItems] = useState<Suggestion[]>([])
  const [problem, setProblem] = useState<string>()

  useEffect(() => {
    setItems([])
    if (!sessionId) return
    return followSuggestions(
      sessionId,
      (incoming) =>
        setItems((current) => {
          const at = current.findIndex((s) => s.id === incoming.id)
          if (at < 0) return [...current, incoming]
          // Re-reading the list must not undo a status the user just set; keep the newer local one.
          return current
        }),
      setProblem,
    )
  }, [sessionId])

  const setStatus = useCallback(async (id: string, status: SuggestionStatus) => {
    let before: Suggestion | undefined
    setItems((current) =>
      current.map((s) => {
        if (s.id !== id) return s
        before = s
        return { ...s, status }
      }),
    )
    const { error } = await createApiClient().PATCH('/api/v1/suggestions/{id}', {
      params: { path: { id } },
      body: { status },
    })
    if (error && before) {
      const restore = before
      setItems((current) => current.map((s) => (s.id === id ? restore : s)))
      setProblem('Could not save that change. Try again.')
    }
  }, [])

  return { items, problem, setStatus }
}
