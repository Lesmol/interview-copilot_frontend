export interface SseEvent {
  event: string
  data: string
  id?: string
}

/** Incremental parser for a text/event-stream body: feed it chunks, get complete events back. */
export class SseParser {
  private buffer = ''
  private event = 'message'
  private data: string[] = []
  private id: string | undefined

  feed(chunk: string): SseEvent[] {
    this.buffer += chunk
    const out: SseEvent[] = []
    let newline: number
    while ((newline = this.buffer.search(/\r\n|\n|\r/)) >= 0) {
      const line = this.buffer.slice(0, newline)
      const eol = this.buffer.startsWith('\r\n', newline) ? 2 : 1
      this.buffer = this.buffer.slice(newline + eol)
      if (line === '') {
        if (this.data.length > 0) out.push({ event: this.event, data: this.data.join('\n'), id: this.id })
        this.event = 'message'
        this.data = []
        this.id = undefined
      } else if (!line.startsWith(':')) {
        const colon = line.indexOf(':')
        const field = colon < 0 ? line : line.slice(0, colon)
        const value = colon < 0 ? '' : line.slice(colon + 1).replace(/^ /, '')
        if (field === 'event') this.event = value
        else if (field === 'data') this.data.push(value)
        else if (field === 'id') this.id = value
      }
    }
    return out
  }
}
