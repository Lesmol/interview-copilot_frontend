import { useCallback, useEffect, useRef, useState } from 'react'
import { createApiClient } from '@/api/client'
import { startMicCapture, type MicCapture } from '@/audio/capture'
import { FRAME_SAMPLES, TARGET_RATE } from '@/audio/pcm'
import type { SpeechAdapter } from '@/speech/adapter'
import { DeepgramAdapter } from '@/speech/deepgram'

export interface TranscriptLine {
  id: number
  text: string
  startMs: number
  endMs: number
}

export type LiveStatus = 'idle' | 'connecting' | 'live' | 'error'

const FRAME_MS = (FRAME_SAMPLES / TARGET_RATE) * 1000

/** Mic -> speech provider (direct, short-lived token) -> partial and final transcript lines. */
export function useLiveTranscript(createAdapter: () => SpeechAdapter = () => new DeepgramAdapter()) {
  const [status, setStatus] = useState<LiveStatus>('idle')
  const [error, setError] = useState<string>()
  const [lines, setLines] = useState<TranscriptLine[]>([])
  const [partial, setPartial] = useState('')
  const [sessionId, setSessionId] = useState<string>()
  const [startedAt, setStartedAt] = useState<number>()
  const adapter = useRef<SpeechAdapter | undefined>(undefined)
  const capture = useRef<MicCapture | undefined>(undefined)
  const session = useRef<string | undefined>(undefined)
  // Final lines are posted one after another so the server numbers them in the order they were spoken.
  const posting = useRef<Promise<unknown>>(Promise.resolve())

  const stop = useCallback(() => {
    const ending = session.current
    if (ending) {
      posting.current = posting.current.then(() =>
        createApiClient().POST('/api/v1/sessions/{id}/end', { params: { path: { id: ending } } }),
      )
      session.current = undefined
    }
    capture.current?.stop()
    adapter.current?.close()
    capture.current = undefined
    adapter.current = undefined
    setPartial('')
    setStatus('idle')
  }, [])

  const start = useCallback(async () => {
    setError(undefined)
    setLines([])
    setSessionId(undefined)
    setStatus('connecting')
    try {
      const api = createApiClient()
      const created = await api.POST('/api/v1/sessions', { body: { title: 'Live interview' } })
      if (!created.data) throw new Error('Could not start a session')
      const id = created.data.id
      session.current = id
      setSessionId(id)
      setStartedAt(Date.now())
      const { data, error: apiError } = await api.GET('/api/v1/stt-token', {
        params: { query: { provider: 'deepgram' } },
      })
      if (!data?.token) throw new Error(`Could not get a speech token ${JSON.stringify(apiError ?? '')}`)

      const speech = createAdapter()
      let framesSent = 0
      let nextId = 1
      speech.onPartial(setPartial)
      speech.onFinal((utterance) => {
        // Per-stage timing: how far the provider's final text trails the audio we have already sent.
        const lagMs = Math.round(framesSent * FRAME_MS - utterance.endMs)
        console.info(`[timing] speech->final text ${lagMs} ms (utterance ends at ${utterance.endMs} ms)`)
        setPartial('')
        setLines((previous) => [...previous, { id: nextId++, ...utterance }])
        posting.current = posting.current.then(() =>
          api
            .POST('/api/v1/sessions/{id}/utterances', {
              params: { path: { id } },
              body: { text: utterance.text, startMs: utterance.startMs, endMs: utterance.endMs },
            })
            .catch((e: unknown) => console.warn('[utterance] could not save a line', e)),
        )
      })
      speech.onError((message) => {
        setError(message)
        setStatus('error')
      })
      await speech.connect(data.token)
      adapter.current = speech
      capture.current = await startMicCapture((frame) => {
        framesSent++
        speech.sendAudio(frame)
      })
      setStatus('live')
    } catch (e) {
      adapter.current?.close()
      capture.current?.stop()
      setError(e instanceof Error ? e.message : String(e))
      setStatus('error')
    }
  }, [createAdapter])

  useEffect(() => stop, [stop])

  return { status, error, lines, partial, sessionId, startedAt, start, stop }
}
