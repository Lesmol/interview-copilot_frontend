# Decisions

- **TypeScript 7.0 kept.** It removed `baseUrl`, so the `@/` alias uses `paths` alone.
- **`openapi-typescript` runs through `npx` at a pinned major (7)**, not as a dependency: its peer range is TypeScript 5, which conflicts with TS 7. CI checks the generated file has no drift.
- **shadcn's current output imports `cn` from the `cn` npm package** (published by shadcn from `shadcn-ui/cn`), kept as generated.
- **Dark only.** shadcn tokens are set to the design's dark palette; `next-themes` was removed.
- **OIDC client:** `oidc-client-ts`, access token in an in-memory store only. A page reload signs in again silently through the IdP session.
- **Runtime config:** the container writes `/config.js` from environment variables, so one image works against any IdP.
