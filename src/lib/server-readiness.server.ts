/** Server-only env readiness — booleans only, never secret values. */

function envSet(key: string): boolean {
  const value = typeof process !== "undefined" ? process.env[key] : undefined;
  return Boolean(value?.trim());
}

export type ServerReadiness = {
  database: boolean;
  authSecret: boolean;
  authUrl: boolean;
  ingestSecret: boolean;
  ingestUserId: boolean;
  demoFlagExplicit: boolean;
  demoFlagValue: string | null;
};

export function getServerReadiness(): ServerReadiness {
  const demoRaw = process.env.VITE_SPLIT_ROCK_DEMO?.trim();
  return {
    database: envSet("DATABASE_URL"),
    authSecret: envSet("BETTER_AUTH_SECRET"),
    authUrl: envSet("BETTER_AUTH_URL"),
    ingestSecret: envSet("CRM_INGEST_SECRET"),
    ingestUserId: envSet("CRM_INGEST_USER_ID"),
    demoFlagExplicit: demoRaw !== undefined && demoRaw !== "",
    demoFlagValue: demoRaw ?? null,
  };
}

/** True when operator auth env looks complete (Kipp checklist). */
export function isAuthEnvReady(readiness: ServerReadiness = getServerReadiness()): boolean {
  return readiness.authSecret && readiness.authUrl && readiness.database;
}

/** True when external lead ingest can persist (secret + Postgres). */
export function isIngestEnvReady(readiness: ServerReadiness = getServerReadiness()): boolean {
  return readiness.ingestSecret && readiness.database;
}
