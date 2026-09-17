# Job experience template (next client after Holwege)

Holwege is the **flagship** public case study + owner portal seed. Spin the next residential job from the same pattern — do not invent a parallel OS.

## Locked-dollar rule

- Construction dollars live in a dedicated `src/data/<job>-money.ts` (or extend an existing SoT module).
- Import figures only; **never invent** cost of work, contingency, P&O, contract, or deposit amounts.
- Land / lot sale dollars stay **out** of `project.budget` unless the construction contract explicitly includes them.
- Public pages and portal UI must use the same constants (via imports), not hard-coded literals.

## Public case study route

1. Add a marketing route (e.g. `src/routes/work.<slug>.tsx`) modeled on `work.holwege.tsx`.
2. Reuse `BuildJourneyRail` + `DEFAULT_RESIDENTIAL_PHASES` from `src/lib/build-journey.ts` / `src/components/build-journey-rail.tsx`.
3. Include sections that mirror the Holwege playbook: challenge, approach, money stack, timeline (journey rail), owner experience, same playbook, gallery, CTA.
4. Gallery: prefer real site photos under `/public/site-photos/` plus phase art SVGs; label honestly (aerial / lifestyle / phase art). No “placeholder” framing.
5. **No PII on public pages** beyond what owners have approved for marketing (no emails, phones, invite codes, portal tokens, or private addresses beyond lot marketing context).

## Owner portal seed

1. Seed client + project in `src/data/` (see `holwege-money.ts` / `holwege.ts` / `holwege-portal.ts`).
2. Portal at `/app/portal` already renders `BuildJourneyRail` (variant `portal`) and a **This week** card from project phase / milestones / draws.
3. Label signing deposits as **signing deposit** — never “Draw 1”.
4. Owner-safe document titles only; wire letterhead PDFs via document `reference` paths when available.
5. Live invite codes stay in **server env** — never ship invites in the client bundle or email credentials from seed code.

## Contract template

- Reuse `contracts/templates/idaho-cost-plus-residential/` (letterhead PDF + markdown template).
- Job-specific executed agreements live under `contracts/<Client>/` — keep SoT notes aligned with money modules.

## Checklist for a new job

- [ ] Locked money module (import-only figures)
- [ ] Client + project seed (phase, schedule, milestones)
- [ ] Draws + owner-safe documents
- [ ] Public case study route + home/work CTA if featured
- [ ] Portal journey rail resolves from `project.phase`
- [ ] No invite codes / secrets on public or client bundles
- [ ] `npx tsc --noEmit -p .` clean

## Shared journey module

```ts
import { DEFAULT_RESIDENTIAL_PHASES } from "@/lib/build-journey";
import { BuildJourneyRail } from "@/components/build-journey-rail";

<BuildJourneyRail
  phases={[...DEFAULT_RESIDENTIAL_PHASES]}
  current="Site" // or project.phase / mapToDefaultPhase(project.phase)
  variant="marketing" // or "portal"
/>
```

Phases: Site → Foundation → Framing → MEP → Insulation → Finishes → Walkthrough.
