import { useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-start";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/data/store";
import { addJobCostEntry } from "@/lib/job-cost-entries";
import { formatCurrency } from "@/lib/utils";
import { holwegeBudgetLines } from "@/data/holwege";

export const Route = createFileRoute("/app/job-cost-entry")({
  component: JobCostEntryPage,
});

function JobCostEntryPage() {
  const router = useRouter();
  const budgetLines = useAppStore((s) => s.budgetLines);
  const lines = budgetLines.filter((l) => l.projectId === "p-holwege");
  const source = lines.length > 0 ? lines : holwegeBudgetLines;

  const [lineId, setLineId] = useState(source[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [vendor, setVendor] = useState("");
  const [description, setDescription] = useState("");
  const [entryDate, setEntryDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [receiptUrl, setReceiptUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const selected = source.find((l) => l.id === lineId);

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
          >
            {source.map((l) => (
              <option key={l.id} value={l.id}>
                {l.category} — budget {formatCurrency(l.budgeted)}
              </option>
            ))}
          </Select>
          {selected ? (
            <p className="text-[11px] text-fg-subtle">
              Current actual: {formatCurrency(selected.actual)} of{" "}
              {formatCurrency(selected.budgeted)}
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
          <Button type="submit" disabled={saving || !lineId || !amount}>
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
