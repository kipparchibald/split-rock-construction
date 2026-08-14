import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand/logo";
import { COMPANY } from "@/lib/company";

export function MarketingFooter() {
  return (
    <footer className="bg-bg-elevated pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex flex-col gap-1">
          <Logo />
          <p className="text-[11px] text-fg-subtle">
            Lots · build-to-suit · land-home packages · Rigby & Jefferson County
          </p>
          <a
            href={`https://${COMPANY.website}`}
            className="text-[11px] text-fg-subtle hover:text-fg"
          >
            {COMPANY.website}
          </a>
          <p className="text-[11px] text-fg-subtle">{COMPANY.idahoContractorRegistrationLabel}</p>
        </div>
        <div className="flex flex-col items-start gap-1 sm:items-end">
          <a href={COMPANY.phoneHref} className="text-[11px] text-fg-subtle hover:text-fg">
            {COMPANY.phone}
          </a>
          <Link to="/estimate" className="text-[11px] text-fg-subtle hover:text-fg">
            Lot + build estimate
          </Link>
          <Link to="/agents" className="text-[11px] text-fg-subtle hover:text-fg">
            Agent referral
          </Link>
          <Link to="/portal/login" className="text-[11px] text-fg-subtle hover:text-fg">
            Client portal
          </Link>
          <Link to="/login" className="text-[11px] text-fg-subtle hover:text-fg">
            Operator sign-in
          </Link>
          <p className="text-[11px] text-fg-subtle">
            © {new Date().getFullYear()} Split Rock Construction
          </p>
        </div>
      </div>
    </footer>
  );
}
