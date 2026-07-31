# Split Rock Construction — OS

Full product suite for **Split Rock Construction** (Rigby, ID residential builder).

## What's inside
- Marketing site + brand mark (split rock · home · stream)
- **Command center** — needs attention, field logs, cash draws
- **Job hub** — schedule, job cost, draws, change orders, selections, daily logs, docs, owner view
- **Bid & price** — transparent fixed-price / cost-plus / build-to-close + draw schedules
- **Owner portal** — client-facing progress & decisions
- Crews, equipment, safety, documents, clients

## Run
```bash
npm run dev   # 0.0.0.0:8080
```

Inspired by strengths of Buildertrend (client + residential), CoConstruct (custom homes), and Procore (document/job cost spine) — simplified for a small GC.


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
