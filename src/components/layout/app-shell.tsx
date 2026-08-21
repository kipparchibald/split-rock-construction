import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Building2,
  Calculator,
  CalendarRange,
  ClipboardList,
  Eye,
  FileText,
  HardHat,
  LayoutDashboard,
  Menu,
  MoreHorizontal,
  NotebookPen,
  Banknote,
  Shield,
  Users,
  Wallet,
  Wrench,
  Factory,
  Scale,
  Layers,
  Bell,
  FileSignature,
  Landmark,
  Palette,
  BookOpen,
  ShoppingBag,
  Radio,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { ModeCallout } from "@/components/layout/mode-callout";

type NavItem = { to: string; label: string; icon: LucideIcon; exact?: boolean };
type NavGroup = { label: string; items: NavItem[] };

const groups: NavGroup[] = [
  {
    label: "Home",
    items: [
      { to: "/app", label: "Command center", icon: LayoutDashboard, exact: true },
      { to: "/app/field", label: "Field board", icon: Radio },
    ],
  },
  {
    label: "Jobs",
    items: [
      { to: "/app/projects", label: "All jobs", icon: Building2 },
      { to: "/app/plans", label: "Book of Plans", icon: BookOpen },
      { to: "/app/schedule", label: "Schedule", icon: CalendarRange },
      { to: "/app/daily-logs", label: "Daily logs", icon: NotebookPen },
    ],
  },
  {
    label: "Money",
    items: [
      { to: "/app/pricing", label: "Bid & price", icon: Calculator },
      { to: "/app/bids", label: "Bid board", icon: ClipboardList },
      { to: "/app/draws", label: "Draws", icon: Banknote },
      { to: "/app/budget", label: "Job cost", icon: Wallet },
    ],
  },
  {
    label: "Clients & Close",
    items: [
      { to: "/app/portal", label: "Owner portal", icon: Eye },
      { to: "/app/clients", label: "Clients", icon: Users },
      { to: "/app/prospects", label: "Prospects", icon: Users },
      { to: "/app/teton-heights", label: "Teton Heights", icon: Landmark },
      { to: "/app/proposals", label: "Proposals", icon: FileText },
      { to: "/app/closing", label: "Closing", icon: Scale },
      { to: "/app/commercial", label: "Commercial", icon: Factory },
    ],
  },
  {
    label: "Tools",
    items: [
      { to: "/app/documents", label: "Documents", icon: FileText },
      { to: "/app/permits", label: "Permits / EIPH", icon: Landmark },
      { to: "/app/design", label: "Design center", icon: Palette },
      { to: "/app/cost-codes", label: "Cost codes / QB", icon: Layers },
      { to: "/app/waivers", label: "Lien waivers", icon: FileSignature },
      { to: "/app/alerts", label: "Cost alerts", icon: Bell },
      { to: "/app/crews", label: "Crews", icon: HardHat },
      { to: "/app/equipment", label: "Equipment", icon: Wrench },
      { to: "/app/safety", label: "Safety", icon: Shield },
      { to: "/app/subs", label: "Sub insurance", icon: FileSignature },
      { to: "/app/finish-partners", label: "Finish partners", icon: ShoppingBag },
    ],
  },
];

/** Primary field-first destinations on phone bottom bar */
const bottomNav: NavItem[] = [
  { to: "/app/field", label: "Field", icon: Radio },
  { to: "/app/projects", label: "Jobs", icon: Building2 },
  { to: "/app/daily-logs", label: "Logs", icon: NotebookPen },
  { to: "/app/portal", label: "Portal", icon: Eye },
];

function isActive(pathname: string, item: NavItem) {
  if (item.exact) return pathname === item.to;
  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      {groups.map((g) => (
        <div key={g.label}>
          <p className="label-caps mb-1.5 px-3">{g.label}</p>
          <nav className="flex flex-col gap-px">
            {g.items.map((item) => {
              const active = isActive(pathname, item);
              const Icon = item.icon;
              return (
                <Link
                  key={`${g.label}-${item.to}`}
                  to={item.to}
                  onClick={onNavigate}
                  className={cn(
                    "flex min-h-11 items-center gap-2.5 px-3 py-2.5 text-[13px] font-medium tracking-[0.01em] transition-colors",
                    active ? "bg-primary text-primary-fg" : "text-fg-muted hover:bg-bg-subtle hover:text-fg",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0 opacity-80" strokeWidth={1.75} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      ))}
    </div>
  );
}

export function AppShell({
  children,
  clientMode = false,
}: {
  children: React.ReactNode;
  /** Client portal session — hide operator nav, lock to /app/portal */
  clientMode?: boolean;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  // "More" highlighted when current route is not one of the four primary tabs
  const onPrimaryTab = bottomNav.some((item) => isActive(pathname, item));

  if (clientMode) {
    return (
      <div className="min-h-dvh bg-bg client-portal-mode" data-testid="client-shell">
        <ModeCallout audience="client" className="border-b border-x-0 border-t-0 text-center" />
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col border-r border-border bg-bg-elevated pt-[env(safe-area-inset-top)] lg:flex">
          <div className="border-b border-border px-4 py-3.5">
            <Logo className="h-8" />
            <p className="mt-1 text-[10px] uppercase tracking-[0.08em] text-fg-subtle">Client portal</p>
          </div>
          <nav className="flex-1 px-2 py-4">
            <Link
              to="/app/portal"
              className="flex min-h-11 items-center gap-2.5 bg-primary px-3 py-2.5 text-[13px] font-medium text-primary-fg"
            >
              <Eye className="h-4 w-4" strokeWidth={1.75} />
              My home build
            </Link>
            <p className="mt-4 px-2 text-[11px] leading-relaxed text-fg-subtle">
              Private to your household. Other clients cannot see your jobs or money.
            </p>
            <Link
              to="/portal/login"
              className="mt-4 block px-2 text-[12px] text-fg-muted underline-offset-2 hover:underline"
            >
              Switch account
            </Link>
          </nav>
        </aside>
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-bg-elevated/95 px-3 pt-[env(safe-area-inset-top)] backdrop-blur-sm lg:hidden">
          <Logo className="h-8" />
          <Button size="sm" variant="outline" asChild>
            <Link to="/portal/login">Switch</Link>
          </Button>
        </header>
        <div className="lg:pl-56">
          <main className="px-4 py-5 pb-[calc(4.5rem+env(safe-area-inset-bottom))] sm:px-6 lg:pb-8">
            {children}
          </main>
        </div>
        <nav
          data-testid="mobile-bottom-nav"
          className="fixed inset-x-0 bottom-0 z-20 flex border-t border-border bg-bg-elevated pb-[env(safe-area-inset-bottom)] lg:hidden"
        >
          <Link
            to="/app/portal"
            className="flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-fg"
          >
            <Eye className="h-4 w-4" strokeWidth={1.75} />
            My build
          </Link>
        </nav>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-bg">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col border-r border-border bg-bg-elevated pt-[env(safe-area-inset-top)] lg:flex">
        <div className="border-b border-border px-4 py-3.5">
          <Link to="/" className="block">
            <Logo />
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto py-3">
          <NavLinks pathname={pathname} />
        </div>
        <div className="border-t border-border px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <p className="text-[11px] leading-relaxed text-fg-subtle">
            Split Rock OS
            <br />
            <span className="text-fg-muted">Residential & commercial GC</span>
          </p>
        </div>
      </aside>

      <div className="lg:pl-56">
        <header className="sticky top-0 z-20 flex h-12 items-center gap-3 border-b border-border bg-bg-elevated px-4 pt-[env(safe-area-inset-top)] sm:px-6 lg:h-12">
          <div className="flex h-12 w-full items-center gap-3">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="min-h-11 min-w-11 lg:hidden"
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5" strokeWidth={1.75} />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[min(100%,18rem)] p-0 pt-[env(safe-area-inset-top)]">
                <SheetHeader className="border-b border-border px-4 py-3.5">
                  <SheetTitle className="sr-only">Navigation</SheetTitle>
                  <Logo />
                </SheetHeader>
                <div className="overflow-y-auto py-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
                  <NavLinks pathname={pathname} onNavigate={() => setOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>
            <div className="min-w-0 flex-1 lg:hidden">
              <Logo variant="mark" showWordmark markClassName="h-7" />
            </div>
            <div className="ml-auto flex items-center gap-3">
              <span className="hidden text-[11px] uppercase tracking-[0.08em] text-fg-subtle sm:inline">
                Field system
              </span>
              <div className="flex h-8 w-8 items-center justify-center bg-primary text-[10px] font-medium tracking-[0.06em] text-primary-fg">
                SR
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 py-5 pb-[calc(4.5rem+env(safe-area-inset-bottom))] sm:px-6 sm:py-6 lg:pb-6">
          <ModeCallout className="mb-4" />
          {children}
        </main>

        {/* Field-first bottom nav — phones / tablets only */}
        <nav
          className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg-elevated pb-[env(safe-area-inset-bottom)] lg:hidden"
          aria-label="Primary"
          data-testid="mobile-bottom-nav"
        >
          <div className="grid h-14 grid-cols-5">
            {bottomNav.map((item) => {
              const active = isActive(pathname, item);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex min-h-14 flex-col items-center justify-center gap-0.5 text-[10px] font-medium tracking-[0.02em] transition-colors",
                    active ? "text-fg" : "text-fg-subtle",
                  )}
                >
                  <Icon
                    className={cn("h-5 w-5", active ? "opacity-100" : "opacity-70")}
                    strokeWidth={active ? 2 : 1.75}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <button
              type="button"
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-0.5 text-[10px] font-medium tracking-[0.02em] transition-colors",
                !onPrimaryTab ? "text-fg" : "text-fg-subtle",
              )}
              aria-label="More menu"
              data-testid="mobile-more-nav"
              onClick={() => setOpen(true)}
            >
              <MoreHorizontal
                className={cn("h-5 w-5", !onPrimaryTab ? "opacity-100" : "opacity-70")}
                strokeWidth={!onPrimaryTab ? 2 : 1.75}
              />
              <span>More</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}
