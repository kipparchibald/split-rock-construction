import type { CrmSnapshot } from "./mappers";
import { loadJson, saveJson } from "@/lib/local-persist";

export const CRM_LOCAL_KEYS = {
  clients: "crm-clients",
  prospects: "crm-prospects",
  projects: "crm-projects",
  bids: "crm-bids",
  tours: "crm-tours",
  proposals: "crm-proposals",
} as const;

const empty: CrmSnapshot = {
  clients: [],
  prospects: [],
  projects: [],
  bids: [],
  tours: [],
  proposals: [],
};

export function loadLocalCrmSnapshot(): CrmSnapshot {
  return {
    clients: loadJson(CRM_LOCAL_KEYS.clients, empty.clients),
    prospects: loadJson(CRM_LOCAL_KEYS.prospects, empty.prospects),
    projects: loadJson(CRM_LOCAL_KEYS.projects, empty.projects),
    bids: loadJson(CRM_LOCAL_KEYS.bids, empty.bids),
    tours: loadJson(CRM_LOCAL_KEYS.tours, empty.tours),
    proposals: loadJson(CRM_LOCAL_KEYS.proposals, empty.proposals),
  };
}

export function saveLocalCrmSnapshot(snapshot: CrmSnapshot): void {
  saveJson(CRM_LOCAL_KEYS.clients, snapshot.clients);
  saveJson(CRM_LOCAL_KEYS.prospects, snapshot.prospects);
  saveJson(CRM_LOCAL_KEYS.projects, snapshot.projects);
  saveJson(CRM_LOCAL_KEYS.bids, snapshot.bids);
  saveJson(CRM_LOCAL_KEYS.tours, snapshot.tours);
  saveJson(CRM_LOCAL_KEYS.proposals, snapshot.proposals);
}

export function pickCrmSlice(state: {
  clients: CrmSnapshot["clients"];
  prospects: CrmSnapshot["prospects"];
  projects: CrmSnapshot["projects"];
  bids: CrmSnapshot["bids"];
  tours: CrmSnapshot["tours"];
  proposals: CrmSnapshot["proposals"];
}): CrmSnapshot {
  return {
    clients: state.clients,
    prospects: state.prospects,
    projects: state.projects,
    bids: state.bids,
    tours: state.tours,
    proposals: state.proposals,
  };
}
