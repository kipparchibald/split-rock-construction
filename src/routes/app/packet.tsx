import { useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, FileSignature, Paperclip, Scale } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/data/store";
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

function PacketPage() {
  const projects = useAppStore((s) => s.projects);
  const attachDocumentFile = useAppStore((s) => s.attachDocumentFile);
  const acknowledgeDualCapacity = useAppStore((s) => s.acknowledgeDualCapacity);
  const realtyDeals = useAppStore((s) => s.realtyDeals);
  const [packet, setPacket] = useState<SignablePacket>(() =>
    mergePersistedStatuses(holwegeSignablePacket()),
  );
  const channel = useMemo(() => resolveSignChannel(), []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingDocId = useRef<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const project = projects.find((p) => p.id === packet.projectId);
  const ready = packetReadyToStart(packet);
  const deal = realtyDeals.find((d) => d.projectId === packet.projectId);

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
          : "PDF uploaded (DocuSign keys not configured — upload fallback)",
      );
    } catch {
      toast.error("Could not save attachment — IndexedDB may be unavailable");
    } finally {
      setUploadingId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Signable packet"
        description="SRC-6 — construction agreement, Idaho § 45-525, and dual-capacity for Holwege. Stubs from contracts/Holwege/."
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link
              to="/app/projects/$projectId"
              params={{ projectId: packet.projectId }}
            >
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
        <p className="mt-1">{packet.counselBanner}</p>
      </div>

      <Card className="mb-4">
        <CardHeader className="flex-row flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle>{packet.label}</CardTitle>
            <p className="mt-1 text-[12px] text-fg-muted">
              {project?.name ?? packet.projectId} · {packet.owners.join(" & ")} ·{" "}
              {packet.contractor} · license {packet.contractorLicense}
            </p>
          </div>
          <Badge variant={ready ? "success" : "warning"}>
            {ready ? "Required docs satisfied" : "Signatures pending"}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-2 text-[12px] text-fg-muted">
          <p className="flex items-start gap-2">
            <Scale className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
            {packet.brokerageNote}
          </p>
          <p className="flex items-start gap-2">
            <FileSignature className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
            Sign channel:{" "}
            {channel === "docusign"
              ? "DocuSign keys detected — send via DocuSign when wired, or attach returned PDF."
              : "DocuSign keys missing — use PDF upload fallback (this browser only until cloud storage is wired)."}
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
        {packet.docs.map((d) => (
          <div
            key={d.id}
            className="flex flex-col gap-2 border border-border bg-bg-elevated p-4 sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="min-w-0">
              <p className="text-[13px] font-medium">{d.title}</p>
              <p className="mt-0.5 text-[12px] text-fg-muted">{d.summary}</p>
              <p className="mt-1 text-[11px] text-fg-subtle">
                Stub: <code className="text-[10px]">{d.stubPath}</code>
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
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={uploadingId === d.id}
                    onClick={() => startUpload(d.id)}
                  >
                    <Paperclip className="h-3.5 w-3.5" strokeWidth={1.75} />
                    {channel === "docusign" ? "Attach DocuSign PDF" : "Upload PDF"}
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={uploadingId === d.id}
                  onClick={() => startUpload(d.id)}
                >
                  <Paperclip className="h-3.5 w-3.5" strokeWidth={1.75} />
                  Replace PDF
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 text-[11px] text-fg-subtle">
        Fence: Holwege budget / draw base and Portal owner UI are untouched. Money figures stay in{" "}
        <code className="text-[10px]">contracts/Holwege/</code> + Holwege SOR seed.
      </p>
    </div>
  );
}
