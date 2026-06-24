// Pure authorization rule — no database, no server-only deps. authz.ts loads the
// course owner/assistants from the DB and delegates the decision to this so the
// rule itself stays unit-testable.
import type { Role } from "./types";

export type Principalish = { id: string; role: Role };

/**
 * Can this user grade work in a course, given the course's owner and assistants?
 *  - ADMIN: always
 *  - LECTURER: only their own course
 *  - TA: only courses they assist
 *  - STUDENT: never
 */
export function canGrade(
  user: Principalish,
  course: { lecturerId: string; assistantIds: string[] },
): boolean {
  if (user.role === "ADMIN") return true;
  if (user.role === "LECTURER") return course.lecturerId === user.id;
  if (user.role === "TA") return course.assistantIds.includes(user.id);
  return false;
}
