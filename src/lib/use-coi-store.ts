import { useCallback, useState } from "react";
import type { InsurancePolicy, Vendor } from "@/data/types";
import { loadJson, saveJson, PERSIST_KEYS } from "@/lib/local-persist";
import { isDemoDataEnabled } from "@/lib/runtime-config";
import {
  SAMPLE_VENDORS,
  refreshPolicyStatuses,
  samplePolicies,
} from "@/lib/sub-insurance";

/**
 * Vendors + policies with localStorage survival across refresh.
 * Demo mode seeds sample COIs; live mode starts empty until you add subs.
 */
export function useCoiStore() {
  const [vendors, setVendorsState] = useState<Vendor[]>(() => {
    const saved = loadJson<Vendor[] | null>(PERSIST_KEYS.vendors, null);
    if (saved && saved.length > 0) return saved;
    return isDemoDataEnabled ? SAMPLE_VENDORS : [];
  });

  const [policies, setPoliciesState] = useState<InsurancePolicy[]>(() => {
    const saved = loadJson<InsurancePolicy[] | null>(PERSIST_KEYS.policies, null);
    if (saved && saved.length > 0) return refreshPolicyStatuses(saved);
    return isDemoDataEnabled ? refreshPolicyStatuses(samplePolicies) : [];
  });

  const setVendors = useCallback((next: Vendor[] | ((prev: Vendor[]) => Vendor[])) => {
    setVendorsState((prev) => {
      const value = typeof next === "function" ? next(prev) : next;
      saveJson(PERSIST_KEYS.vendors, value);
      return value;
    });
  }, []);

  const setPolicies = useCallback(
    (next: InsurancePolicy[] | ((prev: InsurancePolicy[]) => InsurancePolicy[])) => {
      setPoliciesState((prev) => {
        const value = typeof next === "function" ? next(prev) : next;
        const refreshed = refreshPolicyStatuses(value);
        saveJson(PERSIST_KEYS.policies, refreshed);
        return refreshed;
      });
    },
    [],
  );

  const initialVendorId =
    vendors[0]?.id ??
    (isDemoDataEnabled ? SAMPLE_VENDORS[0]?.id ?? "" : "");

  return { vendors, setVendors, policies, setPolicies, initialVendorId };
}
