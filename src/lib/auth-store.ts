import "server-only";

import { PrismaClient } from "@prisma/client";
import { isDbUnavailable } from "./db-fallback";
import { hashPassword } from "./password";
import { users as seedUsers } from "./mock-data";
import type { Role } from "./types";

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

const globalForAuthDb = globalThis as unknown as {
  prisma?: PrismaClient;
  authFallbackUsers?: Map<string, AuthUser>;
  authFallbackWarned?: boolean;
};

const FALLBACK_PASSWORDS: Record<string, string> = {
  "amina@student.eduflow.test": "Student123!",
  "mateo@lecturer.eduflow.test": "Lecturer123!",
  "leah@ta.eduflow.test": "Assistant123!",
  "noah@admin.eduflow.test": "Admin123!",
  "priya@student.eduflow.test": "Student123!",
};
const FALLBACK_SEED_DATE = new Date("2026-05-01T00:00:00Z");

function getPrisma(): PrismaClient {
  if (!globalForAuthDb.prisma) {
    globalForAuthDb.prisma = new PrismaClient();
  }
  return globalForAuthDb.prisma;
}

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
      "accounts. Start Postgres and run `npm run prisma:seed` for a persistent store.",
  );
}

async function withAuthFallback<T>(run: () => Promise<T>, fallback: () => T): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (!isDbUnavailable(error)) throw error;
    warnFallbackOnce();
    return fallback();
  }
}

function toAuthUser(row: {
  id: string;
  email: string;
  name: string;
  role: Role;
  passwordHash: string | null;
  emailVerifiedAt: Date | null;
  avatarUrl: string | null;
  bio: string | null;
  institution: string | null;
  isActive: boolean;
  socialLinks: string[];
  createdAt: Date;
}): AuthUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    passwordHash: row.passwordHash,
    emailVerifiedAt: row.emailVerifiedAt,
    avatarUrl: row.avatarUrl,
    bio: row.bio,
    institution: row.institution,
    isActive: row.isActive,
    socialLinks: row.socialLinks,
    createdAt: row.createdAt,
  };
}

export async function getUserByEmail(email: string): Promise<AuthUser | null> {
  return withAuthFallback(
    async () => {
      const user = await getPrisma().user.findUnique({ where: { email } });
      return user ? toAuthUser(user) : null;
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
      const user = await getPrisma().user.findUnique({ where: { id } });
      return user ? toAuthUser(user) : null;
    },
    () => fallbackStore().get(id) ?? null,
  );
}

export async function listUsers(): Promise<AuthUser[]> {
  return withAuthFallback(
    async () => {
      const rows = await getPrisma().user.findMany({
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          passwordHash: true,
          emailVerifiedAt: true,
          avatarUrl: true,
          bio: true,
          institution: true,
          isActive: true,
          socialLinks: true,
          createdAt: true,
        },
      });
      return rows.map(toAuthUser);
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

export class DuplicateEmailError extends Error {
  constructor() {
    super("A user with that email already exists.");
    this.name = "DuplicateEmailError";
  }
}

export async function createUser(input: NewUser): Promise<AuthUser> {
  return withAuthFallback(
    async () => {
      try {
        const created = await getPrisma().user.create({
          data: {
            email: input.email,
            name: input.name,
            role: input.role ?? "STUDENT",
            passwordHash: input.passwordHash,
            emailVerifiedAt: new Date(),
            isActive: true,
            socialLinks: [],
          },
        });
        return toAuthUser(created);
      } catch (error) {
        const code = typeof error === "object" && error !== null ? (error as { code?: string }).code : undefined;
        if (code === "P2002") throw new DuplicateEmailError();
        throw error;
      }
    },
    () => {
      const store = fallbackStore();
      for (const existing of store.values()) {
        if (existing.email === input.email) throw new DuplicateEmailError();
      }
      const id = `fallback-${Math.random().toString(36).slice(2, 10)}`;
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
    },
  );
}
