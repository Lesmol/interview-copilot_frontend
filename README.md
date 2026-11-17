# interview-copilot_frontend

React + TypeScript on Vite, Tailwind CSS v4 and shadcn/ui, themed to the dark design in `docs/design/`.

- Sign-in: OIDC authorization code flow with PKCE (`oidc-client-ts`). The access token is kept in memory only.
- API: the browser calls only the edge gateway (same-origin `/api`). The TypeScript types in `src/api/schema.d.ts` are generated from the BFF's `openapi/bff.json` (`npm run gen:api`).
- Runtime config comes from `/config.js` (written from environment variables by the container).

```
npm ci
npm run dev      # proxies /api to EDGE_GATEWAY_URL
npm test
npm run e2e      # Playwright against a running workbench; set E2E_PASSWORD
```

Licence: Apache-2.0.
