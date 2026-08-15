export type ProjectStatus = "planning" | "permitting" | "in_progress" | "punch_list" | "complete" | "on_hold";
export type ProjectType = "residential" | "commercial";
export type BidStatus = "draft" | "submitted" | "won" | "lost" | "expired";
export type EquipmentStatus = "available" | "on_site" | "maintenance" | "retired";
export type SafetySeverity = "near_miss" | "minor" | "serious" | "critical";
export type DocType = "rfi" | "submittal" | "drawing" | "permit" | "change_order" | "contract" | "inspection" | "lien_waiver" | "warranty";
export type Phase = "Site Work" | "Foundation" | "Framing" | "MEP Rough-In" | "Insulation" | "Drywall" | "Exterior" | "Interior Finishes" | "Landscaping" | "Final Walkthrough";

export interface Client {
  id: string; name: string; email: string; phone: string;
  type: "homeowner" | "developer" | "commercial";
  address: string; notes: string;
  /** Opaque invite/access code for owner portal — unique per client */
  portalToken?: string;
  /** none = not invited · invited = code issued · active = has signed in · revoked = blocked */
  portalStatus?: "none" | "invited" | "active" | "revoked";
  portalInvitedAt?: string;
  portalLastLoginAt?: string;
}
export interface CrewMember {
  id: string; name: string; role: string; trade: string; phone: string;
  status: "active" | "pto" | "off_site"; rate: number; certifications: string[]; projectId?: string;
}
export interface Crew {
  id: string; name: string; leadId: string; trade: string; memberIds: string[]; projectId?: string;
}
export interface Equipment {
  id: string; name: string; category: string; status: EquipmentStatus;
  projectId?: string; nextService: string; hours: number;
}
export interface Bid {
  id: string; title: string; clientId: string; type: ProjectType; status: BidStatus;
  amount: number; submittedAt?: string; dueDate: string; notes: string;
  lineItems: { label: string; amount: number }[];
  /** Job opened when bid is awarded */
  projectId?: string;
  /** Optional Book of Plans link when bid was created from a plan */
  planId?: string;
}
export interface Project {
  id: string; name: string; address: string; clientId: string; type: ProjectType;
  status: ProjectStatus; phase: Phase; progress: number; budget: number; spent: number;
  startDate: string; endDate: string; superintendent: string; sqft: number;
  beds?: number; baths?: number; description: string;
  milestones: { name: string; date: string; done: boolean }[];
  schedule: { phase: Phase; start: string; end: string; pct: number }[];
  /** Optional link to Book of Plans entry used to seed this job */
  planId?: string;
  /** Matterport space ID for owner portal / marketing tours (public embed) */
  matterportId?: string;
}
export interface SafetyIncident {
  id: string; date: string; projectId: string; severity: SafetySeverity;
  title: string; description: string; reportedBy: string; status: "open" | "investigating" | "closed";
}
export interface DocumentItem {
  id: string; title: string; type: DocType; projectId: string;
  status: "open" | "pending" | "approved" | "rejected" | "scheduled" | "passed" | "failed";
  updatedAt: string; author: string;
  /** Optional agency / inspector / permit number */
  reference?: string;
  dueDate?: string;
  /** IndexedDB attachment id — browser-local only */
  attachmentId?: string;
  attachmentName?: string;
  attachmentSize?: number;
}
export interface ActivityItem {
  id: string; at: string; text: string; kind: "project" | "bid" | "safety" | "doc" | "crew";
}
export interface BudgetLine {
  id: string;
  projectId: string;
  /** Catalog id from src/lib/cost-codes (e.g. 03-FND). Falls back via category if missing. */
  costCodeId: string;
  category: string;
  budgeted: number;
  committed: number;
  actual: number;
}

export type DrawStatus = "upcoming" | "ready" | "submitted" | "paid" | "held";
export type ChangeOrderStatus = "draft" | "pending_owner" | "approved" | "rejected" | "invoiced";
export type SelectionStatus = "not_started" | "pending_owner" | "approved" | "ordered" | "installed";
export type DailyLogWeather = "clear" | "overcast" | "rain" | "snow" | "wind";

export interface ProgressDraw {
  id: string; projectId: string; name: string; pct: number; amount: number;
  status: DrawStatus; dueDate?: string; paidDate?: string; trigger: string;
}
export interface ChangeOrder {
  id: string; projectId: string; number: string; title: string; amount: number;
  daysImpact: number; status: ChangeOrderStatus; requestedBy: string;
  date: string; description: string;
}
export interface SelectionItem {
  id: string; projectId: string; room: string; category: string; allowance: number;
  actual?: number; status: SelectionStatus; choice?: string;
}
export interface DailyLog {
  id: string; projectId: string; date: string; weather: DailyLogWeather;
  crewCount: number; hours: number; workDone: string; blockers?: string;
  visitors?: string; author: string; photos?: string[];
}

/** Book of Plans — repeatable ranch / basement packages for Teton Heights & custom */
export type PlanStyle = "ranch" | "modern_farmhouse" | "mountain_modern" | "traditional";
export interface PlanAllowance {
  category: string;
  amount: number;
  notes?: string;
}
export interface Plan {
  id: string;
  name: string;
  code: string;
  style: PlanStyle;
  mainFloorSqft: number;
  basementSqft: number;
  beds: number;
  baths: number;
  garage: string;
  basePrice: number;
  description: string;
  highlights: string[];
  allowances: PlanAllowance[];
  /** Suggested phase schedule template (relative weeks from ground break) */
  phaseTemplate: { phase: Phase; weeks: number }[];
  /** Typical draw schedule percentages */
  drawTemplate: { name: string; pct: number; trigger: string }[];
  elevationOptions: string[];
  active: boolean;
}

/** Commercial construction extensions */
export type CommercialPhase =
  | "Preconstruction"
  | "Site Work"
  | "Structure"
  | "Shell / Envelope"
  | "MEP Rough"
  | "Interior Build-Out"
  | "Fire / Life Safety"
  | "Commissioning"
  | "Closeout";

export type ContractDelivery = "design_bid_build" | "design_assist" | "cm_at_risk" | "lump_sum_gc";
export type SubStatus = "bidding" | "awarded" | "mobilized" | "complete" | "closed";
export type PayAppStatus = "draft" | "submitted" | "certified" | "paid" | "held";
export type BondStatus = "not_required" | "pending" | "active" | "released";

export interface Subcontract {
  id: string;
  projectId: string;
  company: string;
  trade: string;
  csiDivision: string;
  contractAmount: number;
  retainagePct: number;
  billedToDate: number;
  paidToDate: number;
  status: SubStatus;
  insuranceExp: string;
  contact: string;
  phone: string;
}

export interface PayAppLine {
  id: string;
  description: string;
  scheduledValue: number;
  previousBilled: number;
  thisPeriod: number;
  materialsStored: number;
}

export interface PayApplication {
  id: string;
  projectId: string;
  number: number;
  periodEnd: string;
  status: PayAppStatus;
  retainagePct: number;
  lines: PayAppLine[];
  submittedAt?: string;
  certifiedAt?: string;
  paidAt?: string;
  notes: string;
}

export interface CommercialMeta {
  projectId: string;
  delivery: ContractDelivery;
  bondStatus: BondStatus;
  bondAmount: number;
  ocip: boolean;
  prevailingWage: boolean;
  architect: string;
  ownerRep: string;
  substantialDate?: string;
  liquidatedDamagesPerDay: number;
}

/** Construction closeout (G704-family practice — not a licensed AIA form) */
export type CloseoutItemKey =
  | "substantial_completion"
  | "punch_list"
  | "certificate_of_occupancy"
  | "final_pay_app"
  | "lien_waivers"
  | "as_builts"
  | "warranty_packet"
  | "keys_codes"
  | "surety_consent"
  | "final_cleaning";

export type CloseoutItemStatus = "not_started" | "in_progress" | "complete" | "waived" | "blocked";

export interface CloseoutItem {
  key: CloseoutItemKey;
  label: string;
  status: CloseoutItemStatus;
  owner: string;
  dueDate?: string;
  notes?: string;
  completedAt?: string;
}

export interface CloseoutPackage {
  id: string;
  projectId: string;
  substantialDate?: string;
  architectCertifier?: string;
  punchOpen: number;
  punchClosed: number;
  items: CloseoutItem[];
  notes: string;
}

/** Realty / brokerage track (operational checklist — not a substitute for licensed board forms) */
export type RealtyDealStatus =
  | "exploring"
  | "listed"
  | "under_contract"
  | "pending_close"
  | "closed"
  | "withdrawn"
  | "n_a";

export type AgencyRole =
  | "none"
  | "seller_agent"
  | "buyer_agent"
  | "dual_agency"
  | "transaction_broker"
  | "owner_agent";

export type DualCapacityStatus = "not_applicable" | "disclosed" | "pending_disclosure" | "declined_realty";

export type RealtyChecklistKey =
  | "agency_election"
  | "dual_capacity_disclosure"
  | "listing_or_buyer_agreement"
  | "purchase_sale_agreement"
  | "new_construction_addendum"
  | "seller_builder_disclosure"
  | "earnest_money_trust"
  | "financing_contingency"
  | "inspection_walkthrough"
  | "title_commitment"
  | "closing_disclosure_review"
  | "deed_recorded";

export type RealtyItemStatus = "not_started" | "in_progress" | "complete" | "n_a" | "blocked";

export interface RealtyChecklistItem {
  key: RealtyChecklistKey;
  label: string;
  status: RealtyItemStatus;
  systemOfRecord: string;
  notes?: string;
  completedAt?: string;
}

export interface RealtyDeal {
  id: string;
  projectId: string;
  status: RealtyDealStatus;
  agencyRole: AgencyRole;
  dualCapacity: DualCapacityStatus;
  brokerage: string;
  agentName: string;
  listPrice?: number;
  salePrice?: number;
  underContractDate?: string;
  closingDate?: string;
  earnestHeldBy: string;
  earnestAmount?: number;
  trustAccountNote: string;
  dualCapacityAcknowledgedAt?: string;
  dualCapacityAcknowledgedBy?: string;
  items: RealtyChecklistItem[];
  notes: string;
}

export interface DualRolePolicy {
  builderEntity: string;
  brokerage: string;
  licenseNote: string;
  rules: string[];
}

/** Job-cost / cash / insurance alerts shown in command center */
export type CostAlertKind =
  | "over_budget"
  | "burn_rate"
  | "commitment_risk"
  | "draw_gap"
  | "insurance_expiry";
export type CostAlertSeverity = "critical" | "warning" | "watch" | "info";

export interface CostAlert {
  id: string;
  projectId?: string;
  kind: CostAlertKind;
  severity: CostAlertSeverity;
  title: string;
  detail: string;
  metric?: string;
  createdAt: string;
  acknowledged: boolean;
}

/** Subcontractor / vendor insurance COI tracking */
export type InsurancePolicyType =
  | "general_liability"
  | "auto"
  | "workers_comp"
  | "umbrella"
  | "builders_risk"
  | "professional";
export type InsurancePolicyStatus = "active" | "expiring_soon" | "expired" | "missing";
export type CoiStatus = "valid" | "expiring_soon" | "expired" | "missing" | "pending_review";

export type CoiCheckResult = "pass" | "fail" | "warn";
export type CoiVerificationOverall = "passed" | "failed" | "needs_review";

export interface CoiVerificationCheck {
  id: string;
  label: string;
  result: CoiCheckResult;
  detail: string;
}

/** Result of automated COI verification against Split Rock requirements */
export interface CoiVerification {
  verifiedAt: string;
  overall: CoiVerificationOverall;
  checks: CoiVerificationCheck[];
  /** 0–100 verification score (distinct from vendor compliance score) */
  score: number;
}

export interface InsurancePolicy {
  id: string;
  vendorId?: string;
  projectId?: string;
  type: InsurancePolicyType;
  carrier: string;
  policyNumber: string;
  expirationDate: string;
  status: InsurancePolicyStatus | CoiStatus;
  additionalInsured: boolean;
  additionalInsuredNamed?: string;
  coverageLimit?: number;
  effectiveDate?: string;
  certificateUrl?: string;
  notes?: string;
  /** Latest automated verification run */
  verification?: CoiVerification;
}

export type LienWaiverType =
  | "conditional_progress"
  | "unconditional_progress"
  | "conditional_final"
  | "unconditional_final";

export type LienWaiverStatus = "draft" | "sent" | "signed" | "void" | "filed";

export interface LienWaiver {
  id: string;
  projectId: string;
  vendorId: string;
  type: LienWaiverType;
  status: LienWaiverStatus;
  amount: number;
  throughDate: string;
  drawId?: string;
  notes?: string;
  createdAt?: string;
}

export interface Vendor {
  id: string;
  company: string;
  trade: string;
  contact: string;
  email: string;
  phone: string;
  w9OnFile?: boolean;
  preferred?: boolean;
  portalToken?: string;
  notes?: string;
}

/** Jefferson County + EIPH permit packaging */
export type PermitAuthority = "jefferson_county" | "eiph" | "state" | "utility";
export type PermitStatus = "not_started" | "drafting" | "ready_review" | "submitted" | "approved" | "denied";

export interface PermitChecklistItem {
  key: string;
  label: string;
  authority: PermitAuthority;
  status: PermitStatus;
  formCode?: string;
  notes?: string;
  draftText?: string;
}

export interface PermitPackage {
  id: string;
  projectId: string;
  title: string;
  status: PermitStatus;
  items: PermitChecklistItem[];
  updatedAt: string;
}

/** Virtual design studio — full interior + exterior finish catalog */
export type DesignCategory =
  | "paint"
  | "flooring"
  | "cabinets"
  | "countertops"
  | "backsplash"
  | "fixtures"
  | "hardware"
  | "lighting"
  | "appliances"
  | "tile"
  | "exterior"
  | "roofing"
  | "doors";

/** base = midrange included in allowance; upgrade / trendy / premium = deltas */
export type DesignTier = "base" | "upgrade" | "trendy" | "premium";

export interface DesignOption {
  id: string;
  category: DesignCategory;
  name: string;
  brand?: string;
  finish?: string;
  woodSpecies?: string;
  colorHex?: string;
  /** $ relative to midrange base allowance (0 = included) */
  priceDelta: number;
  allowanceBucket: string;
  imageHint: string;
  tier: DesignTier;
  /** interior | exterior | both */
  zone: "interior" | "exterior" | "both";
  tags?: string[];
}

export interface DesignSelection {
  id: string;
  projectId: string;
  room: string;
  category: DesignCategory;
  optionId: string;
  locked: boolean;
}

// --- Teton Heights sales / CRM (merged from split-rock-os) ---
export type LotStatus = "available" | "reserved" | "under_contract" | "sold" | "model" | "hold";
export type LotPremium =
  | "standard"
  | "corner"
  | "view"
  | "cul_de_sac"
  | "oversized";

export interface SubdivisionLot {
  id: string;
  projectId: string;
  block: string;
  lot: string;
  acres: number;
  status: LotStatus;
  premium: LotPremium;
  basePrice: number;
  premiumAmount: number;
  listPrice: number;
  multiLotDiscountPct: number;
  notes: string;
  wellReady: boolean;
  septicReady: boolean;
  utilities: string;
}

export interface LotFinanceOption {
  id: string;
  label: string;
  downPct: number;
  termMonths: number;
  interestRatePct: number;
  notes: string;
}

export interface BuildPackage {
  id: string;
  name: string;
  beds: number;
  baths: number;
  sqft: number;
  baseBuild: number;
  finishesTier: "standard" | "preferred" | "premium";
  notes: string;
}

export type LeadType = "lot_only" | "lot_and_build" | "custom_own_land" | "commercial" | "referral";
export type ProspectStage =
  | "new"
  | "contacted"
  | "tour_scheduled"
  | "tour_done"
  | "qualified"
  | "lot_hold"
  | "proposal_sent"
  | "bid"
  | "won"
  | "lost";
export type LeadSource =
  | "website"
  | "teton_estimator"
  | "model_home"
  | "yard_sign"
  | "referral_agent"
  | "social"
  | "open_house"
  | "phone"
  | "other";
export type BudgetBand = "under_400k" | "400_500k" | "500_650k" | "650_800k" | "800k_plus" | "unknown";
export type TimelineBand = "0_3mo" | "3_6mo" | "6_12mo" | "12mo_plus" | "browsing";

export interface Prospect {
  id: string;
  name: string;
  email: string;
  phone: string;
  leadType: LeadType;
  stage: ProspectStage;
  source: LeadSource;
  budgetBand: BudgetBand;
  timeline: TimelineBand;
  interest: string;
  notes: string;
  dualRoleFlag: boolean;
  dualRoleAcknowledged: boolean;
  score: number;
  lotId?: string;
  packageId?: string;
  assignedTo: string;
  createdAt: string;
  lastContactAt?: string;
  lostReason?: string;
  referralAgent?: string;
  referralBrokerage?: string;
}

export type TourStatus = "scheduled" | "completed" | "no_show" | "cancelled";
export type TourKind = "model_home" | "lot_walk" | "custom_consult" | "commercial_walk";

export interface Tour {
  id: string;
  prospectId: string;
  kind: TourKind;
  at: string;
  location: string;
  status: TourStatus;
  notes: string;
  host: string;
}

export interface Proposal {
  id: string;
  prospectId: string;
  lotId?: string;
  packageId?: string;
  lotPrice: number;
  buildPrice: number;
  softCosts: number;
  extras: number;
  total: number;
  status: "draft" | "sent" | "accepted" | "expired";
  createdAt: string;
  validUntil: string;
  notes: string;
}
