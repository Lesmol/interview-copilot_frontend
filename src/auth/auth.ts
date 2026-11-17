import { InMemoryWebStorage, UserManager, WebStorageStateStore, type User } from 'oidc-client-ts'
import { loadConfig } from '@/config'

let manager: UserManager | undefined
let current: User | null = null

/** Authorization code flow with PKCE. The user (and its access token) lives in memory only. */
function getManager(): UserManager {
  if (!manager) {
    const config = loadConfig()
    manager = new UserManager({
      authority: config.oidcAuthority,
      client_id: config.oidcClientId,
      redirect_uri: window.location.origin + '/',
      post_logout_redirect_uri: window.location.origin + '/',
      response_type: 'code',
      scope: 'openid interview-copilot/user',
      userStore: new WebStorageStateStore({ store: new InMemoryWebStorage() }),
      automaticSilentRenew: true,
    })
    manager.events.addUserLoaded((user) => {
      current = user
    })
    manager.events.addUserUnloaded(() => {
      current = null
    })
  }
  return manager
}

/** Completes the redirect from the IdP when the URL carries a code, otherwise returns null. */
export async function completeSignInIfRedirected(): Promise<User | null> {
  const params = new URLSearchParams(window.location.search)
  if (params.has('code') && params.has('state')) {
    current = await getManager().signinRedirectCallback()
    window.history.replaceState({}, document.title, window.location.pathname)
  }
  return current
}

export const signIn = () => getManager().signinRedirect()
export const signOut = () => getManager().signoutRedirect()
export const getAccessToken = (): string | undefined => current?.access_token
