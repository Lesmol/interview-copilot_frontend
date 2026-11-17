# Decisions

- **TypeScript 7.0 kept.** It removed `baseUrl`, so the `@/` alias uses `paths` alone.
- **`openapi-typescript` runs through `npx` at a pinned major (7)**, not as a dependency: its peer range is TypeScript 5, which conflicts with TS 7. CI checks the generated file has no drift.
- **shadcn's current output imports `cn` from the `cn` npm package** (published by shadcn from `shadcn-ui/cn`), kept as generated.
- **Dark only.** shadcn tokens are set to the design's dark palette; `next-themes` was removed.
- **OIDC client:** `oidc-client-ts`, access token in an in-memory store only. A page reload signs in again silently through the IdP session.
- **Runtime config:** the container writes `/config.js` from environment variables, so one image works against any IdP.
- **Audio capture (milestone 2):** an AudioWorklet forwards raw mic blocks; resampling to 16 kHz and 50 ms Int16 framing happen on the main thread in `PcmFramer`, which is unit-tested. Deepgram auth uses the token as a WebSocket subprotocol, as browsers cannot set headers.
- **Per-stage timing:** each final line logs `[timing] speech->final text N ms` (audio sent so far minus the utterance end). First measurement on a synthetic clip: about 280 ms.
- The Playwright live test plays a generated WAV as the microphone (`E2E_AUDIO`); no audio fixture is committed.
- **Custom sign-in page instead of the IdP's hosted page (departs from the brief and REPOS.md, at the product owner's request).** The SPA posts the password grant straight to the IdP token endpoint (`/protocol/openid-connect/token`) and refreshes tokens itself; `oidc-client-ts` was removed. Trade-offs: the SPA now handles passwords (kept only in the form field, cleared after submit), there is no PKCE or IdP-side MFA/social login, and the OAuth password grant is deprecated in OAuth 2.1. Tokens stay in memory only, so a reload signs out. For Cognito, the app client needs `USER_PASSWORD_AUTH` and `auth.ts` needs a Cognito `InitiateAuth` variant. Sign-up and password reset are not built: they need backend or IdP admin support.
