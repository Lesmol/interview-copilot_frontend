import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApiClient } from './client'

vi.mock('@/auth/auth', () => ({ getAccessToken: () => 'user-token' }))

describe('api client', () => {
  afterEach(() => vi.restoreAllMocks())

  it('sends the bearer token to the edge gateway', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ userId: 'u1' }), { headers: { 'Content-Type': 'application/json' } }),
    )
    const client = createApiClient('https://edge.example.test')
    await client.GET('/api/whoami', { fetch: fetchMock })
    const request = fetchMock.mock.calls[0][0] as Request
    expect(request.url).toBe('https://edge.example.test/api/whoami')
    expect(request.headers.get('Authorization')).toBe('Bearer user-token')
  })
})
