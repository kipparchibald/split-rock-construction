import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import { BuildJourneyRail } from "@/components/build-journey-rail";
import { Logo } from "@/components/brand/logo";
import { MarketingFooter } from "@/components/layout/marketing-footer";
import { Button } from "@/components/ui/button";
import {
  HOLWEGE_CONTRACT,
  HOLWEGE_COST_OF_WORK,
  HOLWEGE_OWNER_CONTINGENCY,
  HOLWEGE_PO,
  HOLWEGE_SIGNING_DEPOSIT,
} from "@/data/holwege-money";
import { DEFAULT_RESIDENTIAL_PHASES } from "@/lib/build-journey";
import { COMPANY } from "@/lib/company";
import { cn, formatCurrencyExact } from "@/lib/utils";

export const Route = createFileRoute("/work/holwege")({
  head: () => ({
    meta: [
      {
        title:
          "Holwege Residence · Lot 16, Teton Heights | Split Rock Construction",
      },
      {
        name: "description",
        content:
          "One-level ADA-forward custom home on crawl, Rigby / Jefferson County — land + build under one team. Transparent cost-plus construction with owner portal.",
      },
      {
        property: "og:title",
        content: "Holwege Residence · Lot 16 | Split Rock Construction",
      },
      {
        property: "og:description",
        content:
          "Custom one-level on Lot 16, Teton Heights — designed for how you live. Target window Sep 30, 2026 – May 30, 2027.",
      },
      { property: "og:image", content: "/site-photos/aerial-1.jpg" },
    ],
  }),
  component: HolwegeCaseStudyPage,
});
