import createClient, { type Middleware } from 'openapi-fetch'
import { getAccessToken } from '@/auth/auth'
import { loadConfig } from '@/config'
import type { paths } from './schema'

const bearer: Middleware = {
  onRequest({ request }) {
    const token = getAccessToken()
    if (token) request.headers.set('Authorization', `Bearer ${token}`)
    return request
  },
}

/** The browser talks only to the edge gateway (same-origin `/api`, or `apiUrl`). */
export function createApiClient(baseUrl = loadConfig().apiUrl) {
  const client = createClient<paths>({ baseUrl })
  client.use(bearer)
  return client
}
