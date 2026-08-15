/**
 * Single source of truth for public + ops identity.
 * Keep marketing site, seed COMPANY, auth seeds, and documents aligned.
 */
export const COMPANY = {
  name: "Split Rock Construction",
  legalName: "Split Rock Construction LLC",
  shortName: "Split Rock",
  tagline: "Quality builds · transparent process · clear communication — Rigby & Jefferson County",
  location: "Rigby, ID",
  region: "Jefferson County & Eastern Idaho",
  phone: "(208) 200-0605",
  phoneHref: "tel:+12082000605",
  email: "Kipp@splitrockconst.com",
  emailKipp: "Kipp@splitrockconst.com",
  emailKyle: "Kyle@splitrockconst.com",
  /** Auth login emails (lowercase for Better Auth uniqueness) */
  authEmailKipp: "kipp@splitrockconst.com",
  authEmailKyle: "kyle@splitrockconst.com",
  website: "splitrockconst.com",
  lotsUrl: "https://rigbylots.com",
  builderEntity: "Split Rock Construction LLC",
  /** Idaho DOPL General Contractor Registration (Contractors Board), active 2026-07-28 – 2028-07-28 */
  idahoContractorRegistration: "6481622",
  idahoContractorRegistrationLabel: "Idaho Contractor Registration 6481622",
  brokerageNote:
    "Principal is an Idaho-licensed real estate licensee — dual-capacity deals require written disclosure.",
} as const;

export const OPERATOR_AUTH = {
  kipp: {
    name: "Kipp Archibald",
    email: COMPANY.authEmailKipp,
    role: "owner" as const,
  },
  kyle: {
    name: "Kyle",
    email: COMPANY.authEmailKyle,
    role: "ops" as const,
  },
} as const;

/** Shown on drafts that are not legal substitutes */
export const LEGAL_DRAFT_DISCLAIMER =
  "DRAFT FOR INTERNAL USE ONLY — not legal advice, not a filed form, and not a substitute for endorsed certificates or counsel-reviewed documents. Review, complete, and sign before relying on this content.";
