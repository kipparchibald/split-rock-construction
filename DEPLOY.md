# Deploy Split Rock Construction (`main`)

**Canonical repo:** [kipparchibald/split-rock-construction](https://github.com/kipparchibald/split-rock-construction)  
**Only branch to ship:** `main`  
**Vercel project name (exact):** `split-rock-construction`  
**Vercel team:** `voxli`  
**Never deploy this app into** `ideaspeak-app` or any other product project.

---

## What “done” looks like

| Surface | URL |
| --- | --- |
| Production (Vercel default) | `https://split-rock-construction.vercel.app` (or team slug variant) |
| Custom domain (when DNS ready) | `https://splitrockconst.com` + `www` |
| GitHub production branch | `main` only — Production Branch in Vercel must be **`main`** |

Every push to `main` should build and promote production when Git is connected.

---

## One-time: create the Vercel project from `main`

1. Open [Vercel](https://vercel.com) → team **voxli**.
2. **Add New… → Project**.
3. Import GitHub repo **`kipparchibald/split-rock-construction`** only.
4. Confirm settings:

| Setting | Value |
| --- | --- |
| Project name | `split-rock-construction` |
| Framework | Vite (auto-detect is fine) |
| Root directory | `.` (repo root) |
| Build command | `npm run build` |
| Install command | `npm install` (default) |
| Output | leave default (Nitro / Vercel preset from Vite build) |
| Production Branch | **`main`** |

5. Click **Deploy**. First deploy uses env defaults (demo data on).
6. After success: **Settings → Git** → Production Branch = **`main`**.  
   Disable auto-deploy from any other branch if any appear later.

> Do **not** create `split-rock-os`, `split-rock-field-os`, etc. Reuse this project forever.

---

## Environment variables (project Settings → Environment Variables)

Set for **Production** (and Preview if you want previews to match).

### Required for real operator sign-in

| Name | Production value | Notes |
| --- | --- | --- |
| `BETTER_AUTH_SECRET` | long random string (≥32 chars) | Generate once; never commit |
| `BETTER_AUTH_URL` | `https://splitrockconst.com` (or current prod URL) | Must match the public origin users hit |
| `DATABASE_URL` | Postgres connection string | Neon / Supabase / Vercel Postgres — **not** shared with IdeaSpeak |

### Product flags

| Name | Recommended production | Effect |
| --- | --- | --- |
| `VITE_SPLIT_ROCK_DEMO` | `false` | Hides fictional seed jobs (live empty CRM) |
| `VITE_AUTH_ENABLED` | omit or `true` | Set `false` only for temporary open demos |

### Optional

| Name | Purpose |
| --- | --- |
| `VITE_SHOW_BUILT_WITH_GROK` | `false` to hide builder banner |
| `GROK_AUTH_*` | Only if using Grok OAuth broker in this environment |

After changing env vars: **Redeploy** Production (Deployments → … → Redeploy).

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

2. Vercel builds from the Git integration and promotes **Production** when the Production Branch is `main`.
3. Check deployment: Vercel → project → **Deployments** → latest `main` commit is **Ready**.

### B. CLI from a clean `main` checkout

```bash
git checkout main
git pull origin main

# Link once per machine (pick team voxli + project split-rock-construction)
npx vercel link

# Safety: refuse foreign projects
npm run check:project

# Production deploy of current main
npx vercel --prod
```

`.vercel/project.json` is gitignored. If it ever points at IdeaSpeak, delete `.vercel/` and re-link.

### C. Pre-flight before you push

```bash
npm run check:project   # isolation guard
npm run typecheck       # generates route tree + tsc (same as CI)
npm test                # unit
npm run build           # production bundle (what Vercel runs)
```

---

## Custom domain (`splitrockconst.com`)

1. Vercel → **`split-rock-construction`** → **Settings → Domains**.
2. Add `splitrockconst.com` and `www.splitrockconst.com`.
3. At your DNS host, apply the records Vercel shows (apex A/ALIAS + `www` CNAME).
4. Set `BETTER_AUTH_URL` to `https://splitrockconst.com` and redeploy.
5. Confirm the domain is **not** attached to `ideaspeak-app`.

---

## Post-deploy checklist

- [ ] Open production URL — marketing home loads (not blank).
- [ ] `/portal/login` — client sign-in page.
- [ ] `/login` — operator sign-in (Kipp/Kyle only after seed + `DATABASE_URL`).
- [ ] `/app` — command center (demo data only if `VITE_SPLIT_ROCK_DEMO` ≠ `false`).
- [ ] Browser console clean on home and portal.
- [ ] Mobile (~390px) — no horizontal scroll on marketing + portal.
- [ ] GitHub commit SHA on the deployment matches latest `main`.

---

## Rollback

1. Vercel → Deployments → find last good **Production** deploy on `main`.
2. **⋯ → Promote to Production** (instant rollback).
3. Or `git revert` the bad commit on `main` and push (new deploy).

---

## Isolation rules (deploy safety)

| Do | Don’t |
| --- | --- |
| Deploy only `kipparchibald/split-rock-construction` | Link this repo to `ideaspeak-app` |
| Project name `split-rock-construction` | Create new Vercel projects per sandbox session |
| Env vars only on this project | Copy IdeaSpeak `DATABASE_URL` / secrets here |
| Production branch `main` | Ship from random feature branches as Production |

See also [PROJECT.md](./PROJECT.md).

---

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Blank page / wrong MIME on JS | Ensure deploy used `npm run build` from this repo; hard-refresh; check Deployment logs |
| Auth loop / invalid origin | `BETTER_AUTH_URL` must equal the public HTTPS origin |
| Demo jobs in production | Set `VITE_SPLIT_ROCK_DEMO=false` and redeploy |
| Deployed wrong product | You linked the wrong Vercel project — unlink, create/use `split-rock-construction` only |
| `check:project` fails | `.vercel/project.json` points elsewhere — delete and `vercel link` again |

---

## Quick copy-paste (first production)

```text
1. Vercel team voxli → New Project → import kipparchibald/split-rock-construction
2. Name: split-rock-construction · Production Branch: main
3. Env: BETTER_AUTH_SECRET, BETTER_AUTH_URL, DATABASE_URL, VITE_SPLIT_ROCK_DEMO=false
4. Deploy
5. Domains → splitrockconst.com + www
6. Every later ship: git push origin main
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
export VERCEL_PROJECT_ID=prj_… # Project → Settings → General
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
| `VERCEL_PROJECT_ID` | `prj_…` from the **split-rock-construction** project only |

Optional **variable** (not secret): `PRODUCTION_URL` = custom domain for smoke tests.

If secrets are missing, the deploy/check workflows fail fast with a clear error instead of a silent no-op.

