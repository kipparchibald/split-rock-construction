import type { LienWaiver, LienWaiverType, Vendor } from "@/data/types";

export function waiverTypeLabel(t: LienWaiverType): string {
  switch (t) {
    case "conditional_progress":
      return "Conditional progress";
    case "unconditional_progress":
      return "Unconditional progress";
    case "conditional_final":
      return "Conditional final";
    case "unconditional_final":
      return "Unconditional final";
  }
}

/** Idaho-oriented draft language — attorney review required before use. */
export function draftLienWaiverText(input: {
  waiver: LienWaiver;
  vendor: Vendor;
  projectName: string;
  projectAddress: string;
  gcName?: string;
}): string {
  const gc = input.gcName ?? "Split Rock Construction LLC";
  const kind = waiverTypeLabel(input.waiver.type);
  const conditional = input.waiver.type.startsWith("conditional");
  return [
    `LIEN WAIVER — ${kind.toUpperCase()}`,
    ``,
    `Project: ${input.projectName}`,
    `Address: ${input.projectAddress}`,
    `General Contractor: ${gc}`,
    `Claimant: ${input.vendor.company}`,
    `Through date: ${input.waiver.throughDate}`,
    `Amount: $${input.waiver.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
    ``,
    conditional
      ? `Upon receipt of payment of the amount stated above, the undersigned waives and releases any claim for lien or payment bond rights to the extent of that payment for labor, services, equipment, or materials furnished to the project through the through date. This waiver is conditional upon actual receipt of payment.`
      : `The undersigned acknowledges receipt of payment of the amount stated above and hereby waives and releases any claim for lien or payment bond rights for labor, services, equipment, or materials furnished to the project through the through date.`,
    ``,
    `This draft is generated for operational use by ${gc}. It is not legal advice. Have counsel review before relying on it under Idaho Code Title 45.`,
    ``,
    `Signature: ___________________________  Date: ________`,
    `Printed name / title: ________________`,
  ].join("\n");
}

export function suggestWaiverForDraw(pct: number, isFinal: boolean): LienWaiverType {
  if (isFinal) return "conditional_final";
  if (pct >= 90) return "conditional_final";
  return "conditional_progress";
}
