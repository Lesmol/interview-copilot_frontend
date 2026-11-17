export interface AppConfig {
  /** Public issuer URL of the IdP (Keycloak locally, Cognito in production). */
  oidcAuthority: string
  oidcClientId: string
  /** Base URL of the edge gateway. Empty means same origin (`/api` is proxied). */
  apiUrl: string
}

declare global {
  interface Window {
    __CONFIG__?: Partial<AppConfig>
  }
}

export function loadConfig(): AppConfig {
  const runtime = window.__CONFIG__ ?? {}
  return {
    oidcAuthority: runtime.oidcAuthority || import.meta.env.VITE_OIDC_AUTHORITY || '',
    oidcClientId: runtime.oidcClientId || import.meta.env.VITE_OIDC_CLIENT_ID || '',
    apiUrl: runtime.apiUrl ?? import.meta.env.VITE_API_URL ?? '',
  }
}
