import "server-only";

/**
 * Infrastructure-level database error codes. These mean the database is
 * unreachable, mis-provisioned, or not yet migrated — i.e. an environment
 * condition, not an application bug. Read-only public paths may safely degrade
 * to the seeded catalog when they see one of these instead of crashing the page.
 */
const DB_UNAVAILABLE_CODES = new Set([
  "ECONNREFUSED",
  "ENOTFOUND",
  "ETIMEDOUT",
  "ECONNRESET",
  "EAI_AGAIN",
  "EPIPE",
  "P1000",
  "P1001",
  "P1002",
  "P1008",
  "P1010",
  "P1011",
  "P1017",
  "P2021",
  "P2022",
]);

export function isDbUnavailable(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const { code, name } = error as { code?: unknown; name?: unknown };
  if (name === "PrismaClientInitializationError") return true;
  return typeof code === "string" && DB_UNAVAILABLE_CODES.has(code);
}

let warned = false;

export async function withDbFallback<T>(
  label: string,
  run: () => Promise<T>,
  fallback: () => T | Promise<T>,
): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (!isDbUnavailable(error)) throw error;
    if (!warned) {
      warned = true;
      console.warn(
        "[eduflow] Database unavailable — serving the seeded demo catalog. " +
          "Start Postgres and run `npm run prisma:push && npm run prisma:seed` for live data.",
      );
    }
    console.warn(`[eduflow] Falling back to seeded data for ${label}.`);
    return fallback();
  }
}
