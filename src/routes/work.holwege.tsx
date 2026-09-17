import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import { BuildJourneyRail } from "@/components/build-journey-rail";
import { Logo } from "@/components/brand/logo";
import { MarketingFooter } from "@/components/layout/marketing-footer";
import { Button } from "@/components/ui/button";
import {
  HOLWEGE_CONTRACT,
  HOLWEGE_COST_OF_WORK,
  HOLWEGE_OWNER_CONTINGENCY,
  HOLWEGE_PO,
  HOLWEGE_SIGNING_DEPOSIT,
} from "@/data/holwege-money";
import { DEFAULT_RESIDENTIAL_PHASES } from "@/lib/build-journey";
import { COMPANY } from "@/lib/company";
import { cn, formatCurrencyExact } from "@/lib/utils";

export const Route = createFileRoute("/work/holwege")({
  head: () => ({
    meta: [
      {
        title:
          "Holwege Residence · Lot 16, Teton Heights | Split Rock Construction",
      },
      {
        name: "description",
        content:
          "One-level ADA-forward custom home on crawl, Rigby / Jefferson County — land + build under one team. Transparent cost-plus construction with owner portal.",
      },
      {
        property: "og:title",
        content: "Holwege Residence · Lot 16 | Split Rock Construction",
      },
      {
        property: "og:description",
        content:
          "Custom one-level on Lot 16, Teton Heights — designed for how you live. Target window Sep 30, 2026 – May 30, 2027.",
      },
      { property: "og:image", content: "/site-photos/aerial-1.jpg" },
    ],
  }),
  component: HolwegeCaseStudyPage,
});

const marketingBtnPrimary =
  "bg-forest text-forest-fg hover:bg-forest/90 border-transparent focus-visible:ring-forest";

const BADGES = [
  "~2,602 sf",
  "3 bed",
  "2 bath",
  "3-car",
  "Well + septic",
  "Crawl",
] as const;

const MONEY_ROWS = [
  { label: "Cost of work", amount: HOLWEGE_COST_OF_WORK },
  { label: "Owner contingency (5%)", amount: HOLWEGE_OWNER_CONTINGENCY },
  { label: "Split Rock P&O (10% of cost of work)", amount: HOLWEGE_PO },
] as const;

const GALLERY = [
  {
    src: "/site-photos/aerial-1.jpg",
    label: "Aerial",
    caption: "Teton Heights lot context",
    kind: "photo" as const,
  },
  {
    src: "/site-photos/aerial-2.webp",
    label: "Aerial",
    caption: "Division layout · paved roads",
    kind: "photo" as const,
  },
  {
    src: "/site-photos/rigby-lifestyle.webp",
    label: "Lifestyle",
    caption: "Rigby / Jefferson County setting",
    kind: "photo" as const,
  },
  {
    src: "/site-photos/site.svg",
    label: "Site",
    caption: "Phase art · site & utilities",
    kind: "art" as const,
  },
  {
    src: "/site-photos/foundation.svg",
    label: "Foundation",
    caption: "Phase art · foundation",
    kind: "art" as const,
  },
  {
    src: "/site-photos/framing.svg",
    label: "Framing",
    caption: "Phase art · framing",
    kind: "art" as const,
  },
  {
    src: "/site-photos/mep.svg",
    label: "MEP",
    caption: "Phase art · rough-in",
    kind: "art" as const,
  },
  {
    src: "/site-photos/finish.svg",
    label: "Finishes",
    caption: "Phase art · interiors",
    kind: "art" as const,
  },
] as const;

const OWNER_MOMENTS = [
  {
    title: "Portal decision",
    body: "Finish and allowance choices land in the household portal with a due date, a written scope note, and one approve path — no scattered texts.",
  },
  {
    title: "Weekly field note",
    body: "Each week you get a short field note: what the crew finished, what’s next, and any weather or inspection blockers — same voice as the site log.",
  },
  {
    title: "Draw clarity",
    body: "Milestone draws show amount, trigger, and status before money moves. The signing deposit is labeled as a signing deposit — credited to Draw 1, never relabeled.",
  },
  {
    title: "Walkthrough",
    body: "Punch and final walkthrough are scheduled against the published window. Punch items stay visible until closed — CO is claimed only when achieved.",
  },
] as const;

const PLAYBOOK = [
  {
    title: "Owner portal",
    body: "One private household login for decisions, schedule, documents, money, and field updates.",
  },
  {
    title: "Transparent cost-plus",
    body: "Published cost of work, owner contingency, and P&O — contingency moves only on a signed change order.",
  },
  {
    title: "Milestone draws",
    body: "Draw schedule tied to real construction gates, with a clear signing deposit separate from progress draws.",
  },
  {
    title: "Written decisions",
    body: "Selections and change orders are recorded in writing with status you can see — not buried in email threads.",
  },
] as const;

const APPROACH = [
  "Land already closed — construction contract covers the home only.",
  "River Bend Drafting plan set (8-31-2026b).",
  "Cost-plus / no GMP with the published money stack below.",
  "Owner portal for decisions, schedule, money, and field updates.",
] as const;

function HolwegeCaseStudyPage() {
  return (
    <div className="min-h-dvh bg-bg-elevated" data-testid="holwege-case-study">
      <header className="sticky top-0 z-40 border-b border-border bg-bg-elevated/95 pt-[env(safe-area-inset-top)] backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-6 text-[13px] font-medium text-fg-muted md:flex">
            <Link to="/" className="hover:text-forest">
              Home
            </Link>
            <Link to="/work/holwege" className="text-forest">
              Work
            </Link>
            <a href="#money" className="hover:text-forest">
              Money
            </a>
            <a href="#timeline" className="hover:text-forest">
              Timeline
            </a>
            <a href="#experience" className="hover:text-forest">
              Experience
            </a>
            <a href="#cta" className="hover:text-forest">
              Contact
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
              <Link to="/portal/login">Client portal</Link>
            </Button>
            <Button size="sm" asChild className={cn(marketingBtnPrimary)}>
              <a href="/#contact">Start a build conversation</a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-sand">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12">
          <div>
            <p className="label-caps-accent mb-4 inline-flex items-center gap-2 rounded-sm bg-forest-light px-2.5 py-1">
              Featured build · Lot 16
            </p>
            <h1 className="text-3xl font-medium tracking-[-0.03em] text-fg sm:text-4xl">
              Custom one-level on Lot 16 — designed for how you live.
            </h1>
            <p className="mt-4 text-[14px] leading-relaxed text-fg-muted">
              Flagship client experience on Lot 16, Teton Heights Div 6 — Jefferson County,
              Idaho. Built by {COMPANY.legalName} · Idaho Contractor Registration{" "}
              {COMPANY.idahoContractorRegistration}.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {BADGES.map((b) => (
                <span
                  key={b}
                  className="rounded-sm border border-sand bg-bg px-2.5 py-1 text-[11px] font-medium text-fg-muted"
                >
                  {b}
                </span>
              ))}
            </div>
            <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Button size="lg" asChild className={cn("min-h-11", marketingBtnPrimary)}>
                <a href="/#contact">
                  Start a build conversation
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild className="min-h-11">
                <Link to="/portal/login">Client portal</Link>
              </Button>
            </div>
          </div>
          <figure className="overflow-hidden rounded-md border border-sand">
            <div className="aspect-[4/3] w-full bg-earth-light">
              <img
                src="/site-photos/aerial-1.jpg"
                alt="Aerial view of Teton Heights lots near Rigby, Idaho"
                className="marketing-photo h-full w-full object-cover"
                width={800}
                height={600}
                loading="eager"
                decoding="async"
              />
            </div>
            <figcaption className="border-t border-sand bg-earth-light/50 px-4 py-2.5 text-[11px] text-fg-muted">
              Teton Heights Division #6 · Rigby / Jefferson County
            </figcaption>
          </figure>
        </div>
      </section>

      {/* Challenge */}
      <section className="border-b border-border" id="challenge">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
          <p className="label-caps-accent">The challenge</p>
          <h2 className="mt-2 max-w-2xl text-2xl font-medium tracking-[-0.02em] sm:text-[1.75rem]">
            One-level living on a rural lot — with cost clarity from day one.
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-md border border-sand bg-bg p-5">
              <h3 className="text-[13px] font-medium">ADA-forward layout</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-fg-muted">
                One-level plan with a zero-entry path from garage into the house. Crawl space, well,
                septic, and laterals to existing gas, power, and fiber at the lot.
              </p>
            </div>
            <div className="rounded-md border border-sand bg-bg p-5">
              <h3 className="text-[13px] font-medium">One accountable team</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-fg-muted">
                Owners wanted clarity on cost-plus math and a single builder — not a land agent plus
                a separate GC. Land closed separately; this case study is construction only.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Approach */}
      <section className="border-b border-border bg-bg" id="approach">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
          <p className="label-caps-accent">The approach</p>
          <h2 className="mt-2 max-w-2xl text-2xl font-medium tracking-[-0.02em]">
            Published stack. Owner portal. Plans you can walk.
          </h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {APPROACH.map((item) => (
              <li key={item} className="flex items-start gap-2 text-[13px] text-fg-muted">
                <CheckCircle2
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-forest"
                  strokeWidth={1.75}
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Specs */}
      <section className="border-b border-border" id="home">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
          <p className="label-caps-accent">The home</p>
          <h2 className="mt-2 text-2xl font-medium tracking-[-0.02em]">Specs — marketing-safe</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { k: "Footprint", v: "~77'-6\" × 57'-1\"" },
              { k: "Walls / roof", v: "9' walls · 6:12 roof" },
              { k: "Crawl", v: "4' crawl space" },
              { k: "Garage", v: "~29'-8\" × 37'-11\" · zero entry" },
              { k: "Climate Zone 6", v: "R-49 attic / R-21 walls (high-level)" },
              { k: "Exterior", v: "Vinyl + brick veneer · architectural shingles" },
            ].map((row) => (
              <div key={row.k} className="rounded-md border border-sand bg-bg-elevated p-4">
                <p className="label-caps">{row.k}</p>
                <p className="mt-1 text-[13px] font-medium text-fg">{row.v}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-[13px] text-fg-muted">
            Want a similar plan on another Teton Heights lot?{" "}
            <Link to="/estimate" className="text-forest underline-offset-2 hover:underline">
              Price a lot + build
            </Link>{" "}
            or{" "}
            <a href="/#contact" className="text-forest underline-offset-2 hover:underline">
              start a conversation
            </a>
            .
          </p>
        </div>
      </section>

      {/* Money */}
      <section className="border-b border-border bg-bg" id="money">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
          <p className="label-caps-accent">How the money works</p>
          <h2 className="mt-2 text-2xl font-medium tracking-[-0.02em]">
            Transparent, bounded construction stack
          </h2>
          <div className="mt-6 max-w-xl overflow-hidden rounded-md border border-sand bg-bg-elevated">
            <div className="divide-y divide-border">
              {MONEY_ROWS.map((row) => (
                <div
                  key={row.label}
                  className="flex items-baseline justify-between gap-4 px-4 py-3 text-[13px]"
                >
                  <span className="text-fg-muted">{row.label}</span>
                  <span className="shrink-0 font-medium tabular-nums text-fg">
                    {formatCurrencyExact(row.amount)}
                  </span>
                </div>
              ))}
              <div className="flex items-baseline justify-between gap-4 bg-forest-light/40 px-4 py-3.5 text-[14px]">
                <span className="font-medium text-fg">Construction contract</span>
                <span className="shrink-0 font-medium tabular-nums text-fg">
                  {formatCurrencyExact(HOLWEGE_CONTRACT)}
                </span>
              </div>
            </div>
          </div>
          <ul className="mt-5 max-w-2xl space-y-2 text-[13px] leading-relaxed text-fg-muted">
            <li>
              Signing deposit:{" "}
              <span className="font-medium tabular-nums text-fg">
                {formatCurrencyExact(HOLWEGE_SIGNING_DEPOSIT)}
              </span>
              .
            </li>
            <li>
              Progress draws after deposit against construction milestones (permit/mobilization,
              foundation, dried-in, MEP/insulation, finishes, CO/closeout).
            </li>
            <li>
              Contingency is owner reserve — not profit and not finish upgrades; it moves only on a
              signed change order.
            </li>
          </ul>
          <p className="mt-4 text-[13px] text-fg-muted">
            Owners: see live cost rollup in your portal —{" "}
            <Link to="/portal/login" className="text-forest underline-offset-2 hover:underline">
              client sign-in
            </Link>
            .
          </p>
        </div>
      </section>

      {/* Timeline */}
      <section className="border-b border-border" id="timeline">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
          <p className="label-caps-accent">Timeline</p>
          <h2 className="mt-2 text-2xl font-medium tracking-[-0.02em]">
            Target construction window
          </h2>
          <p className="mt-3 text-[15px] font-medium text-fg">
            September 30, 2026 – May 30, 2027
          </p>
          <p className="mt-1 text-[12px] text-fg-subtle">
            Target dates — certificate of occupancy is not claimed until achieved. Journey shown
            at Site (pre-start).
          </p>
          <div className="mt-6">
            <BuildJourneyRail
              phases={[...DEFAULT_RESIDENTIAL_PHASES]}
              current="Site"
              variant="marketing"
            />
          </div>
        </div>
      </section>

      {/* Owner experience */}
      <section className="border-b border-border bg-bg" id="experience">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
          <p className="label-caps-accent">Owner experience</p>
          <h2 className="mt-2 max-w-2xl text-2xl font-medium tracking-[-0.02em]">
            Week-to-week clarity — not a black box.
          </h2>
          <p className="mt-3 max-w-2xl text-[13px] leading-relaxed text-fg-muted">
            Holwege owners get the same operating rhythm we design for every residential job:
            written decisions, field notes, and money that matches the contract.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {OWNER_MOMENTS.map((m, i) => (
              <div
                key={m.title}
                className="rounded-md border border-sand bg-bg-elevated p-5"
              >
                <p className="label-caps text-forest">Moment {i + 1}</p>
                <h3 className="mt-2 text-[14px] font-medium text-fg">{m.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-fg-muted">{m.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Same playbook */}
      <section className="border-b border-border" id="playbook">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
          <p className="label-caps-accent">Same playbook for every client</p>
          <h2 className="mt-2 max-w-2xl text-2xl font-medium tracking-[-0.02em]">
            Holwege is the flagship template — not a one-off.
          </h2>
          <p className="mt-3 max-w-2xl text-[13px] leading-relaxed text-fg-muted">
            Future builds inherit the same OS: portal, transparent cost-plus stack, milestone
            draws, and written decisions. Your lot changes; the experience pattern does not.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PLAYBOOK.map((p) => (
              <div key={p.title} className="rounded-md border border-sand bg-bg-elevated p-5">
                <div className="mb-3 h-0.5 w-8 rounded-full bg-forest/70" />
                <h3 className="text-[13px] font-medium">{p.title}</h3>
                <p className="mt-2 text-[12px] leading-relaxed text-fg-muted">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process / trust */}
      <section className="border-b border-border bg-bg" id="trust">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
          <p className="label-caps-accent">Process & trust</p>
          <h2 className="mt-2 max-w-xl text-2xl font-medium tracking-[-0.02em]">
            Written budgets. Milestone draws. Weekly field notes.
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              {
                title: "Owner portal",
                body: "Decisions, schedule, money, and field updates in one private household login.",
              },
              {
                title: "Idaho §45-525",
                body: "Initial and completion disclosures as part of our compliance posture — details in your contract package.",
              },
              {
                title: "Dual-capacity disclosed",
                body: "Builder role and any prior lot representation are disclosed in writing. This page is construction marketing only.",
              },
            ].map((card) => (
              <div key={card.title} className="rounded-md border border-sand bg-bg-elevated p-5">
                <div className="mb-3 h-0.5 w-8 rounded-full bg-forest/70" />
                <h3 className="text-[13px] font-medium">{card.title}</h3>
                <p className="mt-2 text-[12px] leading-relaxed text-fg-muted">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="border-b border-border" id="gallery">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
          <p className="label-caps-accent">Gallery</p>
          <h2 className="mt-2 text-2xl font-medium tracking-[-0.02em]">
            Site context & phase art
          </h2>
          <p className="mt-2 max-w-xl text-[13px] text-fg-muted">
            Aerial and lifestyle photos of the Rigby / Teton Heights setting, plus phase art for
            the build journey. Interior owner photos stay portal-only by default.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {GALLERY.map((g) => (
              <figure
                key={`${g.label}-${g.src}`}
                className="overflow-hidden rounded-md border border-sand bg-bg"
              >
                <div
                  className={cn(
                    "aspect-square bg-earth-light/30",
                    g.kind === "photo"
                      ? "overflow-hidden"
                      : "flex items-center justify-center p-6",
                  )}
                >
                  <img
                    src={g.src}
                    alt={
                      g.kind === "photo"
                        ? `${g.label}: ${g.caption}`
                        : `${g.label} phase illustration`
                    }
                    className={cn(
                      g.kind === "photo"
                        ? "marketing-photo h-full w-full object-cover"
                        : "h-16 w-16 opacity-70",
                    )}
                    width={g.kind === "photo" ? 400 : 64}
                    height={g.kind === "photo" ? 400 : 64}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <figcaption className="border-t border-sand px-3 py-2">
                  <p className="text-[12px] font-medium text-fg">{g.label}</p>
                  <p className="text-[10px] text-fg-subtle">{g.caption}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
          <div className="grid gap-8 overflow-hidden rounded-md border border-forest/20 bg-forest px-6 py-10 text-forest-fg sm:px-10 lg:grid-cols-[1.25fr_0.75fr] lg:items-center">
            <div>
              <h2 className="text-2xl font-medium tracking-[-0.02em] sm:text-[1.75rem]">
                Build with the same clarity on your lot.
              </h2>
              <p className="mt-3 max-w-md text-[13px] leading-relaxed text-forest-fg/80">
                Call or email Split Rock — lots, build-to-suit, or land-home packages in Rigby and
                Jefferson County.
              </p>
              <div className="mt-6 flex flex-col gap-2 text-[13px]">
                <a
                  href={COMPANY.phoneHref}
                  className="inline-flex min-h-11 items-center gap-2 text-forest-fg/90 hover:text-forest-fg"
                >
                  <Phone className="h-3.5 w-3.5" strokeWidth={1.75} />
                  {COMPANY.phone}
                </a>
                <a
                  href={`mailto:${COMPANY.emailKipp}?subject=Split%20Rock%20—%20build%20inquiry`}
                  className="inline-flex min-h-11 items-center gap-2 text-forest-fg/90 hover:text-forest-fg"
                >
                  <Mail className="h-3.5 w-3.5" strokeWidth={1.75} />
                  {COMPANY.emailKipp}
                </a>
                <span className="inline-flex items-center gap-2 text-forest-fg/70">
                  <MapPin className="h-3.5 w-3.5" strokeWidth={1.75} />
                  Rigby · Jefferson County, Idaho
                </span>
                <span className="text-[12px] text-forest-fg/65">
                  {COMPANY.idahoContractorRegistrationLabel}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                size="lg"
                variant="secondary"
                className="min-h-11 bg-bg-elevated text-forest hover:bg-earth-light"
                asChild
              >
                <a href={COMPANY.lotsUrl} target="_blank" rel="noreferrer">
                  View Teton Heights lots
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
                </a>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="min-h-11 border-forest-fg/35 text-forest-fg hover:bg-forest-fg/10"
                asChild
              >
                <Link to="/estimate">Lot + build estimate</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="min-h-11 border-forest-fg/35 text-forest-fg hover:bg-forest-fg/10"
                asChild
              >
                <Link to="/portal/login">Client portal</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
