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
  const adapter = useRef<SpeechAdapter | undefined>(undefined)
  const capture = useRef<MicCapture | undefined>(undefined)

  const stop = useCallback(() => {
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
    setStatus('connecting')
    try {
      const { data, error: apiError } = await createApiClient().GET('/api/v1/stt-token', {
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

  return { status, error, lines, partial, start, stop }
}
