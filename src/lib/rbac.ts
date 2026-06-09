import type { Course, Role, User } from "./types";

export type Permission =
  | "course:learn"
  | "course:create"
  | "course:edit"
  | "course:approve"
  | "course:moderate"
  | "assignment:grade"
  | "analytics:view"
  | "users:manage"
  | "settings:manage";

const rolePermissions: Record<Role, Permission[]> = {
  STUDENT: ["course:learn"],
  LECTURER: [
    "course:create",
    "course:edit",
    "course:moderate",
    "assignment:grade",
    "analytics:view",
  ],
  TA: ["course:moderate", "assignment:grade", "analytics:view"],
  ADMIN: [
    "course:create",
    "course:edit",
    "course:approve",
    "course:moderate",
    "assignment:grade",
    "analytics:view",
    "users:manage",
    "settings:manage",
  ],
};

export function hasPermission(role: Role, permission: Permission) {
  return rolePermissions[role].includes(permission);
}

export function canEditCourse(user: User, course: Course) {
  if (user.role === "ADMIN") return true;
  return user.role === "LECTURER" && course.lecturerId === user.id;
}

export function canModerateCourse(user: User, course: Course) {
  if (user.role === "ADMIN") return true;
  if (user.role === "LECTURER") return course.lecturerId === user.id;
  if (user.role === "TA") return course.taIds.includes(user.id);
  return false;
}

export function canGradeCourse(user: User, course: Course) {
  return canModerateCourse(user, course) && user.role !== "STUDENT";
}
