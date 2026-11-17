import { describe, expect, it, vi } from 'vitest'
import { DeepgramAdapter } from './deepgram'

class FakeSocket {
  static OPEN = 1
  readyState = 1
  binaryType = ''
  sent: unknown[] = []
  onopen: () => void = () => {}
  onerror: () => void = () => {}
  onclose: () => void = () => {}
  onmessage: (e: { data: unknown }) => void = () => {}
  url: string
  protocols: string[]
  constructor(url: string, protocols: string[]) {
    this.url = url
    this.protocols = protocols
  }
  send(data: unknown) { this.sent.push(data) }
  close() {}
}

async function connected() {
  vi.stubGlobal('WebSocket', FakeSocket)
  let socket!: FakeSocket
  const adapter = new DeepgramAdapter((url, protocols) => (socket = new FakeSocket(url, protocols)) as unknown as WebSocket)
  const ready = adapter.connect('temp-token')
  socket.onopen()
  await ready
  return { adapter, socket }
}

const results = (transcript: string, isFinal: boolean) =>
  JSON.stringify({ type: 'Results', is_final: isFinal, start: 1.25, duration: 2, channel: { alternatives: [{ transcript }] } })

describe('DeepgramAdapter', () => {
  it('authenticates with the short-lived token as a subprotocol and asks for nova-3 PCM', async () => {
    const { socket } = await connected()
    expect(socket.protocols).toEqual(['bearer', 'temp-token'])
    expect(socket.url).toContain('model=nova-3')
    expect(socket.url).toContain('encoding=linear16')
    expect(socket.url).toContain('sample_rate=16000')
    expect(socket.url).toContain('interim_results=true')
  })

  it('reports partials and finals with millisecond timings', async () => {
    const { adapter, socket } = await connected()
    const partial = vi.fn()
    const final = vi.fn()
    adapter.onPartial(partial)
    adapter.onFinal(final)
    socket.onmessage({ data: results('hello wor', false) })
    socket.onmessage({ data: results('hello world', true) })
    expect(partial).toHaveBeenCalledWith('hello wor')
    expect(final).toHaveBeenCalledWith({ text: 'hello world', startMs: 1250, endMs: 3250 })
  })

  it('ignores empty transcripts and reports utterance end', async () => {
    const { adapter, socket } = await connected()
    const final = vi.fn()
    const end = vi.fn()
    adapter.onFinal(final)
    adapter.onUtteranceEnd(end)
    socket.onmessage({ data: results('  ', true) })
    socket.onmessage({ data: JSON.stringify({ type: 'UtteranceEnd' }) })
    expect(final).not.toHaveBeenCalled()
    expect(end).toHaveBeenCalled()
  })

  it('sends audio frames as binary', async () => {
    const { adapter, socket } = await connected()
    const frame = new Int16Array(800)
    adapter.sendAudio(frame)
    expect(socket.sent).toContain(frame)
  })
})
