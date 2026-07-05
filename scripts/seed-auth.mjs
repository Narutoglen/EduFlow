// Seed demo accounts into the MySQL auth store (login / registration).
//
//   node --env-file=.env scripts/seed-auth.mjs
//
// Mirrors the demo users in prisma/seed.mjs so the same credentials work now
// that auth is served from MySQL instead of Postgres. Idempotent (upsert on
// email). Kept as a standalone mysql2 script because src/lib/auth-store.ts is
// server-only and can't be imported by a plain Node script.

import { randomBytes, scryptSync } from "node:crypto";
import mysql from "mysql2/promise";

const url = process.env.AUTH_DATABASE_URL ?? process.env.MYSQL_URL;
if (!url) {
  throw new Error(
    "AUTH_DATABASE_URL is not set. Run: node --env-file=.env scripts/seed-auth.mjs",
  );
}

// Same scheme as src/lib/password.ts: scrypt$<salt>$<hash>.
function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${derived}`;
}

const DEMO_USERS = [
  {
    id: "usr-student",
    email: "amina@student.eduflow.test",
    name: "Amina Otieno",
    role: "STUDENT",
    password: "Student123!",
    bio: "Data analyst building a stronger portfolio through applied learning.",
    avatarUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80",
    socialLinks: ["https://linkedin.com/in/amina"],
  },
  {
    id: "usr-lecturer",
    email: "mateo@lecturer.eduflow.test",
    name: "Dr. Mateo Ruiz",
    role: "LECTURER",
    password: "Lecturer123!",
    institution: "Nairobi Digital Institute",
    bio: "Learning designer and AI curriculum lead.",
    avatarUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80",
    socialLinks: ["https://example.com/mateo"],
  },
  {
    id: "usr-ta",
    email: "leah@ta.eduflow.test",
    name: "Leah Kamau",
    role: "TA",
    password: "Assistant123!",
    bio: "Teaching assistant focused on feedback loops and learner support.",
    avatarUrl:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=160&q=80",
    socialLinks: [],
  },
  {
    id: "usr-admin",
    email: "noah@admin.eduflow.test",
    name: "Noah Chen",
    role: "ADMIN",
    password: "Admin123!",
    bio: "Platform operator for course quality, analytics, and safety.",
    avatarUrl:
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=160&q=80",
    socialLinks: [],
  },
  {
    id: "usr-review",
    email: "priya@student.eduflow.test",
    name: "Priya Shah",
    role: "STUDENT",
    password: "Student123!",
    bio: "Product manager learning AI facilitation.",
    avatarUrl:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=160&q=80",
    socialLinks: [],
  },
];

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

async function main() {
  const parsed = new URL(url);
  const wantSsl =
    process.env.AUTH_DATABASE_SSL === "true" || /[?&]ssl-mode=required/i.test(url);

  const conn = await mysql.createConnection({
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 3306,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, ""),
    ...(wantSsl ? { ssl: { rejectUnauthorized: true } } : {}),
  });

  try {
    await conn.query(CREATE_USERS_TABLE);

    for (const user of DEMO_USERS) {
      await conn.execute(
        `INSERT INTO users
           (id, email, name, role, password_hash, email_verified_at, avatar_url, bio, institution, is_active, social_links)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CAST(? AS JSON))
         ON DUPLICATE KEY UPDATE
           name = VALUES(name),
           role = VALUES(role),
           password_hash = VALUES(password_hash),
           email_verified_at = VALUES(email_verified_at),
           avatar_url = VALUES(avatar_url),
           bio = VALUES(bio),
           institution = VALUES(institution),
           is_active = 1,
           social_links = VALUES(social_links)`,
        [
          user.id,
          user.email,
          user.name,
          user.role,
          hashPassword(user.password),
          new Date(),
          user.avatarUrl ?? null,
          user.bio ?? null,
          user.institution ?? null,
          JSON.stringify(user.socialLinks ?? []),
        ],
      );
    }

    const [rows] = await conn.query("SELECT COUNT(*) AS count FROM users");
    console.log(`Seeded ${DEMO_USERS.length} demo auth accounts (${rows[0].count} users total).`);
    console.log("Demo credentials:");
    for (const user of DEMO_USERS) {
      console.log(`  ${user.role.padEnd(8)} ${user.email}  /  ${user.password}`);
    }
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
