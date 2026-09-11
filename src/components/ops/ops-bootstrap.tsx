import { useEffect } from "react";
import { useAppStore } from "@/data/store";
import { ensureHolwegeForPortal } from "@/data/holwege-portal";
import { ensureHolwegeCrewSeed } from "@/lib/field-money";
import { pickOpsSlice, saveOpsSnapshot } from "@/lib/ops-persist";
import { isDemoDataEnabled } from "@/lib/runtime-config";

let saveTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleOpsSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveOpsSnapshot(pickOpsSlice(useAppStore.getState()));
    saveTimer = null;
  }, 400);
}

/**
 * Persists draws, logs, COs, and related ops slices to localStorage in live mode.
 * Demo mode keeps everything in memory for a clean showcase.
 * Also idempotently seeds Holwege SOR + portal invite when live CRM has no p-holwege yet.
 */
export function OpsBootstrap() {
  useEffect(() => {
    if (isDemoDataEnabled) return;
    ensureHolwegeForPortal(useAppStore);
    const crew = ensureHolwegeCrewSeed({
      members: useAppStore.getState().members,
      crews: useAppStore.getState().crews,
    });
    if (crew.seeded) {
      useAppStore.setState({ members: crew.members, crews: crew.crews });
    }
    const unsub = useAppStore.subscribe(scheduleOpsSave);
    return () => {
      unsub();
      if (saveTimer) {
        clearTimeout(saveTimer);
        saveOpsSnapshot(pickOpsSlice(useAppStore.getState()));
      }
    };
  }, []);

  return null;
}
