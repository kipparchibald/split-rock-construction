# Deploy Split Rock Construction (`main`)

**Canonical repo:** [kipparchibald/split-rock-construction](https://github.com/kipparchibald/split-rock-construction)  
**Only branch to ship:** `main`  
**Vercel project name (production, exact):** `split-rock-construction-kx9x`  
**Vercel team:** `voxli`  
**Never deploy this app into** `ideaspeak-app`, **Archibald-Bagley**, or any other product project.

**Domain (authoritative):** `splitrockconst.com` + `www` are **Split Rock Construction** production domains only — they live on Vercel project **`split-rock-construction-kx9x`**, not IdeaSpeak or Archibald-Bagley.

> **Do not use the stale project** named exactly `split-rock-construction` (no `-kx9x`). It is a leftover; **do not** link this repo to it or move `splitrockconst.com` there. Production is **`split-rock-construction-kx9x`** (domain already attached).

---

## What “done” looks like

| Surface | URL |
| --- | --- |
| Production (custom domain) | `https://splitrockconst.com` + `www` |
| Production (Vercel default) | `https://split-rock-construction-kx9x.vercel.app` (or team slug variant) |
| GitHub production branch | `main` only — Production Branch in Vercel must be **`main`** |

Every push to `main` should build and promote production when Git is connected on **`split-rock-construction-kx9x`**.

---

## One-time: connect Git to the production Vercel project

Production already runs on **`split-rock-construction-kx9x`** with `splitrockconst.com`. Use this checklist to connect or verify — do **not** create a new project named `split-rock-construction`.

1. Open [Vercel](https://vercel.com) → team **voxli** → project **`split-rock-construction-kx9x`**.
2. **Settings → Git** → connect **`kipparchibald/split-rock-construction`** if needed.
3. Confirm settings:

| Setting | Value |
| --- | --- |
| Project name | **`split-rock-construction-kx9x`** (exact — not `split-rock-construction`) |
| Framework | Vite (auto-detect is fine) |
| Root directory | `.` (repo root) |
| Build command | `npm run build` |
| Install command | `npm install` (default) |
| Output | leave default (Nitro / Vercel preset from Vite build) |
| Production Branch | **`main`** |

4. **Settings → Domains** → confirm `splitrockconst.com` and `www.splitrockconst.com` (already on this project).
5. Deploy or wait for the next `main` push.

> Do **not** create `split-rock-os`, `split-rock-field-os`, or a duplicate `split-rock-construction` project. Reuse **`split-rock-construction-kx9x`** forever.

---

## Environment variables (project Settings → Environment Variables)

Set on **`split-rock-construction-kx9x`** for **Production** (and Preview if you want previews to match).

### Required for real operator sign-in

| Name | Production value | Notes |
| --- | --- | --- |
| `BETTER_AUTH_SECRET` | long random string (≥32 chars) | Generate once; never commit |
| `BETTER_AUTH_URL` | `https://splitrockconst.com` (or current prod URL) | Must match the public origin users hit |
| `DATABASE_URL` | Postgres connection string | Neon / Supabase / Vercel Postgres — **not** shared with IdeaSpeak |

### Product flags

| Name | Recommended production | Effect |
| --- | --- | --- |
| `VITE_SPLIT_ROCK_DEMO` | `false` | Hides fictional seed jobs (live empty CRM); **requires operator sign-in** for `/app` |
| `VITE_AUTH_ENABLED` | omit or `true` | Set `false` only for temporary open demos |

### Optional

| Name | Purpose |
| --- | --- |
| `VITE_SHOW_BUILT_WITH_GROK` | `false` to hide builder banner |
| `GROK_AUTH_*` | Only if using Grok OAuth broker in this environment |

After changing env vars: **Redeploy** Production (Deployments → … → Redeploy).

### Live CRM (Postgres)

When you are ready for a real multi-session CRM (not browser-only demo state):

1. Provision Postgres (Neon, Supabase, or Vercel Postgres) and set **`DATABASE_URL`** on **`split-rock-construction-kx9x`** for Production (and Preview if desired).
2. Set **`VITE_SPLIT_ROCK_DEMO=false`** so fictional seed jobs are hidden and `/app` requires operator sign-in.
3. Redeploy — `npm run build` runs **`migrations/*.sql`** automatically (`0001_auth.sql` + `0002_crm.sql` for clients, prospects, projects, bids, tours, proposals).
4. Operators sign in at `/login`; CRM changes persist per user in Postgres.

Without `DATABASE_URL`, the app keeps the demo / localStorage fallback so previews and tryouts still work.

---

## Ongoing: ship from `main`

### A. Automatic (preferred)

1. Merge / push to `main`:

```bash
git checkout main
git pull origin main
# …commit work…
git push origin main
```

2. Vercel builds on **`split-rock-construction-kx9x`** and promotes **Production** when the Production Branch is `main`.
3. Check deployment: Vercel → **`split-rock-construction-kx9x`** → **Deployments** → latest `main` commit is **Ready**.

### B. CLI from a clean `main` checkout

```bash
git checkout main
git pull origin main

# Link once per machine (team voxli + project split-rock-construction-kx9x)
npx vercel link

# Safety: refuse foreign / stale projects
npm run check:project

# Production deploy of current main
npx vercel --prod
```

`.vercel/project.json` is gitignored. If it points at IdeaSpeak, Archibald-Bagley, or stale `split-rock-construction`, delete `.vercel/` and re-link to **`split-rock-construction-kx9x`**.

### C. Pre-flight before you push

```bash
npm run check:project   # isolation guard
npm run typecheck       # generates route tree + tsc (same as CI)
npm test                # unit
npm run build           # production bundle (what Vercel runs)
```

---

## Custom domain (`splitrockconst.com`)

**Split Rock Construction owns this domain.** It is already on **`split-rock-construction-kx9x`**. Do not add or move it to IdeaSpeak, Archibald-Bagley, or the stale `split-rock-construction` project.

1. Vercel → **`split-rock-construction-kx9x`** → **Settings → Domains**.
2. Confirm `splitrockconst.com` and `www.splitrockconst.com` are listed.
3. At your DNS host, keep the records Vercel shows (apex A/ALIAS + `www` CNAME).
4. Set `BETTER_AUTH_URL` to `https://splitrockconst.com` and redeploy if you change origins.
5. Confirm the domain is **not** attached to `ideaspeak-app`, **Archibald-Bagley**, or stale `split-rock-construction`.

---

## Post-deploy checklist

- [ ] Open `https://splitrockconst.com` — marketing home loads (not blank).
- [ ] `/portal/login` — client sign-in page.
- [ ] `/login` — operator sign-in (Kipp/Kyle only after seed + `DATABASE_URL`).
- [ ] `/app` — command center (demo data only if `VITE_SPLIT_ROCK_DEMO` ≠ `false`).
- [ ] Browser console clean on home and portal.
- [ ] Mobile (~390px) — no horizontal scroll on marketing + portal.
- [ ] GitHub commit SHA on the deployment matches latest `main`.

---

## Rollback

1. Vercel → **`split-rock-construction-kx9x`** → Deployments → find last good **Production** deploy on `main`.
2. **⋯ → Promote to Production** (instant rollback).
3. Or `git revert` the bad commit on `main` and push (new deploy).

---

## Isolation rules (deploy safety)

| Do | Don’t |
| --- | --- |
| Deploy only `kipparchibald/split-rock-construction` | Link this repo to `ideaspeak-app` or **Archibald-Bagley** |
| Project name **`split-rock-construction-kx9x`** | Use stale `split-rock-construction` or new sandbox projects |
| Keep `splitrockconst.com` on **kx9x** only | Move Split Rock domains to IdeaSpeak, Archibald-Bagley, or stale project |
| Env vars only on **kx9x** | Copy IdeaSpeak `DATABASE_URL` / secrets here |
| Production branch `main` | Ship from random feature branches as Production |

See also [PROJECT.md](./PROJECT.md).

---

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Blank page / wrong MIME on JS | Ensure deploy used `npm run build` from this repo; hard-refresh; check Deployment logs |
| Auth loop / invalid origin | `BETTER_AUTH_URL` must equal the public HTTPS origin (`https://splitrockconst.com`) |
| Demo jobs in production | Set `VITE_SPLIT_ROCK_DEMO=false` and redeploy |
| Deployed wrong product | Re-link to **`split-rock-construction-kx9x`** — not stale `split-rock-construction` |
| `check:project` fails | `.vercel/project.json` points elsewhere — delete and `vercel link` to **kx9x** |

---

## Quick copy-paste (production)

```text
1. Vercel team voxli → project split-rock-construction-kx9x (NOT stale split-rock-construction)
2. Git: kipparchibald/split-rock-construction · Production Branch: main
3. Env: BETTER_AUTH_SECRET, BETTER_AUTH_URL=https://splitrockconst.com, DATABASE_URL, VITE_SPLIT_ROCK_DEMO=false
4. Domains: splitrockconst.com + www (already on kx9x)
5. Every later ship: git push origin main
```

---

## Automated deployment checks

Two GitHub Actions keep production honest:

| Workflow | When | What it does |
| --- | --- | --- |
| **Deploy production (main)** (`deploy-vercel.yml`) | Push to `main` or manual | Tests → Vercel `--prod` deploy → waits for **READY** → HTTP smoke (HTML + “Split Rock”) |
| **Vercel production check** (`vercel-deploy-check.yml`) | Every 6 hours + manual | Polls latest production deploy only (no ship) → same smoke test |

### Script (local or CI)

```bash
export VERCEL_TOKEN=…          # vercel.com/account/tokens
export VERCEL_ORG_ID=team_ZEZVchkfVnLrlfIFcBD32tFl
export VERCEL_PROJECT_ID=prj_… # split-rock-construction-kx9x → Settings → General
export VERCEL_PROJECT_NAME=split-rock-construction-kx9x  # optional override
# optional: export PRODUCTION_URL / DEPLOY_URL=https://splitrockconst.com
npm run check:deploy
```

Useful flags (env):

| Env | Purpose |
| --- | --- |
| `EXPECTED_SHA` | Fail if live deploy is not this git commit |
| `SKIP_WAIT=1` | Don’t poll — only inspect current latest |
| `ALLOW_SSO=1` | Soft-pass when Vercel Authentication blocks anonymous HTTP |
| `REQUIRE_TEXT` | Substring that must appear in HTML (default `Split Rock`) |

### GitHub Actions secrets (required once)

| Secret | Value |
| --- | --- |
| `VERCEL_TOKEN` | Create at [vercel.com/account/tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | `team_ZEZVchkfVnLrlfIFcBD32tFl` (voxli) |
| `VERCEL_PROJECT_ID` | `prj_…` from **`split-rock-construction-kx9x`** only (not stale `split-rock-construction`) |

Optional **variable** (not secret): `PRODUCTION_URL` = `https://splitrockconst.com` for smoke tests.

If secrets are missing, the deploy/check workflows fail fast with a clear error instead of a silent no-op.
