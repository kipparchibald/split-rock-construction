import { lazy, Suspense, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Box,
  Check,
  ExternalLink,
  FileText,
  FileUp,
  Lock,
  ShoppingBag,
  Unlock,
  Upload,
} from "lucide-react";
import { DesignSwatch } from "@/components/design/design-swatch";
import { PlanSheetViewer } from "@/components/design/plan-sheet-viewer";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { DesignCategory, DesignOption, DesignTier } from "@/data/types";
import { plans } from "@/data/plans";
import {
  DEFAULT_CONTRACT_MODEL,
  feePolicyFor,
} from "@/lib/contract-fee-policy";
import {
  BASE_ALLOWANCES,
  DEFAULT_SELECTIONS,
  DESIGN_CATEGORY_LABELS,
  DESIGN_OPTIONS,
  TIER_LABELS,
  allowanceTotal,
  formatDelta,
  optionById,
  optionsForCategory,
  partnerCategoryForDesign,
  ROOM_CATEGORIES,
  ROOM_LABELS,
  type DesignRoom,
} from "@/lib/design-catalog";
import {
  affiliateDisclosureFor,
  partnersForCategory,
  shopUrl,
} from "@/lib/finish-partners";
import { loadJson, PERSIST_KEYS, saveJson } from "@/lib/local-persist";
import { planKindFromFile, savePlanFile } from "@/lib/plan-file-store";
import type { ContractModel } from "@/lib/pricing";
import { buildSwatchStyle } from "@/lib/design-materials";
import { cn, formatCurrency } from "@/lib/utils";

const WebGLWalkthrough = lazy(() =>
  import("@/components/design/webgl-walkthrough").then((m) => ({
    default: m.WebGLWalkthrough,
  })),
);

export const Route = createFileRoute("/app/design")({ component: DesignCenterPage });
