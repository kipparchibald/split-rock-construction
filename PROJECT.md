# Project identity — keep Voxli apps separate

This repository is **only** for **Split Rock Construction**.

You may deploy several products under the same Vercel team (`voxli`), but each product
must stay a **separate Vercel project** + **separate GitHub repo**. Never share
env vars, domains, or deploy hooks between them.

## Map (Voxli team)

| Product | GitHub repo | Vercel project name (must match) | Example domains |
| --- | --- | --- | --- |
| **Split Rock Construction** | `kipparchibald/split-rock-construction` | `split-rock-construction` | `split-rock-construction*.vercel.app`, `splitrockconst.com` (when linked) |
| IdeaSpeak app | `kipparchibald/ideaspeak-app` | `ideaspeak-app` | `ideaspeak.dev`, `ideaspeak-app*.vercel.app` |
| IdeaSpeak platform | `kipparchibald/ideaspeak-platform` | *(own project if deployed)* | — |
| Voxli product | `kipparchibald/Voxli` | *(own project if deployed)* | — |

## Hard rules

1. **One GitHub repo → one Vercel project.**  
   This repo must never be linked to `ideaspeak-app` (or any other product project).
2. **Vercel project name for this app:** `split-rock-construction`  
   Create it under team **voxli** if it does not exist yet. Do not reuse `ideaspeak-app`.
3. **Domains stay product-scoped.**  
   IdeaSpeak domains (`ideaspeak.dev`, …) must not be added here. Split Rock domains
   must not be added to IdeaSpeak.
4. **Env vars are per-project.**  
   Auth secrets, databases, and API keys for Split Rock live only on the
   `split-rock-construction` Vercel project.
5. **Local link:** run `vercel link` **from this repo** and pick
   `split-rock-construction` under team **voxli**. That writes `.vercel/project.json`
   (gitignored). If that file ever points at another product, delete it and re-link.
6. **Deploy checks:** `npm run check:project` fails if a local Vercel link points at
   a foreign project id/name.

## First-time Vercel setup (Split Rock only)

1. Vercel → team **voxli** → **Add New Project**
2. Import **only** `kipparchibald/split-rock-construction`
3. Project name: **`split-rock-construction`** (exact)
4. Leave IdeaSpeak / Voxli repos unlinked from this project
5. After link: production URL will look like  
   `https://split-rock-construction.vercel.app` (or team-prefixed variant)

## Package / app identity

- npm package name: `split-rock-construction` (`package.json`)
- Product copy source: `src/lib/company.ts` → **Split Rock Construction**
- Auth emails: `@splitrockconst.com` only

## Domain: splitrockconst.com

After the **split-rock-construction** Vercel project exists under team **voxli**:

1. Vercel → Project → Settings → Domains → Add **`splitrockconst.com`** and **`www.splitrockconst.com`**
2. At your DNS host, point:
   - `A` / apex → Vercel’s documented IPs (or use their nameserver transfer)
   - `CNAME` `www` → `cname.vercel-dns.com` (or the target Vercel shows)
3. Do **not** add this domain to `ideaspeak-app` or any other project.

## Related historical code (do not dual-develop)

| Repo | Package name | Status |
| --- | --- | --- |
| **`kipparchibald/split-rock-construction`** | `split-rock-construction` | **Canonical — all work goes here** |
| `kipparchibald/Voxli` | `split-rock-os` (legacy) | Earlier Split Rock OS fork; Teton sales CRM was merged back into this repo |
| Grok workspace names (`split-rock-os`, `split-rock-field-os`, …) | — | Sandbox leftovers — not source of truth |

There is **one git branch**: `main`. No feature branches or open PRs on this repo.
