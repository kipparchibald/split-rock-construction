import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Building2, CheckCircle2, HardHat, MapPin, Phone, Shield, Ruler } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { COMPANY } from "@/data/seed";

export const Route = createFileRoute("/")({ component: LandingPage });

const services = [
  { title: "Custom homes", body: "Ranch to two-story farmhouse — designed for how Idaho families live.", icon: Building2 },
  { title: "Spec & production", body: "Efficient plan sets for developers who need quality without drama.", icon: Ruler },
  { title: "Accessible living", body: "Zero-threshold design, wide corridors, finishes that age well.", icon: HardHat },
  { title: "Safety-first sites", body: "Daily briefings, documented near-misses, crews who look out for each other.", icon: Shield },
];
const process = [
  { step: "01", title: "Listen", body: "Walk the lot, map priorities, lock a budget you can trust." },
  { step: "02", title: "Plan", body: "Permits, selections, and a schedule with real milestones." },
  { step: "03", title: "Build", body: "Superintendent-led crews, weekly owner updates, clean sites." },
  { step: "04", title: "Hand off", body: "Punch list closed, warranty clear, keys in hand." },
];

function LandingPage() {
  return (
    <div className="min-h-dvh bg-bg">
      <header className="sticky top-0 z-40 border-b border-border bg-bg-elevated">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-6 text-[13px] font-medium text-fg-muted md:flex">
            <a href="#services" className="hover:text-fg">Services</a>
            <a href="#process" className="hover:text-fg">Process</a>
            <a href="#work" className="hover:text-fg">Work</a>
            <a href="#product" className="hover:text-fg">Product</a>
            <a href="#contact" className="hover:text-fg">Contact</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex"><Link to="/app">Ops suite</Link></Button>
            <Button size="sm" asChild><a href="#contact">Start a project <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} /></a></Button>
          </div>
        </div>
      </header>

      <section className="border-b border-border">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-16">
          <div>
            <p className="label-caps mb-4 inline-flex items-center gap-2">
              <MapPin className="h-3 w-3" strokeWidth={1.75} />
              {COMPANY.location} · Residential
            </p>
            <h1 className="max-w-xl text-3xl font-medium tracking-[-0.03em] text-fg sm:text-4xl lg:text-[2.75rem] lg:leading-[1.12]">
              Homes built on solid ground.
            </h1>
            <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-fg-muted">
              Split Rock Construction builds residential homes with craft, schedule discipline,
              and a clear path toward commercial work when the right project shows up.
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              <Button size="lg" asChild><a href="#contact">Talk with us <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} /></a></Button>
              <Button size="lg" variant="outline" asChild><Link to="/app">Open field suite</Link></Button>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-4 border-t border-border pt-6">
              {[{ k: "Active builds", v: "4" }, { k: "Schedule hit", v: "94%" }, { k: "Lost-time", v: "0" }].map((s) => (
                <div key={s.k}>
                  <p className="label-caps">{s.k}</p>
                  <p className="mt-1 text-lg font-medium tabular-nums text-fg">{s.v}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="border border-border bg-bg-elevated p-6 sm:p-8">
            <div className="flex items-center justify-center border border-border bg-bg px-6 py-12">
              <img src="/logo.jpg" alt="Split Rock Construction — home built on split rock" className="h-44 w-auto object-contain sm:h-52" />
            </div>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {["Weekly owner walkthroughs", "Milestone billing", "Licensed & insured", "Local Idaho crews"].map((item) => (
                <div key={item} className="flex items-start gap-2 text-[13px] text-fg-muted">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-fg" strokeWidth={1.75} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="border-b border-border bg-bg-elevated">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
          <p className="label-caps">What we build</p>
          <h2 className="mt-2 max-w-xl text-2xl font-medium tracking-[-0.02em] sm:text-[1.75rem]">Residential first. Commercial when it fits.</h2>
          <div className="mt-8 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {services.map((s) => (
              <div key={s.title} className="bg-bg-elevated p-5">
                <s.icon className="mb-3 h-4 w-4 text-fg" strokeWidth={1.75} />
                <h3 className="text-[13px] font-medium">{s.title}</h3>
                <p className="mt-2 text-[12px] leading-relaxed text-fg-muted">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="process" className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
          <h2 className="text-2xl font-medium tracking-[-0.02em] sm:text-[1.75rem]">Process</h2>
          <div className="mt-8 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {process.map((p) => (
              <div key={p.step} className="bg-bg-elevated p-5">
                <span className="font-mono text-[11px] tabular-nums text-fg-subtle">{p.step}</span>
                <h3 className="mt-2 text-[13px] font-medium">{p.title}</h3>
                <p className="mt-2 text-[12px] leading-relaxed text-fg-muted">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="work" className="border-b border-border bg-bg-elevated">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-medium tracking-[-0.02em] sm:text-[1.75rem]">Active work</h2>
              <p className="mt-1 text-[13px] text-fg-muted">Snapshot from the field suite.</p>
            </div>
            <Button variant="outline" size="sm" asChild><Link to="/app/projects">All projects</Link></Button>
          </div>
          <div className="mt-6 grid gap-px border border-border bg-border md:grid-cols-3">
            {[
              { name: "Hart Residence", meta: "Boise · 2,840 sqft · MEP", pct: 62 },
              { name: "Willow Creek Farmhouse", meta: "Eagle · 3,120 sqft · Foundation", pct: 28 },
              { name: "Crestview Accessible", meta: "Meridian · 1,960 sqft · Punch list", pct: 94 },
            ].map((job) => (
              <div key={job.name} className="bg-bg-elevated p-5">
                <h3 className="text-[13px] font-medium">{job.name}</h3>
                <p className="mt-1 text-[12px] text-fg-muted">{job.meta}</p>
                <div className="mt-4 h-1 bg-bg-subtle"><div className="h-full bg-primary" style={{ width: `${job.pct}%` }} /></div>
                <p className="mt-2 text-[11px] tabular-nums text-fg-subtle">{job.pct}%</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      <section id="product" className="border-b border-border bg-bg-elevated">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
          <p className="label-caps">Field system · mobile</p>
          <h2 className="mt-2 max-w-xl text-2xl font-medium tracking-[-0.02em] sm:text-[1.75rem]">
            Built for the truck seat and the job trailer.
          </h2>
          <p className="mt-3 max-w-xl text-[13px] leading-relaxed text-fg-muted">
            Command center, job hub, draws, pricing, and owner portal — captured on a phone viewport.
          </p>
          <div className="mt-8 flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
            {[
              { src: "/mobile/02-command-center.png", label: "Command center" },
              { src: "/mobile/04-job-hub.png", label: "Job hub" },
              { src: "/mobile/06-draws.png", label: "Progress draws" },
              { src: "/mobile/05-pricing.png", label: "Bid & price" },
              { src: "/mobile/07-portal.png", label: "Owner portal" },
              { src: "/mobile/09-nav-drawer.png", label: "Navigation" },
              { src: "/mobile/08-daily-logs.png", label: "Daily logs" },
              { src: "/mobile/01-marketing.png", label: "Marketing" },
            ].map((s) => (
              <figure key={s.src} className="w-[220px] shrink-0 snap-start sm:w-[240px]">
                <div className="overflow-hidden rounded-[1.25rem] border border-border bg-bg shadow-[0_12px_40px_-20px_rgba(0,0,0,0.35)]">
                  <div className="flex items-center justify-center border-b border-border bg-bg-subtle py-1.5">
                    <span className="h-1 w-10 rounded-full bg-border-strong" />
                  </div>
                  <img
                    src={s.src}
                    alt={`Split Rock mobile — ${s.label}`}
                    className="h-[420px] w-full object-cover object-top sm:h-[460px]"
                    loading="lazy"
                  />
                </div>
                <figcaption className="mt-2 text-center text-[11px] font-medium uppercase tracking-[0.08em] text-fg-subtle">
                  {s.label}
                </figcaption>
              </figure>
            ))}
          </div>
          <div className="mt-8">
            <Button variant="outline" size="sm" asChild>
              <Link to="/app">Open the suite <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} /></Link>
            </Button>
          </div>
        </div>
      </section>

      <section id="contact" className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
          <div className="grid gap-8 border border-border bg-primary px-6 py-10 text-primary-fg sm:px-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <h2 className="text-2xl font-medium tracking-[-0.02em] sm:text-[1.75rem]">Ready to build?</h2>
              <p className="mt-3 max-w-md text-[13px] leading-relaxed text-primary-fg/75">Lot, plan, timeline. Response within one business day.</p>
              <div className="mt-6 flex flex-col gap-2 text-[13px]">
                <a href={`tel:${COMPANY.phone.replace(/\D/g, "")}`} className="inline-flex items-center gap-2 text-primary-fg/90 hover:text-primary-fg">
                  <Phone className="h-3.5 w-3.5" strokeWidth={1.75} />{COMPANY.phone}
                </a>
                <a href={`mailto:${COMPANY.email}`} className="inline-flex items-center gap-2 text-primary-fg/90 hover:text-primary-fg">{COMPANY.email}</a>
                <span className="inline-flex items-center gap-2 text-primary-fg/65"><MapPin className="h-3.5 w-3.5" strokeWidth={1.75} />{COMPANY.location}</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button size="lg" variant="secondary" className="bg-bg-elevated text-fg hover:bg-bg" asChild>
                <Link to="/app">Launch ops suite <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} /></Link>
              </Button>
              <p className="text-[11px] text-primary-fg/55">Projects, bids, pricing, crews, documents.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-bg-elevated">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Logo />
          <p className="text-[11px] text-fg-subtle">© {new Date().getFullYear()} {COMPANY.name}</p>
        </div>
      </footer>
    </div>
  );
}
