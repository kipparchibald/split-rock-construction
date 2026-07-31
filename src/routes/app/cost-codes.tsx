import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, FileJson, Layers, Package, Table2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/data/store";
import { activeCostCodes, type CostCode, type CostCodeGroup } from "@/lib/cost-codes";
import { portfolioPnl } from "@/lib/job-cost";
import {
  downloadTextFile,
  exportCostCodeChartCsv,
  exportQbClassesCsv,
  exportQbJobCostLinesCsv,
  exportQbProductsServicesCsv,
  exportQbSyncScaffoldJson,
  filenameForExport,
} from "@/lib/qb-export";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/cost-codes")({ component: CostCodesPage });

const GROUP_LABEL: Record<CostCodeGroup, string> = {
  income: "Income / revenue",
  hard: "Hard costs",
  soft: "Soft costs",
  resource: "Resources",
  contingency: "Contingency",
  overhead: "Fee / OH&P",
};

function CostCodesPage() {
  const projects = useAppStore((s) => s.projects);
  const budgetLines = useAppStore((s) => s.budgetLines);
  const draws = useAppStore((s) => s.draws);
  const changeOrders = useAppStore((s) => s.changeOrders);
  const selections = useAppStore((s) => s.selections);
  const subcontracts = useAppStore((s) => s.subcontracts);
  const payApplications = useAppStore((s) => s.payApplications);

  const [scope, setScope] = useState<"all" | "residential" | "commercial">("all");
  const [group, setGroup] = useState<"all" | CostCodeGroup>("all");

  const codes = useMemo(() => {
    return activeCostCodes().filter((c) => {
      if (scope !== "all" && c.scope !== "both" && c.scope !== scope) return false;
      if (group !== "all" && c.group !== group) return false;
      return true;
    });
  }, [scope, group]);

  const pnls = useMemo(
    () =>
      portfolioPnl(projects, {
        budgetLines,
        draws,
        changeOrders,
        selections,
        subcontracts,
        payApplications,
      }),
    [projects, budgetLines, draws, changeOrders, selections, subcontracts, payApplications],
  );

  function exportClasses() {
    downloadTextFile(filenameForExport("classes"), exportQbClassesCsv(), "text/csv;charset=utf-8");
  }
  function exportProducts() {
    downloadTextFile(
      filenameForExport("products"),
      exportQbProductsServicesCsv(),
      "text/csv;charset=utf-8",
    );
  }
  function exportChart() {
    downloadTextFile(filenameForExport("chart"), exportCostCodeChartCsv(), "text/csv;charset=utf-8");
  }
  function exportJobLines() {
    downloadTextFile(
      filenameForExport("job-lines"),
      exportQbJobCostLinesCsv(pnls),
      "text/csv;charset=utf-8",
    );
  }
  function exportScaffold() {
    downloadTextFile(
      filenameForExport("scaffold-json"),
      exportQbSyncScaffoldJson(pnls),
      "application/json;charset=utf-8",
    );
  }

  const parents = codes.filter((c) => !c.parentId);
  const childrenOf = (id: string) => codes.filter((c) => c.parentId === id);

  return (
    <div>
      <PageHeader
        title="Cost codes · QuickBooks"
        description="Construction cost chart mapped to QBO Classes, Products & Services, and income/expense accounts. Export scaffolds so your books sync cleanly — live API can plug in later."
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ExportCard
          icon={Layers}
          title="QB Classes"
          body="Import as Classes for job-cost dimensions."
          onClick={exportClasses}
        />
        <ExportCard
          icon={Package}
          title="Products & Services"
          body="SKU = cost code. Income + expense accounts."
          onClick={exportProducts}
        />
        <ExportCard
          icon={Table2}
          title="Full chart CSV"
          body="Complete mapping for your bookkeeper."
          onClick={exportChart}
        />
        <ExportCard
          icon={FileJson}
          title="Sync scaffold JSON"
          body="Machine contract for future QBO connector."
          onClick={exportScaffold}
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={exportJobLines}>
          <Download className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.75} />
          Job cost lines (classed)
        </Button>
        <span className="text-[11px] text-fg-subtle">
          {activeCostCodes().length} active codes · {pnls.length} jobs in line export
        </span>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {(["all", "residential", "commercial"] as const).map((s) => (
          <FilterChip key={s} active={scope === s} onClick={() => setScope(s)} label={s === "all" ? "All scopes" : s} />
        ))}
        <span className="mx-1 hidden h-6 w-px bg-border sm:inline-block" />
        {(["all", "income", "hard", "soft", "resource", "contingency", "overhead"] as const).map((g) => (
          <FilterChip
            key={g}
            active={group === g}
            onClick={() => setGroup(g)}
            label={g === "all" ? "All groups" : GROUP_LABEL[g]}
          />
        ))}
      </div>

      <div className="overflow-x-auto border border-border bg-bg-elevated">
        <table className="w-full min-w-[880px] text-left text-[12px]">
          <thead className="border-b border-border bg-bg-subtle/50 text-[11px] uppercase tracking-[0.06em] text-fg-subtle">
            <tr>
              <th className="px-3 py-2 font-medium">Code</th>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Group</th>
              <th className="px-3 py-2 font-medium">QB Class</th>
              <th className="px-3 py-2 font-medium">Expense acct</th>
              <th className="px-3 py-2 font-medium">Income acct</th>
              <th className="px-3 py-2 font-medium">Type</th>
              <th className="px-3 py-2 font-medium">Flags</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {parents.map((p) => (
              <CodeRows key={p.id} parent={p} children={childrenOf(p.id)} />
            ))}
            {/* orphan children if parent filtered out */}
            {codes
              .filter((c) => c.parentId && !codes.some((p) => p.id === c.parentId) && !parents.some((p) => p.id === c.id))
              .map((c) => (
                <CodeRow key={c.id} code={c} depth={0} />
              ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 border border-border bg-bg-subtle/40 px-4 py-3 text-[12px] leading-relaxed text-fg-muted">
        <p className="font-medium text-fg">How to use with QuickBooks</p>
        <ol className="mt-2 list-decimal space-y-1 pl-4">
          <li>Export <strong>QB Classes</strong> and create matching Classes in QBO (or import if your plan supports it).</li>
          <li>Export <strong>Products & Services</strong> — SKU matches Split Rock cost code.</li>
          <li>Create the suggested income / COGS accounts once (list is in the JSON scaffold).</li>
          <li>Tag every bill, expense, and invoice line with Class = cost code and Item = SKU.</li>
          <li>Use <strong>Job cost lines</strong> export for period actuals; books stay in QuickBooks.</li>
        </ol>
      </div>
    </div>
  );
}

function ExportCard({
  icon: Icon,
  title,
  body,
  onClick,
}: {
  icon: typeof Download;
  title: string;
  body: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="border border-border bg-bg-elevated p-4 text-left transition-colors hover:border-border-strong hover:bg-bg-subtle/50"
    >
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-fg-muted" strokeWidth={1.75} />
        <span className="text-[13px] font-medium">{title}</span>
      </div>
      <p className="mt-1.5 text-[11px] leading-relaxed text-fg-subtle">{body}</p>
      <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-primary">
        <Download className="h-3 w-3" strokeWidth={1.75} /> Download
      </span>
    </button>
  );
}

function FilterChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "border px-2.5 py-1 text-[11px] font-medium capitalize transition-colors",
        active ? "border-primary bg-primary text-primary-fg" : "border-border bg-bg-elevated text-fg-muted hover:text-fg",
      )}
    >
      {label}
    </button>
  );
}

function CodeRows({ parent, children }: { parent: CostCode; children: CostCode[] }) {
  return (
    <>
      <CodeRow code={parent} depth={0} />
      {children.map((c) => (
        <CodeRow key={c.id} code={c} depth={1} />
      ))}
    </>
  );
}

function CodeRow({ code, depth }: { code: CostCode; depth: number }) {
  return (
    <tr className={depth ? "bg-bg-subtle/20" : undefined}>
      <td className="px-3 py-2 font-mono text-[11px] text-fg-muted" style={{ paddingLeft: 12 + depth * 16 }}>
        {code.code}
      </td>
      <td className="px-3 py-2 font-medium">{code.name}</td>
      <td className="px-3 py-2 text-fg-muted">{GROUP_LABEL[code.group]}</td>
      <td className="px-3 py-2 text-[11px] text-fg-muted">{code.qbClass}</td>
      <td className="px-3 py-2 text-[11px] text-fg-subtle">{code.qbExpenseAccount}</td>
      <td className="px-3 py-2 text-[11px] text-fg-subtle">{code.qbIncomeAccount}</td>
      <td className="px-3 py-2">
        <Badge variant="outline">{code.qbItemType}</Badge>
      </td>
      <td className="px-3 py-2">
        <div className="flex flex-wrap gap-1">
          {code.defaultOnJob ? <Badge variant="secondary">default</Badge> : null}
          {code.scope !== "both" ? <Badge variant="outline">{code.scope}</Badge> : null}
          {code.csi ? <Badge variant="outline">CSI {code.csi}</Badge> : null}
        </div>
      </td>
    </tr>
  );
}
