import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Building2, Calculator, CalendarRange, ClipboardList, Eye, FileText, HardHat,
  LayoutDashboard, Menu, NotebookPen, Banknote, Shield, Users, Wallet, Wrench,
  Factory, Scale, Layers, Bell, FileSignature, Landmark, Palette, BookOpen,
  ShoppingBag, type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { isDemoDataEnabled, DEMO_BANNER } from "@/lib/runtime-config";

type NavItem = { to: string; label: string; icon: LucideIcon; exact?: boolean };
type NavGroup = { label: string; items: NavItem[] };

const groups: NavGroup[] = [
  {
    label: "Home",
    items: [
      { to: "/app", label: "Command center", icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: "Jobs",
    items: [
      { to: "/app/projects", label: "All jobs", icon: Building2 },
      { to: "/app/plans", label: "Book of Plans", icon: BookOpen },
      { to: "/app/commercial", label: "Commercial", icon: Factory },
      { to: "/app/closing", label: "Closing", icon: Scale },
      { to: "/app/schedule", label: "Schedule", icon: CalendarRange },
      { to: "/app/daily-logs", label: "Daily logs", icon: NotebookPen },
      { to: "/app/documents", label: "Documents", icon: FileText },
      { to: "/app/permits", label: "Permits / EIPH", icon: Landmark },
      { to: "/app/design", label: "Design center", icon: Palette },
      { to: "/app/finish-partners", label: "Finish partners", icon: ShoppingBag },
    ],
  },
  {
    label: "Money",
    items: [
      { to: "/app/pricing", label: "Bid & price", icon: Calculator },
      { to: "/app/bids", label: "Bid board", icon: ClipboardList },
      { to: "/app/budget", label: "Job cost", icon: Wallet },
      { to: "/app/cost-codes", label: "Cost codes / QB", icon: Layers },
      { to: "/app/draws", label: "Draws", icon: Banknote },
      { to: "/app/alerts", label: "Cost alerts", icon: Bell },
      { to: "/app/waivers", label: "Lien waivers", icon: FileSignature },
    ],
  },
  {
    label: "Field",
    items: [
      { to: "/app/crews", label: "Crews", icon: HardHat },
      { to: "/app/equipment", label: "Equipment", icon: Wrench },
      { to: "/app/safety", label: "Safety", icon: Shield },
      { to: "/app/subs", label: "Sub insurance", icon: FileSignature },
    ],
  },
  {
    label: "People",
    items: [
      { to: "/app/clients", label: "Clients", icon: Users },
      { to: "/app/portal", label: "Owner portal", icon: Eye },
    ],
  },
];

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      {groups.map((g) => (
        <div key={g.label}>
          <p className="label-caps mb-1.5 px-3">{g.label}</p>
          <nav className="flex flex-col gap-px">
            {g.items.map((item) => {
              const active = item.exact
                ? pathname === item.to
                : pathname === item.to || pathname.startsWith(`${item.to}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium tracking-[0.01em] transition-colors",
                    active ? "bg-primary text-primary-fg" : "text-fg-muted hover:bg-bg-subtle hover:text-fg",
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" strokeWidth={1.75} />
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

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-bg">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col border-r border-border bg-bg-elevated lg:flex">
        <div className="border-b border-border px-4 py-3.5">
          <Link to="/" className="block"><Logo /></Link>
        </div>
        <div className="flex-1 overflow-y-auto py-3">
          <NavLinks pathname={pathname} />
        </div>
        <div className="border-t border-border px-4 py-3">
          <p className="text-[11px] leading-relaxed text-fg-subtle">
            Split Rock OS<br />
            <span className="text-fg-muted">Residential & commercial GC</span>
          </p>
        </div>
      </aside>

      <div className="lg:pl-56">
        <header className="sticky top-0 z-20 flex h-12 items-center gap-3 border-b border-border bg-bg-elevated px-4 sm:px-6">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu className="h-4 w-4" strokeWidth={1.75} />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-56 p-0">
              <SheetHeader className="border-b border-border px-4 py-3.5">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <Logo />
              </SheetHeader>
              <div className="overflow-y-auto py-3">
                <NavLinks pathname={pathname} onNavigate={() => setOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>
          <div className="min-w-0 flex-1 lg:hidden">
            <Logo variant="mark" showWordmark markClassName="h-7" />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-[11px] uppercase tracking-[0.08em] text-fg-subtle sm:inline">Field system</span>
            <div className="flex h-7 w-7 items-center justify-center bg-primary text-[10px] font-medium tracking-[0.06em] text-primary-fg">SR</div>
          </div>
        </header>
        <main className="px-4 py-5 sm:px-6 sm:py-6">
          {isDemoDataEnabled ? (
            <div className="mb-4 border border-border bg-bg-elevated px-3 py-2 text-[11px] leading-relaxed text-fg-muted">
              {DEMO_BANNER}
            </div>
          ) : null}
          {children}
        </main>
      </div>
    </div>
  );
}
