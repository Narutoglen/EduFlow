import "server-only";
import { randomUUID } from "node:crypto";
import mysql from "mysql2/promise";
import { isDbUnavailable } from "./db-fallback";
import { hashPassword } from "./password";
import { users as seedUsers } from "./mock-data";
import type { Role } from "./types";

/**
 * MySQL-backed identity store for login / registration / sessions.
 *
 * This is deliberately decoupled from Prisma (which still serves the rest of the
 * app against Postgres) so production auth can run on a MySQL database today and
 * be swapped for Supabase Auth later without changing any call sites. The auth
 * flow only needs three operations: look up by email, look up by id, and create.
 *
 * Passwords are hashed by src/lib/password.ts (scrypt) before they reach here;
 * this module never sees a plaintext password.
 */

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  passwordHash: string | null;
  emailVerifiedAt: Date | null;
  avatarUrl: string | null;
  bio: string | null;
  institution: string | null;
  isActive: boolean;
  socialLinks: string[];
  createdAt: Date;
};

// Reuse the pool across HMR reloads / serverless warm invocations.
const globalForAuthDb = globalThis as unknown as {
  authDbPool?: mysql.Pool;
  authDbReady?: Promise<void>;
  authFallbackUsers?: Map<string, AuthUser>;
  authFallbackWarned?: boolean;
};

// --- Offline fallback ---------------------------------------------------------
// When MySQL is unreachable (e.g. a laptop demo with no database running), the
// auth store degrades to a seeded in-memory set of the demo accounts so login,
// registration, and the admin user list all keep working offline — the same
// graceful-degradation policy the public catalog uses (see db-fallback.ts).
// Genuine query bugs still surface; only infra/connection errors fall back.

const FALLBACK_PASSWORDS: Record<string, string> = {
  "amina@student.eduflow.test": "Student123!",
  "mateo@lecturer.eduflow.test": "Lecturer123!",
  "leah@ta.eduflow.test": "Assistant123!",
  "noah@admin.eduflow.test": "Admin123!",
  "priya@student.eduflow.test": "Student123!",
};
const FALLBACK_SEED_DATE = new Date("2026-05-01T00:00:00Z");

/** Seeded in-memory demo accounts, built once and shared across HMR reloads. */
function fallbackStore(): Map<string, AuthUser> {
  if (globalForAuthDb.authFallbackUsers) return globalForAuthDb.authFallbackUsers;
  const store = new Map<string, AuthUser>();
  for (const u of seedUsers) {
    const password = FALLBACK_PASSWORDS[u.email];
    store.set(u.id, {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      passwordHash: password ? hashPassword(password) : null,
      emailVerifiedAt: FALLBACK_SEED_DATE,
      avatarUrl: u.avatarUrl ?? null,
      bio: u.bio ?? null,
      institution: u.institution ?? null,
      isActive: u.isActive,
      socialLinks: u.socialLinks ?? [],
      createdAt: FALLBACK_SEED_DATE,
    });
  }
  globalForAuthDb.authFallbackUsers = store;
  return store;
}

function warnFallbackOnce(): void {
  if (globalForAuthDb.authFallbackWarned) return;
  globalForAuthDb.authFallbackWarned = true;
  console.warn(
    "[eduflow] Auth database unavailable — using the seeded in-memory demo " +
      "accounts. Start MySQL and run `npm run auth:seed` for a persistent store.",
  );
}

/** Run a MySQL-backed auth read, degrading to the seeded store when it's down. */
async function withAuthFallback<T>(run: () => Promise<T>, fallback: () => T): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (!isDbUnavailable(error)) throw error;
    warnFallbackOnce();
    return fallback();
  }
}

function getPool(): mysql.Pool {
  if (globalForAuthDb.authDbPool) return globalForAuthDb.authDbPool;

  const url = process.env.AUTH_DATABASE_URL ?? process.env.MYSQL_URL;
  if (!url) {
    throw new Error(
      "AUTH_DATABASE_URL is not set. Provide a MySQL connection string, e.g. " +
        "mysql://user:pass@host:3306/eduflow (see .env.example).",
    );
  }

  // Parse the URL ourselves so we can attach TLS/pool options reliably rather
  // than depending on driver-specific URI option handling.
  const parsed = new URL(url);
  // Managed MySQL (PlanetScale, RDS, Azure, …) generally require TLS.
  const wantSsl =
    process.env.AUTH_DATABASE_SSL === "true" || /[?&]ssl-mode=required/i.test(url);

  const pool = mysql.createPool({
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 3306,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, ""),
    waitForConnections: true,
    connectionLimit: Number(process.env.AUTH_DATABASE_POOL ?? 5),
    enableKeepAlive: true,
    ...(wantSsl ? { ssl: { rejectUnauthorized: true } } : {}),
  });

  globalForAuthDb.authDbPool = pool;
  return pool;
}

const CREATE_USERS_TABLE = `
  CREATE TABLE IF NOT EXISTS users (
    id                VARCHAR(36)   NOT NULL,
    email             VARCHAR(320)  NOT NULL,
    name              VARCHAR(255)  NOT NULL,
    role              ENUM('STUDENT','LECTURER','TA','ADMIN') NOT NULL DEFAULT 'STUDENT',
    password_hash     VARCHAR(255)  NULL,
    email_verified_at DATETIME      NULL,
    avatar_url        VARCHAR(1024) NULL,
    bio               TEXT          NULL,
    institution       VARCHAR(255)  NULL,
    is_active         TINYINT(1)    NOT NULL DEFAULT 1,
    social_links      JSON          NULL,
    created_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY users_email_key (email)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

/** Create the users table on first use so a fresh MySQL deploy is turnkey. */
async function ensureSchema(): Promise<void> {
  if (!globalForAuthDb.authDbReady) {
    globalForAuthDb.authDbReady = getPool()
      .query(CREATE_USERS_TABLE)
      .then(() => undefined)
      .catch((error) => {
        // Let a later call retry if provisioning failed transiently.
        globalForAuthDb.authDbReady = undefined;
        throw error;
      });
  }
  return globalForAuthDb.authDbReady;
}

type UserRow = {
  id: string;
  email: string;
  name: string;
  role: Role;
  password_hash: string | null;
  email_verified_at: Date | null;
  avatar_url: string | null;
  bio: string | null;
  institution: string | null;
  is_active: number;
  social_links: unknown;
  created_at: Date;
};

const SELECT_COLUMNS =
  "id, email, name, role, password_hash, email_verified_at, avatar_url, bio, institution, is_active, social_links, created_at";

// mysql2 returns JSON columns already parsed on most versions, but fall back to
// parsing a raw string just in case.
function normalizeLinks(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string");
  if (typeof value === "string" && value.length > 0) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
    } catch {
      return [];
    }
  }
  return [];
}

function toAuthUser(row: UserRow): AuthUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    passwordHash: row.password_hash,
    emailVerifiedAt: row.email_verified_at,
    avatarUrl: row.avatar_url,
    bio: row.bio,
    institution: row.institution,
    isActive: Boolean(row.is_active),
    socialLinks: normalizeLinks(row.social_links),
    createdAt: row.created_at,
  };
}

export async function getUserByEmail(email: string): Promise<AuthUser | null> {
  return withAuthFallback(
    async () => {
      await ensureSchema();
      const [rows] = await getPool().execute(
        `SELECT ${SELECT_COLUMNS} FROM users WHERE email = ? LIMIT 1`,
        [email],
      );
      const row = (rows as UserRow[])[0];
      return row ? toAuthUser(row) : null;
    },
    () => {
      for (const user of fallbackStore().values()) {
        if (user.email === email) return user;
      }
      return null;
    },
  );
}

export async function getUserById(id: string): Promise<AuthUser | null> {
  return withAuthFallback(
    async () => {
      await ensureSchema();
      const [rows] = await getPool().execute(
        `SELECT ${SELECT_COLUMNS} FROM users WHERE id = ? LIMIT 1`,
        [id],
      );
      const row = (rows as UserRow[])[0];
      return row ? toAuthUser(row) : null;
    },
    () => fallbackStore().get(id) ?? null,
  );
}

/** All accounts, oldest first — used by the admin user-management table. */
export async function listUsers(): Promise<AuthUser[]> {
  return withAuthFallback(
    async () => {
      await ensureSchema();
      const [rows] = await getPool().query(
        `SELECT ${SELECT_COLUMNS} FROM users ORDER BY created_at ASC`,
      );
      return (rows as UserRow[]).map(toAuthUser);
    },
    () =>
      [...fallbackStore().values()].sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
      ),
  );
}

export type NewUser = {
  name: string;
  email: string;
  passwordHash: string;
  role?: Role;
};

/** Thrown when the email already exists, so callers can show a friendly message. */
export class DuplicateEmailError extends Error {
  constructor() {
    super("A user with that email already exists.");
    this.name = "DuplicateEmailError";
  }
}

export async function createUser(input: NewUser): Promise<AuthUser> {
  const id = randomUUID();
  try {
    await ensureSchema();
    await getPool().execute(
      `INSERT INTO users
         (id, email, name, role, password_hash, email_verified_at, is_active, social_links)
       VALUES (?, ?, ?, ?, ?, ?, 1, CAST(? AS JSON))`,
      [id, input.email, input.name, input.role ?? "STUDENT", input.passwordHash, new Date(), "[]"],
    );
  } catch (error) {
    if (isDuplicateKeyError(error)) throw new DuplicateEmailError();
    // Offline demo: register into the seeded in-memory store so the new account
    // can sign in for the rest of the session (it resets on restart).
    if (isDbUnavailable(error)) {
      warnFallbackOnce();
      return createUserInFallback(id, input);
    }
    throw error;
  }
  const created = await getUserById(id);
  if (!created) throw new Error("createUser: user missing immediately after insert");
  return created;
}

/** Register a new user into the in-memory store when MySQL is unavailable. */
function createUserInFallback(id: string, input: NewUser): AuthUser {
  const store = fallbackStore();
  for (const existing of store.values()) {
    if (existing.email === input.email) throw new DuplicateEmailError();
  }
  const user: AuthUser = {
    id,
    name: input.name,
    email: input.email,
    role: input.role ?? "STUDENT",
    passwordHash: input.passwordHash,
    emailVerifiedAt: new Date(),
    avatarUrl: null,
    bio: null,
    institution: null,
    isActive: true,
    socialLinks: [],
    createdAt: new Date(),
  };
  store.set(id, user);
  return user;
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: string }).code === "ER_DUP_ENTRY"
  );
}
