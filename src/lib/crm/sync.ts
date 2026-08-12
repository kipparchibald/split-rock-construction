import { useAppStore } from "@/data/store";
import { isDemoDataEnabled } from "@/lib/runtime-config";
import {
  fetchCrmSnapshot,
  getCrmCapabilities,
  removeCrmClient,
  removeCrmProspect,
  saveCrmBid,
  saveCrmClient,
  saveCrmProject,
  saveCrmProposal,
  saveCrmProspect,
  saveCrmTour,
} from "./functions";
import { loadLocalCrmSnapshot, pickCrmSlice, saveLocalCrmSnapshot } from "./local";
import type { CrmSnapshot } from "./mappers";

export type CrmPersistenceMode = "demo" | "local" | "server" | "pending";

let mode: CrmPersistenceMode = isDemoDataEnabled ? "demo" : "pending";
let hydrating = false;
let persistTimer: ReturnType<typeof setTimeout> | null = null;
let unsubscribe: (() => void) | null = null;
let lastSnapshotJson = "";

export function getCrmPersistenceMode(): CrmPersistenceMode {
  return mode;
}

function snapshotJson(snapshot: CrmSnapshot): string {
  return JSON.stringify(snapshot);
}

function applySnapshot(snapshot: CrmSnapshot): void {
  hydrating = true;
  useAppStore.setState({
    clients: snapshot.clients,
    prospects: snapshot.prospects,
    projects: snapshot.projects,
    bids: snapshot.bids,
    tours: snapshot.tours,
    proposals: snapshot.proposals,
  });
  lastSnapshotJson = snapshotJson(snapshot);
  hydrating = false;
}

async function persistToServer(snapshot: CrmSnapshot, prev: CrmSnapshot): Promise<void> {
  const clientMap = new Map(prev.clients.map((c) => [c.id, c]));
  for (const client of snapshot.clients) {
    const before = clientMap.get(client.id);
    if (!before || JSON.stringify(before) !== JSON.stringify(client)) {
      await saveCrmClient({ data: client });
    }
  }
  for (const id of clientMap.keys()) {
    if (!snapshot.clients.some((c) => c.id === id)) {
      await removeCrmClient({ data: { id } });
    }
  }

  const prospectMap = new Map(prev.prospects.map((p) => [p.id, p]));
  for (const prospect of snapshot.prospects) {
    const before = prospectMap.get(prospect.id);
    if (!before || JSON.stringify(before) !== JSON.stringify(prospect)) {
      await saveCrmProspect({ data: prospect });
    }
  }
  for (const id of prospectMap.keys()) {
    if (!snapshot.prospects.some((p) => p.id === id)) {
      await removeCrmProspect({ data: { id } });
    }
  }

  const projectMap = new Map(prev.projects.map((p) => [p.id, p]));
  for (const project of snapshot.projects) {
    const before = projectMap.get(project.id);
    if (!before || JSON.stringify(before) !== JSON.stringify(project)) {
      await saveCrmProject({ data: project });
    }
  }

  const bidMap = new Map(prev.bids.map((b) => [b.id, b]));
  for (const bid of snapshot.bids) {
    const before = bidMap.get(bid.id);
    if (!before || JSON.stringify(before) !== JSON.stringify(bid)) {
      await saveCrmBid({ data: bid });
    }
  }

  const tourMap = new Map(prev.tours.map((t) => [t.id, t]));
  for (const tour of snapshot.tours) {
    const before = tourMap.get(tour.id);
    if (!before || JSON.stringify(before) !== JSON.stringify(tour)) {
      await saveCrmTour({ data: tour });
    }
  }

  const proposalMap = new Map(prev.proposals.map((p) => [p.id, p]));
  for (const proposal of snapshot.proposals) {
    const before = proposalMap.get(proposal.id);
    if (!before || JSON.stringify(before) !== JSON.stringify(proposal)) {
      await saveCrmProposal({ data: proposal });
    }
  }
}

function schedulePersist(): void {
  if (hydrating || mode === "demo" || mode === "pending") return;
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    void flushPersist();
  }, 400);
}

async function flushPersist(): Promise<void> {
  if (hydrating || mode === "demo" || mode === "pending") return;
  const state = useAppStore.getState();
  const snapshot = pickCrmSlice(state);
  const json = snapshotJson(snapshot);
  if (json === lastSnapshotJson) return;

  const prev: CrmSnapshot = JSON.parse(lastSnapshotJson || "{}") as CrmSnapshot;
  if (!prev.clients) {
    lastSnapshotJson = json;
    if (mode === "local") saveLocalCrmSnapshot(snapshot);
    return;
  }

  try {
    if (mode === "server") {
      await persistToServer(snapshot, prev);
    } else if (mode === "local") {
      saveLocalCrmSnapshot(snapshot);
    }
    lastSnapshotJson = json;
  } catch (err) {
    console.error("[crm] persist failed:", err);
  }
}

function attachStoreSubscription(): void {
  if (unsubscribe) return;
  let prev = pickCrmSlice(useAppStore.getState());
  unsubscribe = useAppStore.subscribe((state) => {
    if (hydrating || mode === "demo" || mode === "pending") return;
    const next = pickCrmSlice(state);
    if (
      next.clients !== prev.clients ||
      next.prospects !== prev.prospects ||
      next.projects !== prev.projects ||
      next.bids !== prev.bids ||
      next.tours !== prev.tours ||
      next.proposals !== prev.proposals
    ) {
      prev = next;
      schedulePersist();
    }
  });
}

/** Bootstrap CRM persistence — call once from /app layout. */
export async function bootstrapCrmPersistence(): Promise<CrmPersistenceMode> {
  if (isDemoDataEnabled) {
    mode = "demo";
    return mode;
  }

  try {
    const caps = await getCrmCapabilities();
    if (caps.serverPersistence) {
      mode = "server";
      const snapshot = await fetchCrmSnapshot();
      applySnapshot(snapshot);
    } else {
      mode = "local";
      const snapshot = loadLocalCrmSnapshot();
      const hasData =
        snapshot.clients.length > 0 ||
        snapshot.prospects.length > 0 ||
        snapshot.projects.length > 0;
      if (hasData) applySnapshot(snapshot);
      else lastSnapshotJson = snapshotJson(pickCrmSlice(useAppStore.getState()));
    }
  } catch (err) {
    console.warn("[crm] server bootstrap failed, using local storage:", err);
    mode = "local";
    const snapshot = loadLocalCrmSnapshot();
    if (snapshot.clients.length || snapshot.prospects.length || snapshot.projects.length) {
      applySnapshot(snapshot);
    } else {
      lastSnapshotJson = snapshotJson(pickCrmSlice(useAppStore.getState()));
    }
  }

  attachStoreSubscription();
  return mode;
}

/** Force an immediate persist (e.g. after critical mutation). */
export async function flushCrmPersistence(): Promise<void> {
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
  await flushPersist();
}
