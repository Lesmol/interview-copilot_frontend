import { describe, expect, it } from 'vitest'
import { SseParser } from './sse'

describe('SseParser', () => {
  it('returns an event only once its blank line has arrived, even when split mid-line', () => {
    const parser = new SseParser()
    expect(parser.feed('event: suggestion\ndata: {"te')).toEqual([])
    expect(parser.feed('xt":"Which cuts?"}\n')).toEqual([])
    expect(parser.feed('\n')).toEqual([{ event: 'suggestion', data: '{"text":"Which cuts?"}', id: undefined }])
  })

  it('ignores comments and keep-alives and handles CRLF', () => {
    const parser = new SseParser()
    const events = parser.feed(': connected\n\n: keepalive\r\n\r\nid: 7\r\nevent: suggestion\r\ndata: a\r\ndata: b\r\n\r\n')
    expect(events).toEqual([{ event: 'suggestion', data: 'a\nb', id: '7' }])
  })

  it('defaults the event name to message', () => {
    expect(new SseParser().feed('data: hi\n\n')[0]?.event).toBe('message')
  })
})
