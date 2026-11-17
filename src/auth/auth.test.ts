import { afterEach, describe, expect, it, vi } from 'vitest'
import { getAccessToken, isSignedIn, signIn, signOut, SignInError } from './auth'

const tokens = (body: object, status = 200) => new Response(JSON.stringify(body), { status })

describe('auth', () => {
  afterEach(async () => {
    await signOut()
    vi.unstubAllGlobals()
  })

  it('posts a password grant to the token endpoint and keeps the token in memory', async () => {
    const fetchMock = vi.fn().mockResolvedValue(tokens({ access_token: 'a1', refresh_token: 'r1', expires_in: 300 }))
    vi.stubGlobal('fetch', fetchMock)
    await signIn('journalist', 'pw')
    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toContain('/protocol/openid-connect/token')
    expect(String(init.body)).toContain('grant_type=password')
    expect(getAccessToken()).toBe('a1')
    expect(isSignedIn()).toBe(true)
    expect(JSON.stringify(localStorage) + JSON.stringify(sessionStorage)).not.toContain('a1')
  })

  it('rejects bad credentials without signing in', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(tokens({ error: 'invalid_grant' }, 401)))
    await expect(signIn('journalist', 'bad')).rejects.toBeInstanceOf(SignInError)
    expect(isSignedIn()).toBe(false)
  })

  it('signs out locally and tells the IdP', async () => {
    const fetchMock = vi.fn().mockResolvedValue(tokens({ access_token: 'a1', refresh_token: 'r1', expires_in: 300 }))
    vi.stubGlobal('fetch', fetchMock)
    await signIn('journalist', 'pw')
    await signOut()
    expect(isSignedIn()).toBe(false)
    expect(String(fetchMock.mock.calls[1][0])).toContain('/logout')
  })
})
