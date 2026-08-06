import type { BuildPackage, LotFinanceOption, SubdivisionLot } from "@/data/types";

export function lotListPrice(lot: Pick<SubdivisionLot, "basePrice" | "premiumAmount">) {
  return lot.basePrice + lot.premiumAmount;
}

/** Multi-lot: discount applies to each lot after the first (or full stack if stackDiscount). */
export function multiLotTotal(lots: SubdivisionLot[], discountPct = 3) {
  if (lots.length === 0) return { subtotal: 0, discount: 0, total: 0 };
  const sorted = [...lots].sort((a, b) => b.listPrice - a.listPrice);
  let subtotal = 0;
  let discount = 0;
  sorted.forEach((lot, i) => {
    const price = lot.listPrice;
    subtotal += price;
    if (i > 0) discount += Math.round(price * (discountPct / 100));
  });
  return { subtotal, discount, total: subtotal - discount, count: lots.length };
}

export function packageTotal(lot: SubdivisionLot, build: BuildPackage, extras = 0) {
  const lotPrice = lot.listPrice;
  const buildPrice = build.baseBuild;
  const soft = Math.round((lotPrice + buildPrice) * 0.02); // est. closing / soft
  const total = lotPrice + buildPrice + soft + extras;
  return { lotPrice, buildPrice, soft, extras, total, perSqft: build.sqft ? Math.round(total / build.sqft) : null };
}

/** Simple amortization for owner-finance demo (interest-bearing). */
export function ownerFinancePayment(
  principal: number,
  option: LotFinanceOption,
) {
  const down = Math.round(principal * (option.downPct / 100));
  const financed = principal - down;
  const r = option.interestRatePct / 100 / 12;
  const n = option.termMonths;
  let payment: number;
  if (option.interestRatePct === 0 || r === 0) {
    payment = n > 0 ? Math.round(financed / n) : financed;
  } else {
    payment = Math.round((financed * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
  }
  return { down, financed, payment, termMonths: n, interestRatePct: option.interestRatePct };
}

export const TETON_BASE_LOT = 99_500;
