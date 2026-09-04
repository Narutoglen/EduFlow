import type { Course, Role, User } from "./types";

export type Permission =
  | "course:learn"
  | "course:create"
  | "course:edit"
  | "course:delete"
  | "course:approve"
  | "course:publish"
  | "course:moderate"
  | "assignment:submit"
  | "assignment:grade"
  | "quiz:take"
  | "analytics:view"
  | "users:manage"
  | "settings:manage"
  | "certificate:issue"
  | "certificate:verify";

const rolePermissions: Record<Role, readonly Permission[]> = {
  STUDENT: [
    "course:learn",
    "assignment:submit",
    "quiz:take",
    "certificate:verify",
  ],
  LECTURER: [
    "course:create",
    "course:edit",
    "course:moderate",
    "assignment:grade",
    "analytics:view",
    "certificate:issue",
    "certificate:verify",
  ],
  TA: [
    "course:moderate",
    "assignment:grade",
    "analytics:view",
    "certificate:verify",
  ],
  ADMIN: [
    "course:learn",
    "course:create",
    "course:edit",
    "course:delete",
    "course:approve",
    "course:publish",
    "course:moderate",
    "assignment:submit",
    "assignment:grade",
    "quiz:take",
    "analytics:view",
    "users:manage",
    "settings:manage",
    "certificate:issue",
    "certificate:verify",
  ],
};

export function getPermissionsForRole(role: Role): readonly Permission[] {
  return rolePermissions[role] ?? [];
}

export function hasPermission(role: Role, permission: Permission): boolean {
  const permissions = rolePermissions[role];
  if (!permissions) return false;
  return permissions.includes(permission);
}

export function canEditCourse(user: { id: string; role: Role }, course: { lecturerId: string }): boolean {
  if (user.role === "ADMIN") return true;
  return user.role === "LECTURER" && course.lecturerId === user.id;
}

export function canDeleteCourse(user: { id: string; role: Role }, course: { lecturerId: string }): boolean {
  if (user.role === "ADMIN") return true;
  return user.role === "LECTURER" && course.lecturerId === user.id;
}

export function canModerateCourse(
  user: { id: string; role: Role },
  course: { lecturerId: string; taIds?: string[] },
): boolean {
  if (user.role === "ADMIN") return true;
  if (user.role === "LECTURER") return course.lecturerId === user.id;
  if (user.role === "TA") return Boolean(course.taIds?.includes(user.id));
  return false;
}

export function canGradeCourse(
  user: { id: string; role: Role },
  course: { lecturerId: string; taIds?: string[] },
): boolean {
  if (user.role === "STUDENT") return false;
  return canModerateCourse(user, course);
}

export function canPublishCourse(user: { role: Role }): boolean {
  return user.role === "ADMIN";
}

export function canManageUsers(user: { role: Role }): boolean {
  return user.role === "ADMIN";
}
