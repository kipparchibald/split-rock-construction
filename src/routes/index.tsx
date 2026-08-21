import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  MapPin,
  Menu,
  Phone,
  Ruler,
  Home,
  LandPlot,
  Layers,
  Mail,
  X,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { MarketingFooter } from "@/components/layout/marketing-footer";
import { Button } from "@/components/ui/button";
import { COMPANY } from "@/lib/company";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: LandingPage });

const MARKETING_LOCATION = "Rigby · Jefferson County, Idaho";

const SITE_PHOTOS = {
  aerial1: "/site-photos/aerial-1.jpg",
  aerial2: "/site-photos/aerial-2.webp",
  lifestyle: "/site-photos/rigby-lifestyle.webp",
} as const;

const NAV_LINKS = [
  { href: "#lots", label: "Lots" },
  { href: "#build", label: "Build" },
  { href: "#coming", label: "Coming soon" },
  { href: "#why", label: "Why us" },
  { href: "#contact", label: "Contact" },
];

const pathways = [
  {
    title: "Buy a lot",
    body: "Build-ready parcels in Teton Heights Division #6 — 0.6+ acres, utilities to the lot line, owner financing available.",
    icon: LandPlot,
    cta: "View available lots",
    href: COMPANY.lotsUrl,
    external: true,
  },
  {
    title: "Build to suit",
    body: "We design and build your custom home on a lot you choose — one team from site walk to keys, schedule, and budget you can trust.",
    icon: Home,
    cta: "Start a build conversation",
    href: "#contact",
    external: false,
  },
  {
    title: "Land + home package",
    body: "Pair a Teton Heights lot with a Split Rock plan. Ranch and basement packages sized for these parcels — selections, permits, and construction under one roof.",
    icon: Layers,
    cta: "Ask about packages",
    href: "#contact",
    external: false,
  },
];

const lotHighlights = [
  "0.6+ acre flat, buildable parcels",
  "Paved roads; power, gas & fiber to the lot",
  "Private well sites pre-approved · simple septic",
  "No HOA fees — Jefferson County rural taxes",
  "Basements practical — no high groundwater",
  "Owner financing available — skip the bank",
];

const whyUs = [
  {
    title: "Land and build, together",
    body: "Most buyers juggle a land agent and a separate builder. We sell the ground and build the home — fewer handoffs, clearer accountability.",
  },
  {
    title: "Eastern Idaho focus",
    body: "Rigby, Jefferson County, Idaho Falls, and the Upper Valley. We know the county process, EIPH, and what it actually costs to put a house on these lots.",
  },
  {
    title: "Clear process",
    body: "Written budgets, milestone draws, weekly updates, and a defined path from lot reservation through certificate of occupancy.",
  },
];

const marketingBtnPrimary =
  "bg-forest text-forest-fg hover:bg-forest/90 border-transparent focus-visible:ring-forest";

function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-bg-elevated">
      <header className="sticky top-0 z-40 border-b border-border bg-bg-elevated/95 pt-[env(safe-area-inset-top)] backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-6 text-[13px] font-medium text-fg-muted md:flex">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} className="hover:text-forest">
                {l.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="hidden md:inline-flex">
              <Link to="/portal/login">Client portal</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="hidden md:inline-flex">
              <Link to="/login">Operator sign-in</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
              <a href={COMPANY.lotsUrl} target="_blank" rel="noreferrer">
                Lot inventory
              </a>
            </Button>
            <Button size="sm" asChild className={cn("hidden sm:inline-flex", marketingBtnPrimary)}>
              <a href={COMPANY.phoneHref}>Call {COMPANY.phone}</a>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              data-testid="marketing-menu-btn"
              onClick={() => setMenuOpen((o) => !o)}
            >
              {menuOpen ? (
                <X className="h-5 w-5" strokeWidth={1.75} />
              ) : (
                <Menu className="h-5 w-5" strokeWidth={1.75} />
              )}
            </Button>
          </div>
        </div>
        {menuOpen ? (
          <div
            className="border-t border-border bg-bg-elevated px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden"
            data-testid="marketing-mobile-nav"
          >
            <nav className="flex flex-col gap-0.5">
              {NAV_LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className="flex min-h-11 items-center px-2 text-[14px] font-medium text-fg"
                  onClick={() => setMenuOpen(false)}
                >
                  {l.label}
                </a>
              ))}
              <a
                href={COMPANY.lotsUrl}
                target="_blank"
                rel="noreferrer"
                className="flex min-h-11 items-center px-2 text-[14px] font-medium text-fg-muted"
                onClick={() => setMenuOpen(false)}
              >
                Lot inventory
              </a>
              <a
                href={COMPANY.phoneHref}
                className={cn(
                  "mt-2 flex min-h-11 items-center justify-center gap-2 px-3 text-[13px] font-medium",
                  marketingBtnPrimary,
                )}
              >
                <Phone className="h-4 w-4" strokeWidth={1.75} />
                Call {COMPANY.phone}
              </a>
              <Link
                to="/portal/login"
                className="flex min-h-11 items-center justify-center text-[13px] font-medium text-fg-muted"
                onClick={() => setMenuOpen(false)}
              >
                Client portal
              </Link>
              <Link
                to="/login"
                className="flex min-h-11 items-center justify-center text-[13px] font-medium text-fg-muted"
                onClick={() => setMenuOpen(false)}
              >
                Operator sign in
              </Link>
            </nav>
          </div>
        ) : null}
      </header>

      {/* Hero */}
      <section className="border-b border-sand">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12">
          <div>
            <p className="label-caps-accent mb-4 inline-flex items-center gap-2 rounded-sm bg-forest-light px-2.5 py-1">
              <MapPin className="h-3 w-3" strokeWidth={1.75} />
              {MARKETING_LOCATION}
            </p>
            <h1 className="max-w-xl text-3xl font-medium tracking-[-0.03em] text-fg sm:text-4xl lg:text-[2.65rem] lg:leading-[1.12]">
              Lots to build on. Homes built to suit.
            </h1>
            <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-fg-muted">
              Split Rock brings land and construction together for families in Rigby and Eastern Idaho.
              Choose a build-ready lot in Teton Heights Division #6 — or let us design and build your
              home on the ground you pick.
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              <Button size="lg" asChild className={marketingBtnPrimary}>
                <a href={COMPANY.lotsUrl} target="_blank" rel="noreferrer">
                  Browse Teton Heights lots
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
                </a>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="border-earth/40 text-forest hover:bg-earth-light"
              >
                <a href="#contact">Talk build-to-suit</a>
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 border-t border-sand pt-6 text-[13px] text-fg-muted">
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-forest" strokeWidth={1.75} />
                Lots available now
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-forest" strokeWidth={1.75} />
                Custom & package builds
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-forest" strokeWidth={1.75} />
                Hunter Chase — coming soon
              </span>
            </div>
          </div>
          <figure className="relative overflow-hidden rounded-md border border-sand shadow-sm">
            <div className="aspect-[4/3] w-full max-h-[420px] sm:max-h-none">
              <img
                src={SITE_PHOTOS.aerial1}
                alt="Aerial view of Teton Heights Division 6 — paved roads and build-ready lots in Rigby, Idaho"
                className="marketing-photo"
                width={960}
                height={720}
                fetchPriority="high"
                decoding="async"
              />
            </div>
            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-forest/80 to-transparent px-4 pb-3 pt-10 text-[11px] font-medium tracking-wide text-white/95">
              Teton Heights Division #6 · Rigby, Idaho
            </figcaption>
          </figure>
        </div>
      </section>

      {/* Pathways */}
      <section id="build" className="border-b border-border bg-earth-light/40">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
          <p className="label-caps-accent">How we work with you</p>
          <h2 className="mt-2 max-w-xl text-2xl font-medium tracking-[-0.02em] sm:text-[1.75rem]">
            Three clear paths into a home on solid ground.
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {pathways.map((p) => (
              <div
                key={p.title}
                className="flex flex-col rounded-md border border-sand bg-bg-elevated p-5 sm:p-6"
              >
                <p.icon className="mb-3 h-4 w-4 text-forest" strokeWidth={1.75} />
                <h3 className="text-[14px] font-medium">{p.title}</h3>
                <p className="mt-2 flex-1 text-[12px] leading-relaxed text-fg-muted">{p.body}</p>
                <a
                  href={p.href}
                  {...(p.external ? { target: "_blank", rel: "noreferrer" } : {})}
                  className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-medium text-forest hover:underline"
                >
                  {p.cta}
                  <ArrowRight className="h-3 w-3" strokeWidth={1.75} />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Teton Heights Div 6 */}
      <section id="lots" className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
          <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-start lg:gap-14">
            <div>
              <p className="label-caps-accent">Available now</p>
              <h2 className="mt-2 text-2xl font-medium tracking-[-0.02em] sm:text-[1.75rem]">
                Teton Heights Division #6
              </h2>
              <p className="mt-1 text-[13px] text-fg-muted">Rigby, Idaho · Jefferson County</p>
              <p className="mt-4 max-w-md text-[14px] leading-relaxed text-fg-muted">
                Spacious residential lots priced at <strong className="text-fg">$99,500</strong> —
                minimum 0.6 acres, many larger. Roads, power, gas, and fiber are in. Pre-approved well
                sites and straightforward septic keep the path to a building permit clear.
              </p>
              <figure className="mt-6 overflow-hidden rounded-md border border-sand lg:hidden">
                <div className="aspect-[16/10] w-full">
                  <img
                    src={SITE_PHOTOS.aerial2}
                    alt="Top-down aerial of Teton Heights lot layout and paved roads"
                    className="marketing-photo"
                    width={800}
                    height={500}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </figure>
              <div className="mt-6 flex flex-wrap gap-2">
                <Button asChild className={marketingBtnPrimary}>
                  <a href={COMPANY.lotsUrl} target="_blank" rel="noreferrer">
                    Open rigbylots.com
                    <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </a>
                </Button>
                <Button variant="outline" asChild className="border-earth/40 hover:bg-earth-light">
                  <a href="#contact">Reserve a lot · talk build</a>
                </Button>
              </div>
            </div>
            <div className="space-y-4">
              <figure className="hidden overflow-hidden rounded-md border border-sand lg:block">
                <div className="aspect-[16/10] w-full">
                  <img
                    src={SITE_PHOTOS.aerial2}
                    alt="Top-down aerial of Teton Heights lot layout and paved roads"
                    className="marketing-photo"
                    width={800}
                    height={500}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </figure>
              <div className="rounded-md border border-sand bg-earth-light/30 p-5 sm:p-6">
                <p className="label-caps-accent mb-4">What each lot includes</p>
                <ul className="space-y-2.5">
                  {lotHighlights.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-[13px] text-fg-muted">
                      <CheckCircle2
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-forest"
                        strokeWidth={1.75}
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-5 border-t border-sand pt-4 text-[11px] leading-relaxed text-fg-subtle">
                  Live inventory, plats, and documents are maintained at{" "}
                  <a
                    href={COMPANY.lotsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-forest underline-offset-2 hover:underline"
                  >
                    rigbylots.com
                  </a>
                  . No forced builder — bring your own or build with Split Rock.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lifestyle + Hunter Chase */}
      <section id="coming" className="border-b border-border bg-bg-elevated">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-stretch lg:gap-10">
            <figure className="overflow-hidden rounded-md border border-sand">
              <div className="aspect-[4/3] h-full min-h-[220px] w-full lg:aspect-auto lg:min-h-[280px]">
                <img
                  src={SITE_PHOTOS.lifestyle}
                  alt="Country road through Rigby, Idaho with the Teton range on the horizon at golden hour"
                  className="marketing-photo"
                  width={800}
                  height={560}
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <figcaption className="border-t border-sand bg-earth-light/50 px-4 py-2.5 text-[11px] text-fg-muted">
                Eastern Idaho living — Rigby & the Upper Valley
              </figcaption>
            </figure>
            <div className="flex flex-col justify-center rounded-md border border-sand bg-earth-light/20 p-6 sm:p-8">
              <span className="inline-flex w-fit items-center rounded-sm border border-earth/30 bg-earth-light px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-earth">
                Coming soon
              </span>
              <h2 className="mt-3 text-2xl font-medium tracking-[-0.02em] sm:text-[1.75rem]">
                Hunter Chase
              </h2>
              <p className="mt-1 text-[13px] text-fg-muted">
                Preliminary plat · ~160 residential lots · ±1-acre average · near 3800 E & 100 N, Rigby
              </p>
              <p className="mt-4 text-[14px] leading-relaxed text-fg-muted">
                A larger-lot community in the entitlement pipeline. When lots release, the same Split
                Rock offer applies: buy the ground, or pair it with a build-to-suit or land-home
                package. Join the interest list for first notice.
              </p>
              <div className="mt-6">
                <Button size="lg" asChild className={marketingBtnPrimary}>
                  <a href="#contact">
                    Get on the interest list
                    <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why us */}
      <section id="why" className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
          <p className="label-caps-accent">Why Split Rock</p>
          <h2 className="mt-2 max-w-xl text-2xl font-medium tracking-[-0.02em] sm:text-[1.75rem]">
            Real estate background. Construction company. Local accountability.
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {whyUs.map((w) => (
              <div
                key={w.title}
                className="rounded-md border border-sand bg-bg-elevated p-5 sm:p-6"
              >
                <div className="mb-3 h-0.5 w-8 rounded-full bg-forest/70" />
                <h3 className="text-[13px] font-medium">{w.title}</h3>
                <p className="mt-2 text-[12px] leading-relaxed text-fg-muted">{w.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="flex gap-3 rounded-md border border-sand p-4">
              <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-forest" strokeWidth={1.75} />
              <div>
                <p className="text-[13px] font-medium">Custom & package homes</p>
                <p className="mt-1 text-[12px] text-fg-muted">
                  Ranch and basement plans suited to 0.6–1 acre parcels. Selections, permits, and field
                  supervision in one process.
                </p>
              </div>
            </div>
            <div className="flex gap-3 rounded-md border border-sand p-4">
              <Ruler className="mt-0.5 h-4 w-4 shrink-0 text-forest" strokeWidth={1.75} />
              <div>
                <p className="text-[13px] font-medium">Numbers before dirt moves</p>
                <p className="mt-1 text-[12px] text-fg-muted">
                  Clear scope, written allowances, and a draw schedule tied to real milestones — so
                  you always know where the money and the schedule stand.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
          <div className="grid gap-8 overflow-hidden rounded-md border border-forest/20 bg-forest px-6 py-10 text-forest-fg sm:px-10 lg:grid-cols-[1.25fr_0.75fr] lg:items-center">
            <div>
              <h2 className="text-2xl font-medium tracking-[-0.02em] sm:text-[1.75rem]">
                Ready to pick a lot or plan a build?
              </h2>
              <p className="mt-3 max-w-md text-[13px] leading-relaxed text-forest-fg/80">
                Tell us whether you want land only, a land-home package, or a custom build-to-suit.
                We respond within one business day.
              </p>
              <div className="mt-6 flex flex-col gap-2 text-[13px]">
                <a
                  href={COMPANY.phoneHref}
                  className="inline-flex items-center gap-2 text-forest-fg/90 hover:text-forest-fg"
                >
                  <Phone className="h-3.5 w-3.5" strokeWidth={1.75} />
                  {COMPANY.phone}
                </a>
                <a
                  href={`mailto:${COMPANY.emailKipp}?subject=Split%20Rock%20—%20lot%20or%20build%20inquiry`}
                  className="inline-flex items-center gap-2 text-forest-fg/90 hover:text-forest-fg"
                >
                  <Mail className="h-3.5 w-3.5" strokeWidth={1.75} />
                  {COMPANY.emailKipp}
                </a>
                <a
                  href={`mailto:${COMPANY.emailKyle}?subject=Split%20Rock%20—%20lot%20or%20build%20inquiry`}
                  className="inline-flex items-center gap-2 text-forest-fg/90 hover:text-forest-fg"
                >
                  <Mail className="h-3.5 w-3.5" strokeWidth={1.75} />
                  {COMPANY.emailKyle}
                </a>
                <span className="inline-flex items-center gap-2 text-forest-fg/70">
                  <MapPin className="h-3.5 w-3.5" strokeWidth={1.75} />
                  {MARKETING_LOCATION}
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
                className="bg-bg-elevated text-forest hover:bg-earth-light"
                asChild
              >
                <a href={COMPANY.lotsUrl} target="_blank" rel="noreferrer">
                  See lots at rigbylots.com
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
                </a>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-forest-fg/35 text-forest-fg hover:bg-forest-fg/10"
                asChild
              >
                <a href={`mailto:${COMPANY.emailKipp}?subject=Hunter%20Chase%20interest%20list`}>
                  Hunter Chase interest list
                </a>
              </Button>
              <p className="text-[11px] text-forest-fg/60">
                Kipp Archibald · Kyle · land, lots & build conversations
              </p>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
