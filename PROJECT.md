# Project identity — keep Voxli apps separate

This repository is **only** for **Split Rock Construction**.

You may deploy several products under the same Vercel team (`voxli`), but each product
must stay a **separate Vercel project** + **separate GitHub repo**. Never share
env vars, domains, or deploy hooks between them.

## Map (Voxli team)

| Product | GitHub repo | Vercel project name (production) | Example domains |
| --- | --- | --- | --- |
| **Split Rock Construction** | `kipparchibald/split-rock-construction` | **`split-rock-construction-kx9x`** | `splitrockconst.com`, `www.splitrockconst.com`, `split-rock-construction-kx9x*.vercel.app` |
| IdeaSpeak app | `kipparchibald/ideaspeak-app` | `ideaspeak-app` | `ideaspeak.dev`, `ideaspeak-app*.vercel.app` |
| IdeaSpeak platform | `kipparchibald/ideaspeak-platform` | *(own project if deployed)* | — |
| Voxli product | `kipparchibald/Voxli` | *(own project if deployed)* | — |

> **Stale Vercel project:** an older project named exactly `split-rock-construction` (no `-kx9x` suffix) is a leftover — **do not** link this repo to it, deploy there, or move `splitrockconst.com` onto it. Production lives on **`split-rock-construction-kx9x`**, which already has the domain.

## Hard rules

1. **One GitHub repo → one Vercel project.**  
   This repo must never be linked to `ideaspeak-app` (or any other product project).
2. **Vercel project name for production:** `split-rock-construction-kx9x`  
   Under team **voxli**. Do not reuse `ideaspeak-app` or the stale `split-rock-construction` project.
3. **Domains stay product-scoped.**  
   IdeaSpeak domains (`ideaspeak.dev`, …) must not be added here. Split Rock domains
   must not be added to IdeaSpeak, **Archibald-Bagley**, or any other Voxli product.
4. **Env vars are per-project.**  
   Auth secrets, databases, and API keys for Split Rock live only on the
   **`split-rock-construction-kx9x`** Vercel project.
5. **Local link:** run `vercel link` **from this repo** and pick
   **`split-rock-construction-kx9x`** under team **voxli**. That writes `.vercel/project.json`
   (gitignored). If that file ever points at another product, delete it and re-link.
6. **Deploy checks:** `npm run check:project` fails if a local Vercel link points at
   a foreign or stale project id/name.

## Production Vercel project (Split Rock only)

1. Vercel → team **voxli** → project **`split-rock-construction-kx9x`**
2. Git → connect **`kipparchibald/split-rock-construction`** if not already linked
3. Production Branch: **`main`**
4. Do **not** use the stale project named `split-rock-construction` (without `-kx9x`)

## Package / app identity

- npm package name: `split-rock-construction` (`package.json`) — repo identity, not the Vercel project slug
- Product copy source: `src/lib/company.ts` → **Split Rock Construction**
- Auth emails: `@splitrockconst.com` only

## Domain: splitrockconst.com

**Authoritative:** `splitrockconst.com` and `www.splitrockconst.com` belong to **Split Rock Construction** only. They are the public marketing and OS surface for this repo (`kipparchibald/split-rock-construction` → Vercel project **`split-rock-construction-kx9x`**). Do **not** attach, redirect, or document these domains on **IdeaSpeak**, **Archibald-Bagley**, or any other product — and **do not** move them to the stale `split-rock-construction` Vercel project.

Production domain is already on **`split-rock-construction-kx9x`**. For DNS changes or verification:

1. Vercel → **`split-rock-construction-kx9x`** → **Settings → Domains**
2. Confirm `splitrockconst.com` and `www.splitrockconst.com` are listed (not on `ideaspeak-app`, **Archibald-Bagley**, or stale `split-rock-construction`)
3. At your DNS host, keep records pointed at Vercel’s targets for that project

## Related historical code (do not dual-develop)

| Repo | Package name | Status |
| --- | --- | --- |
| **`kipparchibald/split-rock-construction`** | `split-rock-construction` | **Canonical — all work goes here** |
| `kipparchibald/Voxli` | `split-rock-os` (legacy) | Earlier Split Rock OS fork; Teton sales CRM was merged back into this repo |
| Grok workspace names (`split-rock-os`, `split-rock-field-os`, …) | — | Sandbox leftovers — not source of truth |

Ship via PR to `main`. See open PRs for in-flight work.

## Deploy from `main`

Step-by-step production deploy, env vars, domain, and rollback:

→ **[DEPLOY.md](./DEPLOY.md)**
