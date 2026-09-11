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

describe("Holwege signable packet (SoT bodies)", () => {
  it("seeds Holwege packet from real SoT docs without inventing parties", () => {
    const pkt = holwegeSignablePacket();
    expect(pkt.projectId).toBe(HOLWEGE_PROJECT_ID);
    expect(pkt.owners).toEqual(["Lauren Holwege", "Cindy Holwege"]);
    expect(pkt.contractorLicense).toBe("6481622");
    expect(pkt.counselBanner).toBe(LEGAL_DRAFT_DISCLAIMER);
    expect(pkt.brokerageNote.toLowerCase()).toMatch(/archibald-bagley/);
    expect(pkt.contractPrice).toBe(689299.65);
    expect(pkt.drawBase).toBe(659330.1);
  });

  it("requires agreement + 45-525 initial + dual-capacity before start", () => {
    const pkt = holwegeSignablePacket();
    const kinds = requiredStartDocs(pkt).map((d) => d.kind).sort();
    expect(kinds).toEqual(
      ["construction_agreement", "dual_capacity", "idaho_45_525_initial"].sort(),
    );
    expect(packetReadyToStart(pkt)).toBe(false);
  });

  it("wires main SoT paths and non-empty bodies; required docs are ready_for_sign", () => {
    const docs = holwegeSignablePacket().docs;
    const paths = docs.map((d) => d.sourcePath);
    expect(paths).toContain("contracts/Holwege/03_Construction_Agreement.md");
    expect(paths).toContain("contracts/Holwege/01_Initial_Disclosure_45-525.md");
    expect(paths).toContain("contracts/Holwege/03_Construction_Agreement.md#13-dual-capacity");
    expect(paths).toContain(
      "contracts/Holwege/02_Completion_Disclosure_Subcontractors_45-525.md",
    );
    for (const d of docs) {
      expect(d.body.length).toBeGreaterThan(200);
      expect(d.status).toBe("ready_for_sign");
      expect(d.summary.toLowerCase()).not.toMatch(/stub to replace/);
    }
    const agreement = docs.find((d) => d.kind === "construction_agreement")!;
    expect(agreement.body).toMatch(/\$689,299\.65/);
    expect(agreement.body).toMatch(/\$659,330\.10/);
    expect(agreement.body).toMatch(/\$98,000/);
    expect(agreement.body.toLowerCase()).toMatch(/not.*part of the contract price|not included/);
  });

  it("marks ready when required docs are signed or uploaded", () => {
    let pkt = holwegeSignablePacket();
    for (const d of requiredStartDocs(pkt)) {
      pkt = applyDocStatus(pkt, d.id, d.id.endsWith("dual") ? "uploaded" : "signed");
    }
    expect(packetReadyToStart(pkt)).toBe(true);
    expect(pkt.docs.find((d) => d.kind === "idaho_45_525_completion")?.status).toBe(
      "ready_for_sign",
    );
  });

  it("falls back to PDF upload when DocuSign keys are missing", () => {
    expect(isDocuSignConfigured(() => undefined)).toBe(false);
    expect(resolveSignChannel(() => undefined)).toBe("pdf_upload");
    const full = (k: string) =>
      DOCUSIGN_ENV_KEYS.includes(k as (typeof DOCUSIGN_ENV_KEYS)[number]) ? "x" : undefined;
    expect(isDocuSignConfigured(full)).toBe(true);
    expect(resolveSignChannel(full)).toBe("docusign");
  });
});
