# Live Holwege portal env (names only)

Set these on Vercel project `split-rock-construction-kx9x` for Production when `VITE_SPLIT_ROCK_DEMO=false`.

| Name | Purpose |
| --- | --- |
| `HOLWEGE_PORTAL_INVITE` | Revocable server-issued Holwege access code (compared on `POST /api/portal/sign-in`). Rotate to revoke. **Never commit the value.** |
| `PORTAL_SESSION_SECRET` | HMAC secret for HttpOnly `src_portal_session` cookie (≥16 chars). **Never commit the value.** |

Demo mode keeps `DEMO_HOLWEGE_PORTAL` in `src/lib/demo-credentials.ts` (gated by `isDemoDataEnabled`) for demo UI buttons / E2E — not used as the live invite.

Do **not** auto-email owners. Fence held: no owner credential emails.

Check readiness (booleans only): `GET /api/health` → `readiness.portalAuthReady`.
