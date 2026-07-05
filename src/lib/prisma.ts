import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

// Prisma 7 uses driver adapters. The client is created lazily via a Proxy so that
// importing this module (which `next build` does for every page/route) never
// connects to — or even requires — a database. That keeps the build decoupled
// from the database at build time (Netlify/Vercel/CI), while a real connection is
// only attempted on the first actual query.
//
// When no DATABASE_URL/NETLIFY_DB_URL is configured we fall back to a local
// placeholder rather than throwing: the query then fails with a connection error
// that `withDbFallback` (src/lib/db-fallback.ts) catches and serves seeded data,
// so a preview deploy with no database still renders the demo instead of 500-ing.
const PLACEHOLDER_DB_URL = "postgresql://eduflow:eduflow@127.0.0.1:5432/eduflow";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function getPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;

  const connectionString =
    process.env.DATABASE_URL ?? process.env.NETLIFY_DB_URL ?? PLACEHOLDER_DB_URL;

  const client = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  globalForPrisma.prisma = client;
  return client;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getPrismaClient();
    const value = Reflect.get(client, property, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
