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

      <MarketingFooter />
    </div>
  );
}
