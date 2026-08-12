/** True when Neon/Postgres is configured — CRM rows persist server-side. */
export function isCrmServerPersistenceEnabled(): boolean {
  const url = typeof process !== "undefined" ? process.env.DATABASE_URL : undefined;
  return Boolean(url?.trim());
}
