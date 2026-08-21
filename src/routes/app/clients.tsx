import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Copy, Link2, Pencil, ShieldOff } from "lucide-react";
import { FilterChips } from "@/components/layout/filter-chips";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/layout/stat-card";
import { BidStatusBadge } from "@/components/layout/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/data/store";
import type { Client } from "@/data/types";
import { portalInvitePath, writePortalSession } from "@/lib/client-portal";
import { ModeCallout } from "@/components/layout/mode-callout";
import { isDemoDataEnabled, LIVE_EMPTY_HINT } from "@/lib/runtime-config";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/app/clients")({ component: ClientsPage });

type Filter = "all" | Client["type"] | "portal";

function portalBadge(status: Client["portalStatus"]) {
  if (status === "active") return { label: "Portal active", variant: "success" as const };
  if (status === "invited") return { label: "Invited", variant: "warning" as const };
  if (status === "revoked") return { label: "Revoked", variant: "danger" as const };
  return { label: "Not invited", variant: "outline" as const };
}

function ClientsPage() {
  const clients = useAppStore((s) => s.clients);
  const projects = useAppStore((s) => s.projects);
  const bids = useAppStore((s) => s.bids);
  const addClient = useAppStore((s) => s.addClient);
  const updateClient = useAppStore((s) => s.updateClient);
  const inviteClientPortal = useAppStore((s) => s.inviteClientPortal);
  const revokeClientPortal = useAppStore((s) => s.revokeClientPortal);
  const markClientPortalLogin = useAppStore((s) => s.markClientPortalLogin);
  const [show, setShow] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [type, setType] = useState<Client["type"]>("homeowner");
  const [filter, setFilter] = useState<Filter>("all");
  const [inviteAlso, setInviteAlso] = useState(true);

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      if (filter === "all") return true;
      if (filter === "portal")
        return c.portalStatus === "invited" || c.portalStatus === "active";
      return c.type === filter;
    });
  }, [clients, filter]);

  const pipeline = useMemo(() => {
    return bids
      .filter((b) => b.status === "draft" || b.status === "submitted")
      .reduce((s, b) => s + b.amount, 0);
  }, [bids]);

  const portalReady = clients.filter(
    (c) => c.portalStatus === "invited" || c.portalStatus === "active",
  ).length;

  function resetForm() {
    setName("");
    setEmail("");
    setPhone("");
    setAddress("");
    setNotes("");
    setType("homeowner");
    setEditingId(null);
  }

  function startEdit(c: Client) {
    setEditingId(c.id);
    setName(c.name);
    setEmail(c.email);
    setPhone(c.phone);
    setAddress(c.address);
    setNotes(c.notes);
    setType(c.type);
    setShow(true);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (editingId) {
      updateClient(editingId, { name, email, phone, type, address, notes });
      toast.success("Client updated");
      resetForm();
      setShow(false);
      return;
    }
    addClient({
      name,
      email,
      phone,
      type,
      address,
      notes,
      portalStatus: "none",
    });
    // Find newly added (first in list) after state update — invite by email next tick
    const emailSaved = email.trim().toLowerCase();
    resetForm();
    setShow(false);
    toast.success("Client added");

    if (inviteAlso) {
      // Defer invite until store has the new client
      queueMicrotask(() => {
        const state = useAppStore.getState();
        const created = state.clients.find(
          (c) => c.email.trim().toLowerCase() === emailSaved,
        );
        if (created) {
          const res = state.inviteClientPortal(created.id);
          if (res) {
            toast.success("Portal invite ready", {
              description: `Access code ${res.token} — copy link from the client card.`,
            });
          }
        }
      });
    }
  }

  function copyInvite(c: Client) {
    if (!c.portalToken) {
      toast.message("Invite first to generate a code");
      return;
    }
    const path = portalInvitePath(c.id, c.portalToken);
    const url =
      typeof window !== "undefined" ? `${window.location.origin}${path}` : path;
    void navigator.clipboard.writeText(url).then(
      () => toast.success("Invite link copied", { description: url }),
      () => toast.message("Copy this link", { description: url }),
    );
  }

  function invite(c: Client) {
    const res = inviteClientPortal(c.id);
    if (res) {
      toast.success(`Invite code ${res.token}`, {
        description: "Share the link — only this client can use it.",
      });
      copyInvite({ ...c, portalToken: res.token, portalStatus: "invited" });
    }
  }

  function previewAsClient(c: Client) {
    if (!c.portalToken || c.portalStatus === "revoked" || c.portalStatus === "none") {
      toast.message("Invite the client first");
      return;
    }
    writePortalSession({
      clientId: c.id,
      token: c.portalToken,
      name: c.name,
      email: c.email,
      signedInAt: new Date().toISOString(),
    });
    markClientPortalLogin(c.id);
    toast.success(`Viewing portal as ${c.name}`);
    window.location.href = "/app/portal";
  }

  return (
    <div>
      <PageHeader
        title="Clients"
        description="Onboard homeowners with a private portal invite. Each client only ever sees their own jobs."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" asChild>
              <Link to="/portal/login">Client sign-in page</Link>
            </Button>
            <Button size="sm" onClick={() => { resetForm(); setShow((v) => !v); }}>
              {show ? "Cancel" : "Add client"}
            </Button>
          </div>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <StatCard label="Contacts" value={String(clients.length)} hint="In CRM" />
        <StatCard
          label="Portal access"
          value={String(portalReady)}
          hint="Invited or active"
        />
        <StatCard label="Open bid pipeline" value={formatCurrency(pipeline)} hint="Draft + submitted" />
      </div>

      <div className="mb-4 border border-border bg-bg-elevated p-4 text-[12px] leading-relaxed text-fg-muted">
        <p className="font-medium text-fg">Onboarding flow</p>
        <ol className="mt-2 list-decimal space-y-1 pl-4">
          <li>Add the client (email required — becomes their portal login).</li>
          <li>
            <strong className="text-fg">Invite to portal</strong> issues a unique access code
            and invite link.
          </li>
          <li>Client opens the link, signs in, and only sees jobs under their account.</li>
          <li>Revoke anytime to cut off access and invalidate the old code.</li>
        </ol>
      </div>

      <FilterChips
        className="mb-4"
        value={filter}
        onChange={setFilter}
        options={[
          { value: "all", label: "All", count: clients.length },
          { value: "portal", label: "Portal", count: portalReady },
          {
            value: "homeowner",
            label: "Homeowner",
            count: clients.filter((c) => c.type === "homeowner").length,
          },
          {
            value: "developer",
            label: "Developer",
            count: clients.filter((c) => c.type === "developer").length,
          },
          {
            value: "commercial",
            label: "Commercial",
            count: clients.filter((c) => c.type === "commercial").length,
          },
        ]}
      />

      {show ? (
        <form
          onSubmit={submit}
          className="mb-6 grid gap-3 border border-border bg-bg-elevated p-4 sm:grid-cols-2 lg:grid-cols-4"
          data-testid="client-form"
        >
          <div>
            <Label>Name</Label>
            <Input className="mt-1" value={name} onChange={(e) => setName(e.target.value)} required data-testid="client-name" />
          </div>
          <div>
            <Label>Email (portal login)</Label>
            <Input
              className="mt-1"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              data-testid="client-email"
            />
          </div>
          <div>
            <Label>Phone</Label>
            <Input className="mt-1" value={phone} onChange={(e) => setPhone(e.target.value)} required data-testid="client-phone" />
          </div>
          <div>
            <Label>Type</Label>
            <select
              className="mt-1 flex h-9 w-full border border-border bg-bg px-3 text-[13px]"
              value={type}
              onChange={(e) => setType(e.target.value as Client["type"])}
            >
              <option value="homeowner">Homeowner</option>
              <option value="developer">Developer</option>
              <option value="commercial">Commercial</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <Label>Address</Label>
            <Input className="mt-1" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label>Notes</Label>
            <Textarea className="mt-1" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
          {!editingId ? (
            <label className="flex items-center gap-2 text-[12px] text-fg-muted sm:col-span-2">
              <input
                type="checkbox"
                checked={inviteAlso}
                onChange={(e) => setInviteAlso(e.target.checked)}
              />
              Invite to portal immediately (generate access code)
            </label>
          ) : null}
          <Button type="submit" className="sm:col-span-2 lg:col-span-4 sm:w-fit" data-testid="client-save">
            {editingId ? "Save changes" : "Save client"}
          </Button>
        </form>
      ) : null}

      {clients.length === 0 ? (
        <div className="space-y-4 border border-dashed border-border bg-bg-elevated px-6 py-12 text-center">
          <ModeCallout empty className="mx-auto max-w-lg text-left" />
          <p className="text-[15px] font-medium">No clients yet</p>
          <p className="mt-2 text-[13px] text-fg-muted">
            {isDemoDataEnabled
              ? "Demo clients load when training mode is on — they are not real homeowners."
              : LIVE_EMPTY_HINT}
          </p>
          <Button className="mt-4" size="sm" onClick={() => { resetForm(); setShow(true); }}>
            Add your first client
          </Button>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => {
          const jobs = projects.filter((p) => p.clientId === c.id);
          const clientBids = bids.filter((b) => b.clientId === c.id);
          const openBidVal = clientBids
            .filter((b) => b.status === "draft" || b.status === "submitted")
            .reduce((s, b) => s + b.amount, 0);
          const pb = portalBadge(c.portalStatus ?? "none");
          return (
            <div
              key={c.id}
              className="flex flex-col border border-border bg-bg-elevated p-4"
              data-testid={`client-card-${c.id}`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-[13px] font-medium">{c.name}</p>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant="outline">{c.type}</Badge>
                  <Badge variant={pb.variant}>{pb.label}</Badge>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="mt-2 h-7 w-fit px-2 text-[11px] text-fg-muted"
                onClick={() => startEdit(c)}
              >
                <Pencil className="h-3 w-3" />
                Edit
              </Button>
              <p className="mt-1 text-[12px] text-fg-muted">{c.email}</p>
              <p className="text-[12px] text-fg-muted">{c.phone}</p>
              <p className="mt-2 text-[11px] text-fg-subtle">{c.address || "—"}</p>
              {c.notes ? <p className="mt-2 text-[12px] text-fg-muted">{c.notes}</p> : null}

              {/* Portal onboarding */}
              <div className="mt-3 space-y-2 border-t border-border pt-3">
                <p className="label-caps">Portal access</p>
                {c.portalToken ? (
                  <p className="font-mono text-[12px] tracking-wider text-fg">
                    Code · {c.portalToken}
                  </p>
                ) : (
                  <p className="text-[11px] text-fg-subtle">No code yet</p>
                )}
                <div className="flex flex-wrap gap-1.5">
                  <Button size="sm" className="min-h-9" onClick={() => invite(c)}>
                    <Link2 className="h-3.5 w-3.5" />
                    {c.portalToken ? "Re-invite" : "Invite to portal"}
                  </Button>
                  {c.portalToken ? (
                    <Button size="sm" variant="outline" className="min-h-9" onClick={() => copyInvite(c)}>
                      <Copy className="h-3.5 w-3.5" />
                      Copy link
                    </Button>
                  ) : null}
                  {c.portalToken && c.portalStatus !== "revoked" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="min-h-9"
                      onClick={() => previewAsClient(c)}
                    >
                      Preview as client
                    </Button>
                  ) : null}
                  {c.portalStatus !== "revoked" && c.portalStatus !== "none" ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="min-h-9"
                      onClick={() => {
                        revokeClientPortal(c.id);
                        toast.message("Portal access revoked");
                      }}
                    >
                      <ShieldOff className="h-3.5 w-3.5" />
                      Revoke
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="mt-3 border-t border-border pt-3">
                <p className="label-caps mb-1.5">Jobs · {jobs.length}</p>
                {jobs.length === 0 ? (
                  <p className="text-[11px] text-fg-subtle">No jobs yet</p>
                ) : (
                  <ul className="space-y-1">
                    {jobs.map((j) => (
                      <li key={j.id}>
                        <Link
                          to="/app/projects/$projectId"
                          params={{ projectId: j.id }}
                          className="text-[12px] text-fg-muted hover:underline"
                        >
                          {j.name}
                          <span className="text-fg-subtle"> · {j.status.replace(/_/g, " ")}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {clientBids.length > 0 ? (
                <div className="mt-3 border-t border-border pt-3">
                  <p className="label-caps mb-1.5">
                    Bids · {clientBids.length}
                    {openBidVal > 0 ? ` · ${formatCurrency(openBidVal)} open` : ""}
                  </p>
                  <ul className="space-y-1.5">
                    {clientBids.slice(0, 4).map((b) => (
                      <li key={b.id} className="flex items-center justify-between gap-2">
                        <span className="truncate text-[11px] text-fg-muted">{b.title}</span>
                        <BidStatusBadge status={b.status} />
                      </li>
                    ))}
                  </ul>
                  <Link to="/app/bids" className="mt-2 inline-block text-[11px] text-fg-subtle hover:underline">
                    Open bid board
                  </Link>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
