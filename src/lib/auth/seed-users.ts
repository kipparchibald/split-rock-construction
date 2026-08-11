/**
 * Bootstrap internal operator accounts for Split Rock Construction.
 *
 * Runs once on server boot (PGLite preview + Neon when empty). Uses Better Auth
 * sign-up so passwords are hashed correctly — never insert raw password hashes.
 *
 * Credentials (ops only — rotate after first production deploy):
 *   Kipp Archibald  ·  kipp@splitrockconst.com  ·  SplitRock-Kipp-2026!
 *   Kyle            ·  kyle@splitrockconst.com  ·  SplitRock-Kyle-2026!
 */
import { auth } from "./server";
import { DEMO_OPERATORS } from "@/lib/demo-credentials";
import { OPERATOR_AUTH } from "@/lib/company";

export const SPLIT_ROCK_OPERATORS = [
  {
    name: DEMO_OPERATORS.kipp.name,
    email: DEMO_OPERATORS.kipp.email,
    password: DEMO_OPERATORS.kipp.password,
    role: OPERATOR_AUTH.kipp.role,
  },
  {
    name: DEMO_OPERATORS.kyle.name,
    email: DEMO_OPERATORS.kyle.email,
    password: DEMO_OPERATORS.kyle.password,
    role: OPERATOR_AUTH.kyle.role,
  },
] as const;

let seedPromise: Promise<void> | null = null;

export function ensureOperatorAccounts(): Promise<void> {
  seedPromise ??= (async () => {
    for (const op of SPLIT_ROCK_OPERATORS) {
      try {
        await auth.api.signUpEmail({
          body: {
            name: op.name,
            email: op.email,
            password: op.password,
          },
        });
        console.info(`[auth] seeded operator ${op.email}`);
      } catch (err) {
        // Already exists or transient — safe to ignore on every boot.
        const msg = err instanceof Error ? err.message : String(err);
        if (!/already|exists|unique/i.test(msg)) {
          console.warn(`[auth] seed ${op.email}:`, msg);
        }
      }
    }
  })().catch((err) => {
    seedPromise = null;
    console.error("[auth] operator seed failed:", err);
  });
  return seedPromise;
}

// Kick seed when the auth server module loads (same pattern as ensureDbReady).
void ensureOperatorAccounts();
