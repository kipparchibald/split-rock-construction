import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { FilterChips } from "@/components/layout/filter-chips";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/layout/stat-card";
import { BidStatusBadge } from "@/components/layout/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/data/store";
import type { Client } from "@/data/types";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/app/clients")({ component: ClientsPage });

type Filter = "all" | Client["type"];

function ClientsPage() {
  const clients = useAppStore((s) => s.clients);
  const projects = useAppStore((s) => s.projects);
  const bids = useAppStore((s) => s.bids);
  const addClient = useAppStore((s) => s.addClient);
  const [show, setShow] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [type, setType] = useState<Client["type"]>("homeowner");
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    return clients.filter((c) => (filter === "all" ? true : c.type === filter));
  }, [clients, filter]);

  const pipeline = useMemo(() => {
    return bids
      .filter((b) => b.status === "draft" || b.status === "submitted")
      .reduce((s, b) => s + b.amount, 0);
  }, [bids]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    addClient({ name, email, phone, type, address: "", notes: "" });
    setName("");
    setEmail("");
    setPhone("");
    setType("homeowner");
    setShow(false);
    toast.success("Client added");
  }

  return (
    <div>
      <PageHeader
        title="Clients"
        description="Homeowners, developers, and commercial contacts — jobs and bids on one card."
        actions={
          <Button size="sm" onClick={() => setShow((v) => !v)}>
            {show ? "Cancel" : "Add client"}
          </Button>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <StatCard label="Contacts" value={String(clients.length)} hint="In CRM" />
        <StatCard
          label="Active jobs"
          value={String(projects.filter((p) => !["complete", "on_hold"].includes(p.status)).length)}
          hint="Across all clients"
        />
        <StatCard label="Open bid pipeline" value={formatCurrency(pipeline)} hint="Draft + submitted" />
      </div>

      <FilterChips
        className="mb-4"
        value={filter}
        onChange={setFilter}
        options={[
          { value: "all", label: "All", count: clients.length },
          { value: "homeowner", label: "Homeowner", count: clients.filter((c) => c.type === "homeowner").length },
          { value: "developer", label: "Developer", count: clients.filter((c) => c.type === "developer").length },
          { value: "commercial", label: "Commercial", count: clients.filter((c) => c.type === "commercial").length },
        ]}
      />

      {show ? (
        <form
          onSubmit={submit}
          className="mb-6 grid gap-3 border border-border bg-bg-elevated p-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <div>
            <Label>Name</Label>
            <Input className="mt-1" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <Label>Email</Label>
            <Input className="mt-1" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <Label>Phone</Label>
            <Input className="mt-1" value={phone} onChange={(e) => setPhone(e.target.value)} required />
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
          <Button type="submit" className="sm:col-span-2 lg:col-span-4 sm:w-fit">
            Save client
          </Button>
        </form>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => {
          const jobs = projects.filter((p) => p.clientId === c.id);
          const clientBids = bids.filter((b) => b.clientId === c.id);
          const openBidVal = clientBids
            .filter((b) => b.status === "draft" || b.status === "submitted")
            .reduce((s, b) => s + b.amount, 0);
          return (
            <div key={c.id} className="flex flex-col border border-border bg-bg-elevated p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[13px] font-medium">{c.name}</p>
                <Badge variant="outline">{c.type}</Badge>
              </div>
              <p className="mt-1 text-[12px] text-fg-muted">{c.email}</p>
              <p className="text-[12px] text-fg-muted">{c.phone}</p>
              <p className="mt-2 text-[11px] text-fg-subtle">{c.address || "—"}</p>
              {c.notes ? <p className="mt-2 text-[12px] text-fg-muted">{c.notes}</p> : null}

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
