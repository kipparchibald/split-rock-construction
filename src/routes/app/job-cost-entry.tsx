import { useEffect, useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-start";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { addJobCostEntry } from "@/lib/job-cost-entries";
import { getHolwegeCostSummary, type JobCostLineSummary } from "@/lib/job-cost-live";
import { formatCurrency } from "@/lib/utils";
import { holwegeBudgetLines } from "@/data/holwege";

export const Route = createFileRoute("/app/job-cost-entry")({
  component: JobCostEntryPage,
});

function JobCostEntryPage() {
  const router = useRouter();
  const [lines, setLines] = useState<JobCostLineSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [lineId, setLineId] = useState("");
  const [amount, setAmount] = useState("");
  const [vendor, setVendor] = useState("");
  const [description, setDescription] = useState("");
  const [entryDate, setEntryDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [receiptUrl, setReceiptUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const summary = await getHolwegeCostSummary();
        if (!cancelled) {
          setLines(summary.lines);
          if (summary.lines[0]) {
            setLineId(summary.lines[0].lineId);
          }
        }
      } catch {
        if (!cancelled) {
          // Fall back to static Holwege lines so the form still works offline.
          setLines(
            holwegeBudgetLines.map((l) => ({
              lineId: l.id,
              lineLabel: l.category,
              lineType: "estimate",
              budgeted: l.budgeted,
              actual: l.actual,
              variance: l.budgeted - l.actual,
              variancePct:
                l.budgeted > 0 ? ((l.budgeted - l.actual) / l.budgeted) * 100 : null,
              sortOrder: 0,
            })),
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = lines.find((l) => l.lineId === lineId);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!lineId || !amount) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await addJobCostEntry({
        data: {
          lineId,
          amount: Number(amount),
          vendor: vendor || undefined,
          description: description || undefined,
          entryDate: entryDate || undefined,
          receiptUrl: receiptUrl || undefined,
        },
      });
      setMessage(
        res.persisted
          ? "Entry saved. Actuals update on the cost report."
          : "Saved locally (demo mode — no database connected).",
      );
      setAmount("");
      setVendor("");
      setDescription("");
      setReceiptUrl("");
      // Refresh the live summary so the dropdown reflects the new actual.
      const summary = await getHolwegeCostSummary();
      setLines(summary.lines);
      router.invalidate();
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Could not save entry.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <PageHeader
        title="Log invoice"
        description="Record a sub invoice or material receipt against a budget line. Actuals roll up automatically."
      />

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="line">Budget line</Label>
          <Select
            id="line"
            value={lineId}
            onChange={(e) => setLineId(e.target.value)}
            disabled={loading || lines.length === 0}
          >
            {lines.map((l) => (
              <option key={l.lineId} value={l.lineId}>
                {l.lineLabel} — budget {formatCurrency(l.budgeted)}
              </option>
            ))}
          </Select>
          {selected ? (
            <p className="text-[11px] text-fg-subtle">
              Current actual: {formatCurrency(selected.actual)} of{" "}
              {formatCurrency(selected.budgeted)}
              {selected.variancePct != null
                ? ` (${selected.variancePct >= 0 ? "+" : ""}${selected.variancePct.toFixed(1)}%)`
                : ""}
            </p>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              min={0}
              step={0.01}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="vendor">Vendor / sub</Label>
          <Input
            id="vendor"
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
            placeholder="e.g. Teton Electric"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="desc">Description</Label>
          <Textarea
            id="desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Invoice #, what it covers"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="receipt">Receipt URL (optional)</Label>
          <Input
            id="receipt"
            type="url"
            value={receiptUrl}
            onChange={(e) => setReceiptUrl(e.target.value)}
            placeholder="https://..."
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" disabled={saving || !lineId || !amount || loading}>
            {saving ? "Saving…" : "Save entry"}
          </Button>
          {message ? (
            <p className="text-[12px] text-fg-muted">{message}</p>
          ) : null}
        </div>
      </form>
    </div>
  );
}
