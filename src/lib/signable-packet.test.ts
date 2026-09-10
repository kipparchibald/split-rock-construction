import { describe, expect, it } from "vitest";
import {
  DOCUSIGN_ENV_KEYS,
  applyDocStatus,
  holwegeSignablePacket,
  isDocuSignConfigured,
  packetReadyToStart,
  requiredStartDocs,
  resolveSignChannel,
} from "./signable-packet";
import { HOLWEGE_PROJECT_ID } from "@/data/holwege";
import { LEGAL_DRAFT_DISCLAIMER } from "@/lib/company";

describe("SRC-6 signable packet", () => {
  it("seeds Holwege packet from contract stubs without inventing new parties", () => {
    const pkt = holwegeSignablePacket();
    expect(pkt.projectId).toBe(HOLWEGE_PROJECT_ID);
    expect(pkt.owners).toEqual(["Lauren Holwege", "Cindy Holwege"]);
    expect(pkt.contractorLicense).toBe("6481622");
    expect(pkt.counselBanner).toBe(LEGAL_DRAFT_DISCLAIMER);
    expect(pkt.brokerageNote.toLowerCase()).toMatch(/archibald-bagley/);
  });

  it("requires agreement + 45-525 initial + dual-capacity before start", () => {
    const pkt = holwegeSignablePacket();
    const kinds = requiredStartDocs(pkt).map((d) => d.kind).sort();
    expect(kinds).toEqual([
      "construction_agreement",
      "dual_capacity",
      "idaho_45_525_initial",
    ].sort());
    expect(packetReadyToStart(pkt)).toBe(false);
  });

  it("points stubs at contracts/Holwege paths", () => {
    const paths = holwegeSignablePacket().docs.map((d) => d.stubPath);
    expect(paths).toContain("contracts/Holwege/03_Construction_Agreement.md");
    expect(paths).toContain("contracts/Holwege/01_Initial_Disclosure_45-525.md");
    expect(paths).toContain("contracts/Holwege/08_Dual_Capacity_Disclosure.md");
    expect(paths).toContain(
      "contracts/Holwege/02_Completion_Disclosure_Subcontractors_45-525.md",
    );
  });

  it("marks ready when required docs are signed or uploaded", () => {
    let pkt = holwegeSignablePacket();
    for (const d of requiredStartDocs(pkt)) {
      pkt = applyDocStatus(pkt, d.id, d.id.endsWith("dual") ? "uploaded" : "signed");
    }
    expect(packetReadyToStart(pkt)).toBe(true);
    // completion disclosure still stub — not required for start
    expect(pkt.docs.find((d) => d.kind === "idaho_45_525_completion")?.status).toBe("stub");
  });

  it("falls back to PDF upload when DocuSign keys are missing", () => {
    expect(isDocuSignConfigured(() => undefined)).toBe(false);
    expect(resolveSignChannel(() => undefined)).toBe("pdf_upload");
    const full = (k: string) => (DOCUSIGN_ENV_KEYS.includes(k as (typeof DOCUSIGN_ENV_KEYS)[number]) ? "x" : undefined);
    expect(isDocuSignConfigured(full)).toBe(true);
    expect(resolveSignChannel(full)).toBe("docusign");
  });
});
