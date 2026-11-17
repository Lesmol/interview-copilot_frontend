import { loadConfig } from '@/config'

/** Wrong credentials or an unreachable IdP; the message is safe to show. */
export class SignInError extends Error {}

interface Session {
  accessToken: string
  refreshToken: string
}

interface TokenResponse {
  access_token: string
  refresh_token?: string
  expires_in: number
}

const SCOPE = 'openid interview-copilot/user'
const listeners = new Set<(signedIn: boolean) => void>()
let session: Session | null = null
let refreshTimer: ReturnType<typeof setTimeout> | undefined

const tokenUrl = () => `${loadConfig().oidcAuthority}/protocol/openid-connect/token`
const logoutUrl = () => `${loadConfig().oidcAuthority}/protocol/openid-connect/logout`

/**
 * The access and refresh tokens live in memory only (never storage), so a reload signs out.
 * The password goes straight to the IdP's token endpoint and is not kept.
 */
async function requestTokens(params: Record<string, string>): Promise<Response> {
  return fetch(tokenUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: loadConfig().oidcClientId, scope: SCOPE, ...params }),
  })
}

function adopt(tokens: TokenResponse): void {
  session = { accessToken: tokens.access_token, refreshToken: tokens.refresh_token ?? session?.refreshToken ?? '' }
  clearTimeout(refreshTimer)
  // Refresh a little before expiry; rotated refresh tokens replace the old one.
  refreshTimer = setTimeout(() => void refresh(), Math.max(5, tokens.expires_in - 30) * 1000)
  listeners.forEach((l) => l(true))
}

async function refresh(): Promise<void> {
  if (!session?.refreshToken) return
  try {
    const response = await requestTokens({ grant_type: 'refresh_token', refresh_token: session.refreshToken })
    if (!response.ok) throw new Error('refresh rejected')
    adopt((await response.json()) as TokenResponse)
  } catch {
    clear()
  }
}

function clear(): void {
  clearTimeout(refreshTimer)
  session = null
  listeners.forEach((l) => l(false))
}

export async function signIn(username: string, password: string): Promise<void> {
  let response: Response
  try {
    response = await requestTokens({ grant_type: 'password', username, password })
  } catch {
    throw new SignInError('Could not reach the sign-in service. Check your connection and try again.')
  }
  if (response.status === 401 || response.status === 400) throw new SignInError('Wrong email or password.')
  if (!response.ok) throw new SignInError('Sign-in failed. Please try again.')
  adopt((await response.json()) as TokenResponse)
}

export async function signOut(): Promise<void> {
  const refreshToken = session?.refreshToken
  clear()
  if (!refreshToken) return
  try {
    await fetch(logoutUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: loadConfig().oidcClientId, refresh_token: refreshToken }),
    })
  } catch {
    // The local session is already gone; the IdP session expires on its own.
  }
}

export const getAccessToken = (): string | undefined => session?.accessToken
export const isSignedIn = (): boolean => session !== null

export function onSessionChange(listener: (signedIn: boolean) => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
