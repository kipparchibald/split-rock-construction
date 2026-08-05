import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink, ShoppingBag } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_CONTRACT_MODEL,
  feePolicyFor,
} from "@/lib/contract-fee-policy";
import {
  affiliateDisclosureFor,
  CATEGORY_LABELS,
  FINISH_PARTNERS,
  PARTNER_AFFILIATE_IDS,
  type FinishCategory,
  partnersForCategory,
  shopUrl,
} from "@/lib/finish-partners";
import { loadJson, PERSIST_KEYS } from "@/lib/local-persist";
import type { ContractModel } from "@/lib/pricing";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/finish-partners")({ component: FinishPartnersPage });

const ALL_CATS = Object.keys(CATEGORY_LABELS) as FinishCategory[];

function FinishPartnersPage() {
  const [cat, setCat] = useState<FinishCategory | "all">("all");
  const contractModel = loadJson<ContractModel>(PERSIST_KEYS.contractModel, DEFAULT_CONTRACT_MODEL);
  const feePolicy = feePolicyFor(contractModel);
  const disclosure = affiliateDisclosureFor(contractModel);

  const list = useMemo(() => {
    if (cat === "all") return FINISH_PARTNERS;
    return partnersForCategory(cat);
  }, [cat]);

  const tracked = Object.keys(PARTNER_AFFILIATE_IDS).filter((k) => PARTNER_AFFILIATE_IDS[k]?.trim());

  return (
    <div>
      <PageHeader
        title="Finish partners"
        description="Preferred suppliers for finishes. Referral treatment follows the contract type set on Bid & price — never a hidden fee."
      />

      <div className="mb-4 border border-border bg-bg-elevated px-4 py-3 text-[12px] leading-relaxed text-fg-muted">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{feePolicy.title}</Badge>
          <span className="text-[11px] text-fg-subtle">{feePolicy.referralHandlingLabel}</span>
          <Button size="sm" variant="ghost" className="ml-auto h-7 px-2" asChild>
            <Link to="/app/pricing">Change on Bid & price</Link>
          </Button>
        </div>
        <p className="mt-2 font-medium text-fg">{disclosure}</p>
        <p className="mt-2 text-[11px] text-fg-subtle">{feePolicy.noHiddenFeesPromise}</p>
        <p className="mt-2 text-[11px] text-fg-subtle">
          {tracked.length > 0
            ? `${tracked.length} partner ID(s) configured: ${tracked.join(", ")}.`
            : "No affiliate IDs configured yet — Shop links open public catalogs until you paste tracking URLs in src/lib/finish-partners.ts (PARTNER_AFFILIATE_IDS)."}
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        <Chip active={cat === "all"} onClick={() => setCat("all")}>
          All
        </Chip>
        {ALL_CATS.map((c) => (
          <Chip key={c} active={cat === c} onClick={() => setCat(c)}>
            {CATEGORY_LABELS[c]}
          </Chip>
        ))}
      </div>

      <ul className="divide-y divide-border border border-border">
        {list.map((p) => {
          const url = shopUrl(p, cat === "all" ? undefined : cat);
          const hasId = Boolean(PARTNER_AFFILIATE_IDS[p.id]?.trim());
          return (
            <li key={p.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[14px] font-medium">{p.name}</span>
                  <Badge variant={p.kind === "affiliate" ? "secondary" : "outline"}>
                    {p.kind === "affiliate" ? "Affiliate" : p.kind === "trade" ? "Trade" : "Local referral"}
                  </Badge>
                  {hasId ? <Badge variant="success">Tracking on</Badge> : null}
                </div>
                <p className="mt-1 text-[12px] leading-relaxed text-fg-muted">{p.notes}</p>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-fg-subtle">
                  {p.typicalCommission ? <span>Rate: {p.typicalCommission}</span> : null}
                  {p.network ? <span>Network: {p.network}</span> : null}
                  {p.idahoNote ? <span className="text-fg-muted">{p.idahoNote}</span> : null}
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {p.categories.map((c) => (
                    <span
                      key={c}
                      className="border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-[0.06em] text-fg-subtle"
                    >
                      {CATEGORY_LABELS[c]}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex shrink-0 flex-col gap-2">
                <Button size="sm" asChild>
                  <a href={url} target="_blank" rel="noopener noreferrer sponsored">
                    <ShoppingBag className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.75} />
                    Shop
                    <ExternalLink className="ml-1.5 h-3 w-3 opacity-70" strokeWidth={1.75} />
                  </a>
                </Button>
                {p.applyUrl ? (
                  <Button size="sm" variant="outline" asChild>
                    <a href={p.applyUrl} target="_blank" rel="noopener noreferrer">
                      Join program
                    </a>
                  </Button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-6 border border-border bg-bg-elevated p-4 text-[12px] leading-relaxed text-fg-muted">
        <p className="font-medium text-fg">Setup checklist</p>
        <ol className="mt-2 list-decimal space-y-1 pl-4">
          <li>Set contract type on Bid & price so disclosures match the signed deal.</li>
          <li>On cost-plus, prefer trade discounts; credit any referral to Job Cost.</li>
          <li>Paste tracking URLs into PARTNER_AFFILIATE_IDS only after network approval.</li>
          <li>Copy the fee transparency clause into the owner agreement.</li>
        </ol>
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "border px-2.5 py-1 text-[11px] font-medium tracking-[0.02em] transition-colors",
        active ? "border-primary bg-primary text-primary-fg" : "border-border text-fg-muted hover:bg-bg-subtle",
      )}
    >
      {children}
    </button>
  );
}
