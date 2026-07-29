import type { PayApplication, PayAppLine } from "@/data/types";

export function lineCompleted(line: PayAppLine) {
  return line.previousBilled + line.thisPeriod + line.materialsStored;
}

export function lineBalance(line: PayAppLine) {
  return line.scheduledValue - lineCompleted(line);
}

export function payAppTotals(app: PayApplication) {
  const scheduled = app.lines.reduce((s, l) => s + l.scheduledValue, 0);
  const previous = app.lines.reduce((s, l) => s + l.previousBilled, 0);
  const thisPeriod = app.lines.reduce((s, l) => s + l.thisPeriod, 0);
  const stored = app.lines.reduce((s, l) => s + l.materialsStored, 0);
  const completed = previous + thisPeriod + stored;
  const retainage = Math.round(completed * (app.retainagePct / 100));
  const previousRetainage = Math.round(previous * (app.retainagePct / 100));
  const thisRetainage = retainage - previousRetainage;
  const currentPayment = thisPeriod + stored - thisRetainage;
  return {
    scheduled,
    previous,
    thisPeriod,
    stored,
    completed,
    retainage,
    previousRetainage,
    thisRetainage,
    currentPayment,
    balance: scheduled - completed,
  };
}
