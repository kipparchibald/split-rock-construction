# Split Rock Construction — OS

Full product suite for **Split Rock Construction** (Rigby, ID residential + commercial GC).

## What's inside
- Marketing site + brand mark (split rock · home · stream)
- **Command center** — needs attention, field logs, cash draws
- **Job hub** — schedule, job cost, draws, change orders, selections, daily logs, docs, owner view, closeout, realty dual-capacity
- **Book of Plans** — three core ranch + basement packages (Teton 1580, Jefferson 1520, Split Rock 1620) with allowances, elevation options, draw templates, and start-job-from-plan path
- **Bid & price** — transparent fixed-price / cost-plus / build-to-close + draw schedules
- **Bid board** — kanban pipeline (draft → submitted → won/lost) with pipeline value
- **Owner portal** — client-facing progress, decisions, money, and **Matterport 3D tour** embed when a project has a `matterportId`
- **Schedule** — multi-job Gantt phase timeline with late flags and crew context
- **Crews & equipment** — assign people/crews/assets to jobs, service-due alerts, daily labor burn
- Cost codes + QuickBooks-ready exports, cost alerts, lien-waiver tracking, commercial pay apps
- Clients CRM cards (jobs + bids), safety, documents (permits / inspections / contracts)

## Recent additions
1. **Book of Plans** (`/app/plans`) — catalog, pricing, allowances, elevation options
2. **Contract / DocuSign-ready surface** — types + closing package + lien-waiver status
3. **First-client / Teton Heights path** — Cole Spec Lot 7 + plan seeding model
4. **Matterport** — optional `matterportId` on projects; iframe tour in owner portal (Hart + Crestview seeded)
5. **Permits & inspections** — expanded `DocType` + pass/fail actions in Documents
6. **Scheduling** — multi-job Gantt with today line, late phases, residential/commercial filter
7. **Ops depth (Aug 2026)** — bid kanban, crew/equipment assignment, client CRM cards, service windows

## Run
```bash
npm run dev   # 0.0.0.0:8080
```

## Deploy (`main` → Vercel)

Production ships **only from `main`** to the Vercel project **`split-rock-construction-kx9x`** (team **voxli**). Custom domain **`splitrockconst.com`** is on that project — do **not** use the stale Vercel project named `split-rock-construction` (no `-kx9x`). Domain belongs to Split Rock Construction only — not IdeaSpeak or Archibald-Bagley (see [PROJECT.md](./PROJECT.md)).

Full steps, env vars, domain, and rollback: **[DEPLOY.md](./DEPLOY.md)**  
Product isolation rules: **[PROJECT.md](./PROJECT.md)**

```bash
git push origin main          # auto-deploy when Git is connected
# or
npx vercel --prod             # CLI, after vercel link to split-rock-construction-kx9x
```

Inspired by strengths of Buildertrend (client + residential), CoConstruct (custom homes), and Procore (document/job cost spine) — simplified for a small GC in Eastern Idaho.

## Mobile screenshots

Phone viewport captures (390×844) live under `public/mobile/`:

| Screen | File |
| --- | --- |
| Marketing | `01-marketing.png` |
| Command center | `02-command-center.png` |
| Jobs list | `03-jobs.png` |
| Job hub | `04-job-hub.png` |
| Bid & price | `05-pricing.png` |
| Progress draws | `06-draws.png` |
| Owner portal | `07-portal.png` |
| Daily logs | `08-daily-logs.png` |
| Nav drawer | `09-nav-drawer.png` |

## Testing

```bash
npm test           # Vitest unit tests (pricing math, draws, finance)
npm run test:e2e   # Playwright E2E (desktop + mobile) — starts dev server if needed
npm run test:all   # unit + e2e
```

| Layer | Tool | Coverage |
| --- | --- | --- |
| Unit | Vitest | `src/lib/pricing.ts` — contract price, draw totals, builder finance |
| E2E | Playwright | Smoke, command center, job hub, pricing, draws, portal, daily logs |
| CI | GitHub Actions | `.github/workflows/ci.yml` on `main` / PRs |

E2E projects: `desktop-chromium`, `mobile-chrome` (Pixel 7).
