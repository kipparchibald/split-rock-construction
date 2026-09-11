/**
 * Signable packet — construction agreement + Idaho 45-525 + dual-capacity.
 * Holwege bodies are real SoT (Drive draft package), mirrored under contracts/Holwege/.
 * Does not mutate Holwege budget / draw-base constants or Portal owner UI.
 */

import { COMPANY, LEGAL_DRAFT_DISCLAIMER } from "@/lib/company";
import { HOLWEGE_PROJECT_ID } from "@/data/holwege";
import {
  CONSTRUCTION_AGREEMENT_BODY,
  DUAL_CAPACITY_BODY,
  IDAHO_45_525_COMPLETION_BODY,
  IDAHO_45_525_INITIAL_BODY,
} from "@/lib/holwege-packet-bodies";

export const PACKET_COUNSEL_BANNER = LEGAL_DRAFT_DISCLAIMER;

export type PacketDocKind =
  | "construction_agreement"
  | "idaho_45_525_initial"
  | "idaho_45_525_completion"
  | "dual_capacity";

export type PacketDocStatus = "stub" | "ready_for_sign" | "signed" | "uploaded";

export type PacketSignChannel = "in_app" | "docusign" | "pdf_upload";

export interface SignablePacketDoc {
  id: string;
  kind: PacketDocKind;
  title: string;
  /** Path under contracts/Holwege/ (ops SoT mirror). */
  sourcePath: string;
  /** Full markdown body shown on /app/packet. */
  body: string;
  documentId: string;
  requiredForStart: boolean;
  status: PacketDocStatus;
  summary: string;
}

export interface SignablePacket {
  id: string;
  projectId: string;
  label: string;
  owners: string[];
  contractor: string;
  contractorLicense: string;
  brokerageNote: string;
  counselBanner: string;
  /** CONFIRMED construction contract price (land excluded). */
  contractPrice: number;
  /** CONFIRMED draw base for Draws 1–5. */
  drawBase: number;
  docs: SignablePacketDoc[];
}

/** Env keys checked for DocuSign. Missing any → PDF upload fallback. */
export const DOCUSIGN_ENV_KEYS = [
  "VITE_DOCUSIGN_INTEGRATION_KEY",
  "VITE_DOCUSIGN_ACCOUNT_ID",
  "VITE_DOCUSIGN_USER_ID",
] as const;

function envValue(key: string): string | undefined {
  try {
    const vite = (import.meta as ImportMeta & { env?: Record<string, string | boolean> }).env;
    const v = vite?.[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  } catch {
    /* ignore */
  }
  return undefined;
}

/** True only when all DocuSign client keys are present. */
export function isDocuSignConfigured(
  lookup: (key: string) => string | undefined = envValue,
): boolean {
  return DOCUSIGN_ENV_KEYS.every((k) => Boolean(lookup(k)));
}

export function resolveSignChannel(
  lookup: (key: string) => string | undefined = envValue,
): PacketSignChannel {
  return isDocuSignConfigured(lookup) ? "docusign" : "pdf_upload";
}

export function holwegeSignablePacket(): SignablePacket {
  return {
    id: "pkt-holwege",
    projectId: HOLWEGE_PROJECT_ID,
    label: "Holwege Lot 16 — signable construction packet",
    owners: ["Lauren Holwege", "Cindy Holwege"],
    contractor: COMPANY.legalName,
    contractorLicense: COMPANY.idahoContractorRegistration,
    brokerageNote:
      "Lot sold / closed via Archibald-Bagley Real Estate (Alliance 1100920 · deed 501245 · land $98,000 paid). Brokerage is not a party to the construction contract. Dual-capacity must be acknowledged. Contract Price $689,299.65 (land excluded). Draw base $659,330.10.",
    counselBanner: PACKET_COUNSEL_BANNER,
    contractPrice: 689299.65,
    drawBase: 659330.1,
    docs: [
      {
        id: "pkt-doc-agreement",
        kind: "construction_agreement",
        title: "Construction Agreement",
        sourcePath: "contracts/Holwege/03_Construction_Agreement.md",
        body: CONSTRUCTION_AGREEMENT_BODY,
        documentId: "doc-holwege-contract",
        requiredForStart: true,
        status: "ready_for_sign",
        summary:
          "Residential new-construction agreement — Split Rock Construction LLC and Owners only. Contract Price $689,299.65; land excluded.",
      },
      {
        id: "pkt-doc-45525-initial",
        kind: "idaho_45_525_initial",
        title: "Idaho § 45-525 Initial Disclosure",
        sourcePath: "contracts/Holwege/01_Initial_Disclosure_45-525.md",
        body: IDAHO_45_525_INITIAL_BODY,
        documentId: "doc-holwege-45525-initial",
        requiredForStart: true,
        status: "ready_for_sign",
        summary:
          "Idaho Code § 45-525(2) initial residential GC disclosure (lien waivers, insurance, extended title, surety).",
      },
      {
        id: "pkt-doc-dual",
        kind: "dual_capacity",
        title: "Dual-capacity disclosure (builder + licensee)",
        sourcePath: "contracts/Holwege/08_Dual_Capacity_Disclosure.md",
        body: DUAL_CAPACITY_BODY,
        documentId: "doc-holwege-dual-capacity",
        requiredForStart: true,
        status: "ready_for_sign",
        summary:
          "Archibald-Bagley lot representation finished; construction is Split Rock only. Owners initial dual role.",
      },
      {
        id: "pkt-doc-45525-completion",
        kind: "idaho_45_525_completion",
        title: "Idaho § 45-525 Completion Disclosure (subs)",
        sourcePath: "contracts/Holwege/02_Completion_Disclosure_Subcontractors_45-525.md",
        body: IDAHO_45_525_COMPLETION_BODY,
        documentId: "doc-holwege-45525-completion",
        requiredForStart: false,
        status: "ready_for_sign",
        summary:
          "Idaho Code § 45-525(3) completion subcontractor disclosure — fill at closeout / Draw 6, not at start.",
      },
    ],
  };
}

export function requiredStartDocs(packet: SignablePacket): SignablePacketDoc[] {
  return packet.docs.filter((d) => d.requiredForStart);
}

export function isDocSatisfied(doc: SignablePacketDoc): boolean {
  return doc.status === "signed" || doc.status === "uploaded";
}

/** Packet ready to start work when all required-for-start docs are signed or uploaded. */
export function packetReadyToStart(packet: SignablePacket): boolean {
  return requiredStartDocs(packet).every(isDocSatisfied);
}

export function applyDocStatus(
  packet: SignablePacket,
  docId: string,
  status: PacketDocStatus,
): SignablePacket {
  return {
    ...packet,
    docs: packet.docs.map((d) => (d.id === docId ? { ...d, status } : d)),
  };
}

export type PacketPersistSlice = {
  statuses: Record<string, PacketDocStatus>;
};

const STORAGE_KEY = "split-rock-signable-packet-v1";

export function loadPacketStatuses(): PacketPersistSlice {
  try {
    if (typeof localStorage === "undefined") return { statuses: {} };
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { statuses: {} };
    const parsed = JSON.parse(raw) as PacketPersistSlice;
    return { statuses: parsed?.statuses ?? {} };
  } catch {
    return { statuses: {} };
  }
}

export function savePacketStatuses(slice: PacketPersistSlice): void {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slice));
  } catch {
    /* ignore */
  }
}

export function mergePersistedStatuses(packet: SignablePacket): SignablePacket {
  const { statuses } = loadPacketStatuses();
  return {
    ...packet,
    docs: packet.docs.map((d) => {
      const s = statuses[d.id];
      return s ? { ...d, status: s } : d;
    }),
  };
}

export function persistDocStatus(docId: string, status: PacketDocStatus): void {
  const cur = loadPacketStatuses();
  savePacketStatuses({ statuses: { ...cur.statuses, [docId]: status } });
}
