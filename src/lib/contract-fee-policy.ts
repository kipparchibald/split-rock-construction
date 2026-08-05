/**
 * Contract-type fee transparency for Split Rock Construction.
 *
 * Principle: the contract model selected at signing drives whether supplier
 * referral / affiliate income may be retained by the builder or must be
 * credited to Job Cost. Nothing is hidden from the owner.
 */

import type { ContractModel } from "@/lib/pricing";

export type ReferralHandling =
  /** Cost-plus / open book: any supplier referral is credited to the job. */
  | "credit_to_job"
  /** Fixed price / allowances: disclosed; may be retained as builder income. */
  | "disclosed_builder_income"
  /** Spec the builder owns: supplier programs are company income. */
  | "builder_program_income";

export interface ContractFeePolicy {
  model: ContractModel;
  title: string;
  /** One-line owner promise */
  noHiddenFeesPromise: string;
  /** How finish referral / affiliate money is treated */
  referralHandling: ReferralHandling;
  referralHandlingLabel: string;
  referralHandlingDetail: string;
  /** What the owner pays for finishes */
  finishCostRule: string;
  /** Builder profit source under this model */
  builderCompensation: string;
  /** Short clause for proposals / selection addenda (not a substitute for counsel) */
  contractClause: string;
  /** Client-facing shop / design center disclosure */
  shopDisclosure: string;
  /** Internal ops checklist */
  opsRules: string[];
}

export const CONTRACT_FEE_POLICIES: Record<ContractModel, ContractFeePolicy> = {
  cost_plus: {
    model: "cost_plus",
    title: "Cost-plus (open book)",
    noHiddenFeesPromise:
      "Owner pays verified Job Cost plus the agreed GC fee only. No silent markups or retained supplier kickbacks on billed costs.",
    referralHandling: "credit_to_job",
    referralHandlingLabel: "Credit to Job Cost",
    referralHandlingDetail:
      "Any supplier referral, affiliate commission, or spiff tied to finishes billed as Job Cost is disclosed and credited against that cost (or declined). Trade discounts reduce billed cost.",
    finishCostRule:
      "Finishes are billed at actual net cost after discounts and after crediting any referral income tied to that purchase.",
    builderCompensation:
      "Agreed GC fee % (and any separately stated fixed fee). Profit is not taken twice via hidden material commissions.",
    contractClause:
      "Fee transparency — Cost-plus. Owner shall pay verified Cost of the Work plus the agreed Contractor fee only. Contractor shall not retain undisclosed supplier incentives, referral fees, or affiliate commissions on materials billed as Cost of the Work. Any such amounts received shall be disclosed and credited to Job Cost (or the purchase shall not be submitted as Cost of the Work). Trade discounts shall reduce Cost of the Work. Contractor’s compensation is limited to the fee stated in this Agreement.",
    shopDisclosure:
      "This job is cost-plus (open book). Partner shop links are for sourcing. Any referral fee Split Rock receives on items billed as Job Cost will be credited to your job — not kept as extra profit on top of the GC fee.",
    opsRules: [
      "Record every referral/spiff on the job cost ledger as a credit.",
      "Prefer trade-account net pricing over affiliate links for job buys.",
      "Do not bill retail while pocketing a commission on the same SKU.",
      "Put the cost-plus fee clause in the signed agreement and selection addendum.",
    ],
  },
  fixed_price: {
    model: "fixed_price",
    title: "Fixed-price (lump sum)",
    noHiddenFeesPromise:
      "Owner pays the agreed contract price (plus approved change orders). Finish upgrades outside allowance follow the written change-order process — no surprise back-door fees.",
    referralHandling: "disclosed_builder_income",
    referralHandlingLabel: "Disclosed builder income (optional)",
    referralHandlingDetail:
      "Within the fixed price and allowances, supplier programs may benefit the builder. Owner-facing shop links still carry a plain disclosure. Allowance overruns are change orders, not hidden fees.",
    finishCostRule:
      "Standard finishes are inside the contract price / allowances. Owner-selected upgrades are priced and approved in writing before order.",
    builderCompensation:
      "Contract price includes builder overhead and profit. Supplier incentives inside that price are not an additional charge to the owner.",
    contractClause:
      "Fee transparency — Fixed price. Owner’s obligation is the Contract Sum plus approved Change Orders only. Allowance categories are listed in Exhibit __; selections within allowance do not change the Contract Sum. Upgrades above allowance require a written Change Order before order or installation. Contractor may participate in supplier trade or referral programs; such participation does not increase amounts due from Owner beyond the Contract Sum and approved Change Orders. Contractor shall not assess undisclosed administrative or procurement fees on Owner selections.",
    shopDisclosure:
      "This job is fixed-price. You pay the agreed contract price and any written upgrades. Split Rock may earn supplier referral income on partner links; that does not raise your contract price. Allowance overruns need a signed change order before we order.",
    opsRules: [
      "Never add a quiet procurement fee on top of the lump sum.",
      "Track allowance vs actual; CO before ordering overruns.",
      "Disclose partner links on design center / finish partners.",
      "Keep change-order trail clean for upgrades.",
    ],
  },
  spec_build_close: {
    model: "spec_build_close",
    title: "Spec / build-to-close",
    noHiddenFeesPromise:
      "Buyer pays the agreed purchase price at closing (or per the purchase agreement). No post-contract finish kickbacks billed to the buyer outside written options.",
    referralHandling: "builder_program_income",
    referralHandlingLabel: "Builder program income",
    referralHandlingDetail:
      "Builder owns the build until close. Supplier discounts and referrals are company economics unless a written option says otherwise. Published options list is the only add-on path for the buyer.",
    finishCostRule:
      "Base finishes are in the sale price. Buyer options are priced on a written options sheet before lock.",
    builderCompensation:
      "Sale price less build cost, financing, and selling costs. Not a cost-plus fee to the buyer.",
    contractClause:
      "Fee transparency — Spec / purchase. Buyer’s price is the Purchase Price in the purchase agreement plus any written Buyer Options accepted before the option deadline. Seller/Builder may use trade pricing and supplier programs in constructing the home; those programs do not create additional charges to Buyer beyond the Purchase Price and accepted options. No undisclosed selection or procurement fees apply at closing.",
    shopDisclosure:
      "Spec / build-to-close: the purchase price and written options control what you pay. Partner links are for exploring finishes; accepted options must be on the options sheet before we order.",
    opsRules: [
      "Publish a clear options list with prices.",
      "No verbal upgrade pricing at the last minute without paper.",
      "Supplier income stays on the company side of the pro forma.",
    ],
  },
};

export function feePolicyFor(model: ContractModel): ContractFeePolicy {
  return CONTRACT_FEE_POLICIES[model];
}

export function shopDisclosureFor(model: ContractModel): string {
  return CONTRACT_FEE_POLICIES[model].shopDisclosure;
}

/** Persist key for the active contract model on a pricing session / default job policy */
export const CONTRACT_MODEL_PERSIST_KEY = "active-contract-model";

export const DEFAULT_CONTRACT_MODEL: ContractModel = "fixed_price";
