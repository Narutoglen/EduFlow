import { z } from "zod";

// Course difficulty levels — these mirror the Prisma `Difficulty` enum.
export const DIFFICULTIES = ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

/** Turn a free-text course title into a URL-safe slug. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics
    .replace(/[^a-z0-9]+/g, "-") // non-alphanumerics -> hyphen
    .replace(/-{2,}/g, "-") // collapse repeats
    .replace(/^-+|-+$/g, "") // trim leading/trailing hyphens
    .slice(0, 80)
    .replace(/-+$/g, ""); // re-trim if the slice landed on a hyphen
}

// Validation for the lecturer "create course" form. priceCents is the canonical
// stored unit; the form collects whole dollars and converts before validating.
export const CreateCourseSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(20).max(2000),
  categoryId: z.string().trim().min(1),
  difficulty: z.enum(DIFFICULTIES),
  priceCents: z.number().int().min(0).max(1_000_000),
});

export type CreateCourseInput = z.infer<typeof CreateCourseSchema>;

export type RawCourseForm = {
  title?: unknown;
  description?: unknown;
  categoryId?: unknown;
  difficulty?: unknown;
  price?: unknown;
};

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/** Convert a whole-dollar price string into integer cents (NaN when invalid). */
export function dollarsToCents(price: unknown): number {
  const trimmed = asString(price).trim();
  if (trimmed === "") return 0;
  const dollars = Number(trimmed);
  return Number.isFinite(dollars) ? Math.round(dollars * 100) : NaN;
}

/** Validate raw form values into a create-course input. */
export function parseCreateCourse(raw: RawCourseForm) {
  return CreateCourseSchema.safeParse({
    title: asString(raw.title),
    description: asString(raw.description),
    categoryId: asString(raw.categoryId),
    difficulty: raw.difficulty,
    priceCents: dollarsToCents(raw.price),
  });
}
