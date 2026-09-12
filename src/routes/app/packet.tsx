import { useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ChevronDown, ChevronRight, FileSignature, Paperclip, Scale } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/data/store";
import {
  HOLWEGE_LAND_NOTE,
  HOLWEGE_LAND_PAID,
  HOLWEGE_PROJECT_ID,
} from "@/data/holwege";
import { fillContract, jobToContractInput } from "@/lib/contract-from-inputs";
import { saveDocAttachment } from "@/lib/doc-file-store";
import {
  applyDocStatus,
  holwegeSignablePacket,
  mergePersistedStatuses,
  packetReadyToStart,
  persistDocStatus,
  resolveSignChannel,
  type PacketDocStatus,
  type SignablePacket,
} from "@/lib/signable-packet";
import { toast } from "sonner";

export const Route = createFileRoute("/app/packet")({ component: PacketPage });

const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024;

function statusVariant(status: PacketDocStatus) {
  if (status === "signed" || status === "uploaded") return "success" as const;
  if (status === "ready_for_sign") return "warning" as const;
  return "secondary" as const;
}

function formatUsd(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function PacketPage() {
  const projects = useAppStore((s) => s.projects);
  const clients = useAppStore((s) => s.clients);
  const budgetLines = useAppStore((s) => s.budgetLines);
  const bids = useAppStore((s) => s.bids);
  const documents = useAppStore((s) => s.documents);
  const attachDocumentFile = useAppStore((s) => s.attachDocumentFile);
  const acknowledgeDualCapacity = useAppStore((s) => s.acknowledgeDualCapacity);
  const realtyDeals = useAppStore((s) => s.realtyDeals);
  const [packet, setPacket] = useState<SignablePacket>(() =>
    mergePersistedStatuses(holwegeSignablePacket()),
  );
  const [openBodies, setOpenBodies] = useState<Record<string, boolean>>({
    "pkt-doc-agreement": true,
  });
  const [useFilled, setUseFilled] = useState(true);
  const channel = useMemo(() => resolveSignChannel(), []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingDocId = useRef<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const project = projects.find((p) => p.id === packet.projectId);
  const client = clients.find((c) => c.id === project?.clientId);
  const ready = packetReadyToStart(packet);
  const deal = realtyDeals.find((d) => d.projectId === packet.projectId);

  const planDoc = documents.find(
    (d) => d.projectId === packet.projectId && d.type === "drawing",
  );
  const jobLines = budgetLines.filter((l) => l.projectId === packet.projectId);
  const bid = bids.find((b) => b.projectId === packet.projectId);

  const filled = useMemo(() => {
    if (!project || !client) return null;
    const lines = budgetLines
      .filter((l) => l.projectId === project.id)
      .map((l) => ({ category: l.category, budgeted: l.budgeted }));
    return fillContract(
      jobToContractInput({
        projectId: project.id,
        projectName: project.name,
        address: project.address,
        clientName: client.name,
        clientEmail: client.email,
        description: project.description,
        sqft: project.sqft,
        startDate: project.startDate,
        endDate: project.endDate,
        planTitle: planDoc?.title ?? project.description,
        planDate: planDoc?.updatedAt,
        planAuthor: planDoc?.author,
        budgetLines: lines,
        bidLines: bid?.lineItems,
        landPaid: project.id === HOLWEGE_PROJECT_ID ? HOLWEGE_LAND_PAID : undefined,
        landNote: project.id === HOLWEGE_PROJECT_ID ? HOLWEGE_LAND_NOTE : undefined,
      }),
    );
  }, [project, client, planDoc, budgetLines, bid]);

  const displayPacket = useMemo(() => {
    if (!useFilled || !filled) return packet;
    return {
      ...packet,
      owners: filled.owners.length ? filled.owners : packet.owners,
      contractPrice: filled.money.contractPrice || packet.contractPrice,
      drawBase: filled.money.drawBase || packet.drawBase,
      docs: packet.docs.map((d) => {
        if (d.kind === "construction_agreement") {
          return {
            ...d,
            body: filled.agreementBody,
            summary: filled.ready
              ? `Auto-filled from buyer, plan, and cost breakdown — ${formatUsd(filled.money.contractPrice)}.`
              : `Missing: ${filled.missing.join(", ")}. Add those on the job and this fills.`,
          };
        }
        return d;
      }),
    };
  }, [packet, filled, useFilled]);

  function setDoc(docId: string, status: PacketDocStatus) {
    setPacket((prev) => applyDocStatus(prev, docId, status));
    persistDocStatus(docId, status);
  }

  function markReady(docId: string) {
    setDoc(docId, "ready_for_sign");
    toast.message("Marked ready for signature");
  }

  function markSigned(docId: string, kind: string) {
    setDoc(docId, "signed");
    if (kind === "dual_capacity" && deal?.dualCapacity === "pending_disclosure") {
      acknowledgeDualCapacity(deal.id, "Owners (packet)");
    }
    toast.success("Recorded as signed (ops status — not a legal e-sign)");
  }

  function startUpload(docId: string) {
    pendingDocId.current = docId;
    fileInputRef.current?.click();
  }

  async function onFileSelected(file: File | undefined) {
    const docId = pendingDocId.current;
    pendingDocId.current = null;
    if (!docId || !file) return;
    if (file.size > MAX_ATTACHMENT_BYTES) {
      toast.error("File too large — max 8 MB");
      return;
    }
    const doc = packet.docs.find((d) => d.id === docId);
    if (!doc) return;
    setUploadingId(docId);
    try {
      const stored = await saveDocAttachment(doc.documentId, file);
      attachDocumentFile(doc.documentId, {
        attachmentId: stored.id,
        attachmentName: stored.name,
        attachmentSize: stored.size,
      });
      setDoc(docId, "uploaded");
      if (doc.kind === "dual_capacity" && deal?.dualCapacity === "pending_disclosure") {
        acknowledgeDualCapacity(deal.id, "Owners (uploaded PDF)");
      }
      toast.success(
        channel === "docusign"
          ? "Signed PDF attached"
          : "PDF uploaded (DocuSign keys not configured — upload fallback).",
      );
    } catch {
      toast.error("Could not save attachment — IndexedDB may be unavailable");
    } finally {
      setUploadingId(null);
    }
  }

  function toggleBody(id: string) {
    setOpenBodies((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function downloadFilled() {
    if (!filled) return;
    const blob = new Blob([filled.agreementBody, "\n\n", filled.exhibitB], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${packet.projectId}-construction-agreement.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded filled agreement — print to PDF for Form Simplicity");
  }

  return (
    <div>
      <PageHeader
        title="Signable packet"
        description="Construction agreement auto-fills from buyer, plan, and cost breakdown. Export PDF for Form Simplicity / Sabal Sign."
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link to="/app/projects/$projectId" params={{ projectId: packet.projectId }}>
              Job hub
            </Link>
          </Button>
        }
      />

      <div className="mb-4 border border-warning/40 bg-warning/5 p-3 text-[12px] leading-relaxed text-fg-muted">
        <p className="flex items-start gap-2 font-medium text-fg">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" strokeWidth={1.75} />
          Counsel review required
        </p>
        <p className="mt-1">{displayPacket.counselBanner}</p>
      </div>

      <Card className="mb-4">
        <CardHeader className="flex-row flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle>Auto-fill from this job</CardTitle>
            <p className="mt-1 text-[12px] text-fg-muted">
              Buyer: {client?.name ?? "—"} · Plan: {planDoc?.title ?? "job description"} · Lines:{" "}
              {jobLines.length || bid?.lineItems.length || 0}
            </p>
          </div>
          <Badge variant={filled?.ready ? "success" : "warning"}>
            {filled?.ready ? "Ready to populate" : `Need ${filled?.missing.join(", ") ?? "job data"}`}
          </Badge>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2 text-[12px] text-fg-muted">
          <Button size="sm" variant={useFilled ? "default" : "outline"} onClick={() => setUseFilled(true)} disabled={!filled}>
            Use filled contract
          </Button>
          <Button size="sm" variant={!useFilled ? "default" : "outline"} onClick={() => setUseFilled(false)}>
            Use saved Holwege file
          </Button>
          <Button size="sm" variant="outline" onClick={downloadFilled} disabled={!filled}>
            Download for Form Simplicity
          </Button>
          {filled ? (
            <span>
              Contract {formatUsd(filled.money.contractPrice)} · Draw base {formatUsd(filled.money.drawBase)}
            </span>
          ) : null}
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader className="flex-row flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle>{displayPacket.label}</CardTitle>
            <p className="mt-1 text-[12px] text-fg-muted">
              {project?.name ?? displayPacket.projectId} · {displayPacket.owners.join(" & ")} ·{" "}
              {displayPacket.contractor} · license {displayPacket.contractorLicense}
            </p>
            <p className="mt-1 text-[12px] text-fg-muted">
              Contract {formatUsd(displayPacket.contractPrice)} · Draw base {formatUsd(displayPacket.drawBase)} · land excluded
            </p>
          </div>
          <Badge variant={ready ? "success" : "warning"}>
            {ready ? "Required docs satisfied" : "Signatures pending"}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-2 text-[12px] text-fg-muted">
          <p className="flex items-start gap-2">
            <Scale className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
            {displayPacket.brokerageNote}
          </p>
          <p className="flex items-start gap-2">
            <FileSignature className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
            Sign path: Form Simplicity / Sabal Sign — download the filled agreement, print to PDF, upload, tag signatures.
          </p>
        </CardContent>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,application/pdf"
        onChange={(e) => void onFileSelected(e.target.files?.[0])}
      />

      <div className="space-y-2">
        {displayPacket.docs.map((d) => {
          const open = Boolean(openBodies[d.id]);
          return (
            <div key={d.id} className="border border-border bg-bg-elevated p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[13px] font-medium">{d.title}</p>
                  <p className="mt-0.5 text-[12px] text-fg-muted">{d.summary}</p>
                  <p className="mt-1 text-[11px] text-fg-subtle">
                    Source: <code className="text-[10px]">{d.sourcePath}</code>
                    {d.requiredForStart ? " · required to start" : " · closeout"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={statusVariant(d.status)}>{d.status.replace(/_/g, " ")}</Badge>
                  {d.status === "stub" ? (
                    <Button size="sm" variant="outline" onClick={() => markReady(d.id)}>
                      Ready to sign
                    </Button>
                  ) : null}
                  {d.status === "stub" || d.status === "ready_for_sign" ? (
                    <>
                      <Button size="sm" variant="outline" onClick={() => markSigned(d.id, d.kind)}>
                        Record signed
                      </Button>
                      <Button size="sm" variant="outline" disabled={uploadingId === d.id} onClick={() => startUpload(d.id)}>
                        <Paperclip className="h-3.5 w-3.5" strokeWidth={1.75} />
                        Upload signed PDF
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" variant="outline" disabled={uploadingId === d.id} onClick={() => startUpload(d.id)}>
                      <Paperclip className="h-3.5 w-3.5" strokeWidth={1.75} />
                      Replace PDF
                    </Button>
                  )}
                </div>
              </div>
              <button type="button" className="mt-3 flex items-center gap-1 text-[11px] font-medium text-fg-muted hover:text-fg" onClick={() => toggleBody(d.id)}>
                {open ? <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.75} /> : <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.75} />}
                {open ? "Hide document" : "Show document"}
              </button>
              {open ? (
                <pre className="mt-2 max-h-[28rem] overflow-auto whitespace-pre-wrap rounded border border-border bg-bg p-3 text-[11px] leading-relaxed text-fg">
                  {d.body}
                </pre>
              ) : null}
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-[11px] text-fg-subtle">
        Next job: add a buyer, attach a plan, enter the cost breakdown. This page fills the same clauses from those three pieces.
      </p>
    </div>
  );
}
