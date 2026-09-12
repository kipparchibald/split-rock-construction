import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Reuse formatters — creating Intl objects per call is relatively expensive on hot lists.
const currencyFmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const dateFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function formatCurrency(n: number) {
  if (!Number.isFinite(n)) return currencyFmt.format(0);
  return currencyFmt.format(n);
}

/** USD with exact cents — Holwege contract/draw SoT (no round-to-dollar). */
const currencyExactFmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCurrencyExact(n: number) {
  if (!Number.isFinite(n)) return currencyExactFmt.format(0);
  return currencyExactFmt.format(n);
}

export function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return dateFmt.format(d);
}

export function formatPct(n: number) {
  if (!Number.isFinite(n)) return "0%";
  return `${Math.round(n)}%`;
}
