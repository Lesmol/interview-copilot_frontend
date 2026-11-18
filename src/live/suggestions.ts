import { createApiClient } from '@/api/client'
import type { components } from '@/api/schema'
import { getAccessToken } from '@/auth/auth'
import { loadConfig } from '@/config'
import { SseParser } from './sse'

export type Suggestion = components['schemas']['SuggestionResponse']
export type SuggestionStatus = 'open' | 'asked' | 'dismissed' | 'pinned'

/**
 * Follows a session's suggestion stream. EventSource cannot send an Authorization header, so this reads the
 * response of a fetch. When the stream drops it reconnects and re-reads the list, so nothing sent while the
 * connection was down is lost. Returns a function that stops it.
 */
export function followSuggestions(
  sessionId: string,
  onSuggestion: (suggestion: Suggestion) => void,
  onProblem: (message: string | undefined) => void,
): () => void {
  const controller = new AbortController()
  const base = loadConfig().apiUrl.replace(/\/$/, '')

  async function catchUp() {
    const { data } = await createApiClient().GET('/api/v1/sessions/{id}/suggestions', {
      params: { path: { id: sessionId } },
    })
    data?.forEach(onSuggestion)
  }

  async function run() {
    let delay = 500
    while (!controller.signal.aborted) {
      try {
        const response = await fetch(`${base}/api/v1/sessions/${sessionId}/suggestions/stream`, {
          headers: { Accept: 'text/event-stream', Authorization: `Bearer ${getAccessToken() ?? ''}` },
          signal: controller.signal,
        })
        if (!response.ok || !response.body) throw new Error(`stream answered ${response.status}`)
        onProblem(undefined)
        delay = 500
        await catchUp()
        const parser = new SseParser()
        const reader = response.body.pipeThrough(new TextDecoderStream()).getReader()
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          for (const event of parser.feed(value)) {
            if (event.event === 'suggestion') onSuggestion(JSON.parse(event.data) as Suggestion)
          }
        }
      } catch (e) {
        if (controller.signal.aborted) return
        onProblem('Suggestions are reconnecting…')
        console.info('[suggestions] stream dropped:', e instanceof Error ? e.message : e)
      }
      await new Promise((resolve) => setTimeout(resolve, delay))
      delay = Math.min(delay * 2, 10_000)
    }
  }

  void run()
  return () => controller.abort()
}
