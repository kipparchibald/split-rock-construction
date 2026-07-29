import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/data/store";
import { toast } from "sonner";

export const Route = createFileRoute("/app/clients")({ component: ClientsPage });

function ClientsPage() {
  const { clients, projects, addClient } = useAppStore();
  const [show, setShow] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    addClient({ name, email, phone, type: "homeowner", address: "", notes: "" });
    setName(""); setEmail(""); setPhone(""); setShow(false);
    toast.success("Client added");
  }

  return (
    <div>
      <PageHeader title="Clients" description="Homeowners, developers, and commercial contacts." actions={
        <Button size="sm" onClick={() => setShow((v) => !v)}>{show ? "Cancel" : "Add client"}</Button>
      } />
      {show ? (
        <form onSubmit={submit} className="mb-6 grid gap-3 border border-border bg-bg-elevated p-4 sm:grid-cols-3">
          <div><Label>Name</Label><Input className="mt-1" value={name} onChange={(e) => setName(e.target.value)} required /></div>
          <div><Label>Email</Label><Input className="mt-1" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
          <div><Label>Phone</Label><Input className="mt-1" value={phone} onChange={(e) => setPhone(e.target.value)} required /></div>
          <Button type="submit">Save</Button>
        </form>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {clients.map((c) => {
          const jobs = projects.filter((p) => p.clientId === c.id);
          return (
            <div key={c.id} className="border border-border bg-bg-elevated p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[13px] font-medium">{c.name}</p>
                <Badge variant="outline">{c.type}</Badge>
              </div>
              <p className="mt-1 text-[12px] text-fg-muted">{c.email}</p>
              <p className="text-[12px] text-fg-muted">{c.phone}</p>
              <p className="mt-2 text-[11px] text-fg-subtle">{jobs.length} job{jobs.length === 1 ? "" : "s"} · {c.address || "—"}</p>
              {c.notes ? <p className="mt-2 text-[12px] text-fg-muted">{c.notes}</p> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
