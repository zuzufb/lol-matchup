import postgres from "postgres";

declare global {
  var __sql: postgres.Sql | undefined;
}

/** Shared Postgres connection, or null when DATABASE_URL is not configured. */
export function getSql(): postgres.Sql | null {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  // Reuse one pool across hot reloads and serverless invocations.
  globalThis.__sql ??= postgres(url, { max: 5, idle_timeout: 20, onnotice: () => {} });
  return globalThis.__sql;
}
