/**
 * Shared demo credentials for operator + client portal.
 * Only used when `isDemoDataEnabled` is true (default in sandbox).
 */
import { OPERATOR_AUTH } from "@/lib/company";

export const DEMO_OPERATORS = {
  kipp: {
    name: OPERATOR_AUTH.kipp.name,
    email: OPERATOR_AUTH.kipp.email,
    password: "SplitRock-Kipp-2026!",
  },
  kyle: {
    name: OPERATOR_AUTH.kyle.name,
    email: OPERATOR_AUTH.kyle.email,
    password: "SplitRock-Kyle-2026!",
  },
} as const;

export type DemoOperatorKey = keyof typeof DEMO_OPERATORS;

/** Demo portal clients (must match seed.ts portal tokens). */
export const DEMO_PORTAL_CLIENTS = [
  {
    id: "c1",
    name: "James & Elena Hart",
    email: "elena.hart@email.com",
    portalToken: "HART2026",
  },
  {
    id: "c2",
    name: "Marcus Cole",
    email: "marcus@colehomes.dev",
    portalToken: "COLE2026",
  },
  {
    id: "c3",
    name: "Priya & Noah Bennett",
    email: "noah.b@email.com",
    portalToken: "BENN2026",
  },
  {
    id: "c5",
    name: "Diane Okonkwo",
    email: "diane.o@email.com",
    portalToken: "DIAN2026",
  },
] as const;
