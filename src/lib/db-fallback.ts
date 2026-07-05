import "server-only";

/**
 * Infrastructure-level database error codes. These mean the database is
 * unreachable, mis-provisioned, or not yet migrated — i.e. an environment
 * condition, not an application bug. Read-only public paths may safely degrade
 * to the seeded catalog when they see one of these instead of crashing the page.
 */
const DB_UNAVAILABLE_CODES = new Set([
  // Node / pg driver socket-level failures
  "ECONNREFUSED",
  "ENOTFOUND",
  "ETIMEDOUT",
  "ECONNRESET",
  "EAI_AGAIN",
  "EPIPE",
  // Prisma engine connection errors
  "P1000", // authentication failed
  "P1001", // can't reach database server
  "P1002", // database reachable but timed out
  "P1008", // operation timed out
  "P1010", // user access denied
  "P1011", // TLS connection error
  "P1017", // server closed the connection
  // Database reachable but schema not provisioned (not migrated / seeded yet)
  "P2021", // table does not exist
  "P2022", // column does not exist
  // MySQL (mysql2) connection / provisioning failures — the auth store runs on
  // MySQL, so the same "unavailable, not a query bug" rule applies to it.
  "ER_ACCESS_DENIED_ERROR", // bad credentials
  "ER_DBACCESS_DENIED_ERROR", // no access to the database
  "ER_BAD_DB_ERROR", // database does not exist
  "PROTOCOL_CONNECTION_LOST",
  "PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR",
]);

/**
 * True when an error means the database is unavailable or not yet provisioned,
 * as opposed to a genuine application/query bug (which should still surface).
 */
export function isDbUnavailable(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const { code, name } = error as { code?: unknown; name?: unknown };
  if (name === "PrismaClientInitializationError") return true;
  return typeof code === "string" && DB_UNAVAILABLE_CODES.has(code);
}

let warned = false;

/**
 * Runs a database read, falling back to seeded data when the database is
 * unavailable. Genuine query errors are re-thrown so real bugs stay visible.
 */
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
