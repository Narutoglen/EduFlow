import { randomBytes, scryptSync } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Run with: node --env-file=.env prisma/seed.mjs",
  );
}
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

function hashPassword(password: string) {
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

async function main() {
  for (const user of DEMO_USERS) {
    const { password, ...fields } = user;
    const passwordHash = hashPassword(password);
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: fields.name,
        role: fields.role,
        passwordHash,
        emailVerifiedAt: new Date(),
        avatarUrl: fields.avatarUrl,
        bio: fields.bio,
        institution: fields.institution ?? null,
        socialLinks: fields.socialLinks,
        isActive: true,
      },
      create: {
        id: fields.id,
        email: fields.email,
        name: fields.name,
        role: fields.role,
        passwordHash,
        emailVerifiedAt: new Date(),
        avatarUrl: fields.avatarUrl,
        bio: fields.bio,
        institution: fields.institution ?? null,
        socialLinks: fields.socialLinks,
        isActive: true,
      },
    });
  }

  const count = await prisma.user.count();
  console.log(`Seeded ${DEMO_USERS.length} demo auth accounts (${count} users total).`);
  console.log("Demo credentials:");
  for (const user of DEMO_USERS) {
    console.log(`  ${user.role.padEnd(8)} ${user.email}  /  ${user.password}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
