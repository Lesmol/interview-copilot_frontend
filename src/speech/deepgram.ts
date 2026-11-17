import type { FinalUtterance, SpeechAdapter } from './adapter'

const URL_BASE = 'wss://api.deepgram.com/v1/listen'
const PARAMS = new URLSearchParams({
  model: 'nova-3',
  encoding: 'linear16',
  sample_rate: '16000',
  channels: '1',
  interim_results: 'true',
  endpointing: '300',
  utterance_end_ms: '1000',
  smart_format: 'true',
})

interface Results {
  type: 'Results'
  is_final: boolean
  start: number
  duration: number
  channel: { alternatives: { transcript: string }[] }
}

export class DeepgramAdapter implements SpeechAdapter {
  private socket?: WebSocket
  private keepAlive?: ReturnType<typeof setInterval>
  private partial: (text: string) => void = () => {}
  private final: (utterance: FinalUtterance) => void = () => {}
  private utteranceEnd: () => void = () => {}
  private error: (message: string) => void = () => {}

  private readonly createSocket: (url: string, protocols: string[]) => WebSocket

  constructor(createSocket: (url: string, protocols: string[]) => WebSocket = (u, p) => new WebSocket(u, p)) {
    this.createSocket = createSocket
  }

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Browsers cannot set headers on a WebSocket; Deepgram accepts the token as a subprotocol.
      const socket = this.createSocket(`${URL_BASE}?${PARAMS}`, ['bearer', token])
      socket.binaryType = 'arraybuffer'
      socket.onopen = () => {
        this.keepAlive = setInterval(() => socket.send(JSON.stringify({ type: 'KeepAlive' })), 8_000)
        resolve()
      }
      socket.onerror = () => {
        this.error('Speech connection failed')
        reject(new Error('Speech connection failed'))
      }
      socket.onclose = () => clearInterval(this.keepAlive)
      socket.onmessage = (event) => this.handle(event.data)
      this.socket = socket
    })
  }

  private handle(data: unknown): void {
    if (typeof data !== 'string') return
    const message = JSON.parse(data) as { type?: string }
    if (message.type === 'UtteranceEnd') return this.utteranceEnd()
    if (message.type !== 'Results') return
    const results = message as Results
    const text = results.channel.alternatives[0]?.transcript.trim() ?? ''
    if (!text) return
    if (results.is_final) {
      this.final({
        text,
        startMs: Math.round(results.start * 1000),
        endMs: Math.round((results.start + results.duration) * 1000),
      })
    } else {
      this.partial(text)
    }
  }

  sendAudio(frame: Int16Array<ArrayBuffer>): void {
    if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(frame)
  }

  onPartial(handler: (text: string) => void) { this.partial = handler }
  onFinal(handler: (utterance: FinalUtterance) => void) { this.final = handler }
  onUtteranceEnd(handler: () => void) { this.utteranceEnd = handler }
  onError(handler: (message: string) => void) { this.error = handler }

  close(): void {
    clearInterval(this.keepAlive)
    if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify({ type: 'CloseStream' }))
    this.socket?.close()
  }
}
