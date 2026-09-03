import { describe, expect, it } from "vitest";
import {
  canDeleteCourse,
  canEditCourse,
  canGradeCourse,
  canManageUsers,
  canModerateCourse,
  canPublishCourse,
  getPermissionsForRole,
  hasPermission,
  type Permission,
} from "./rbac";
import { canGrade } from "./grading-rules";
import type { Role, User } from "./types";

describe("Role-Based Access Control (RBAC) & Authorization Matrix", () => {
  describe("Permission Matrix (hasPermission & getPermissionsForRole)", () => {
    it("assigns only learner-appropriate permissions to STUDENT", () => {
      const perms = getPermissionsForRole("STUDENT");
      expect(perms).toContain("course:learn");
      expect(perms).toContain("assignment:submit");
      expect(perms).toContain("quiz:take");
      expect(perms).toContain("certificate:verify");

      // Critical safety boundaries
      expect(hasPermission("STUDENT", "course:create")).toBe(false);
      expect(hasPermission("STUDENT", "course:edit")).toBe(false);
      expect(hasPermission("STUDENT", "course:delete")).toBe(false);
      expect(hasPermission("STUDENT", "course:publish")).toBe(false);
      expect(hasPermission("STUDENT", "assignment:grade")).toBe(false);
      expect(hasPermission("STUDENT", "users:manage")).toBe(false);
      expect(hasPermission("STUDENT", "settings:manage")).toBe(false);
    });

    it("assigns teaching and course creation permissions to LECTURER", () => {
      const perms = getPermissionsForRole("LECTURER");
      expect(perms).toContain("course:create");
      expect(perms).toContain("course:edit");
      expect(perms).toContain("course:moderate");
      expect(perms).toContain("assignment:grade");
      expect(perms).toContain("analytics:view");
      expect(perms).toContain("certificate:issue");

      // Lecturers cannot perform admin platform governance
      expect(hasPermission("LECTURER", "course:publish")).toBe(false);
      expect(hasPermission("LECTURER", "users:manage")).toBe(false);
      expect(hasPermission("LECTURER", "settings:manage")).toBe(false);
    });

    it("assigns grading and moderation permissions to TA without course creation", () => {
      const perms = getPermissionsForRole("TA");
      expect(perms).toContain("course:moderate");
      expect(perms).toContain("assignment:grade");
      expect(perms).toContain("analytics:view");

      // TAs cannot create or edit course structures
      expect(hasPermission("TA", "course:create")).toBe(false);
      expect(hasPermission("TA", "course:edit")).toBe(false);
      expect(hasPermission("TA", "course:delete")).toBe(false);
      expect(hasPermission("TA", "users:manage")).toBe(false);
    });

    it("assigns full administrative permissions to ADMIN", () => {
      const allPermissions: Permission[] = [
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
      ];

      for (const permission of allPermissions) {
        expect(hasPermission("ADMIN", permission)).toBe(true);
      }
    });

    it("returns empty permissions for unknown roles", () => {
      expect(getPermissionsForRole("UNKNOWN" as Role)).toEqual([]);
      expect(hasPermission("UNKNOWN" as Role, "course:learn")).toBe(false);
    });
  });

  describe("Course Content Ownership & Authorization (canEditCourse, canDeleteCourse)", () => {
    const ownerLecturer = { id: "lecturer-alice", role: "LECTURER" as Role };
    const otherLecturer = { id: "lecturer-bob", role: "LECTURER" as Role };
    const adminUser = { id: "admin-root", role: "ADMIN" as Role };
    const studentUser = { id: "student-charlie", role: "STUDENT" as Role };
    const taUser = { id: "ta-dave", role: "TA" as Role };

    const course = { lecturerId: "lecturer-alice" };

    it("allows course owner to edit their course", () => {
      expect(canEditCourse(ownerLecturer, course)).toBe(true);
    });

    it("prevents non-owner lecturer from editing another lecturer's course", () => {
      expect(canEditCourse(otherLecturer, course)).toBe(false);
    });

    it("prevents students and TAs from editing course content", () => {
      expect(canEditCourse(studentUser, course)).toBe(false);
      expect(canEditCourse(taUser, course)).toBe(false);
    });

    it("allows administrators to edit any course", () => {
      expect(canEditCourse(adminUser, course)).toBe(true);
    });

    it("enforces delete course permissions", () => {
      expect(canDeleteCourse(ownerLecturer, course)).toBe(true);
      expect(canDeleteCourse(otherLecturer, course)).toBe(false);
      expect(canDeleteCourse(studentUser, course)).toBe(false);
      expect(canDeleteCourse(adminUser, course)).toBe(true);
    });
  });

  describe("Course Moderation & Teaching Assistant Scope (canModerateCourse)", () => {
    const course = { lecturerId: "lecturer-1", taIds: ["ta-assigned-1", "ta-assigned-2"] };

    it("allows owner lecturer to moderate course discussions", () => {
      expect(canModerateCourse({ id: "lecturer-1", role: "LECTURER" }, course)).toBe(true);
      expect(canModerateCourse({ id: "lecturer-other", role: "LECTURER" }, course)).toBe(false);
    });

    it("allows assigned TAs to moderate course discussions", () => {
      expect(canModerateCourse({ id: "ta-assigned-1", role: "TA" }, course)).toBe(true);
      expect(canModerateCourse({ id: "ta-assigned-2", role: "TA" }, course)).toBe(true);
    });

    it("rejects unassigned TAs from moderating course discussions", () => {
      expect(canModerateCourse({ id: "ta-unassigned", role: "TA" }, course)).toBe(false);
    });

    it("rejects students from moderating course discussions", () => {
      expect(canModerateCourse({ id: "student-1", role: "STUDENT" }, course)).toBe(false);
    });

    it("allows admins to moderate any course", () => {
      expect(canModerateCourse({ id: "admin-1", role: "ADMIN" }, course)).toBe(true);
    });
  });

  describe("Grading Rules (canGradeCourse & canGrade)", () => {
    const course = { lecturerId: "lecturer-owner", assistantIds: ["ta-assistant"], taIds: ["ta-assistant"] };

    it("authorizes owner lecturer to grade submissions", () => {
      expect(canGrade({ id: "lecturer-owner", role: "LECTURER" }, course)).toBe(true);
      expect(canGradeCourse({ id: "lecturer-owner", role: "LECTURER" }, course)).toBe(true);
    });

    it("rejects unauthorized lecturers from grading other courses", () => {
      expect(canGrade({ id: "lecturer-unrelated", role: "LECTURER" }, course)).toBe(false);
      expect(canGradeCourse({ id: "lecturer-unrelated", role: "LECTURER" }, course)).toBe(false);
    });

    it("authorizes assigned TA to grade submissions", () => {
      expect(canGrade({ id: "ta-assistant", role: "TA" }, course)).toBe(true);
      expect(canGradeCourse({ id: "ta-assistant", role: "TA" }, course)).toBe(true);
    });

    it("rejects unassigned TA from grading submissions", () => {
      expect(canGrade({ id: "ta-other", role: "TA" }, course)).toBe(false);
      expect(canGradeCourse({ id: "ta-other", role: "TA" }, course)).toBe(false);
    });

    it("strictly forbids students from grading (anti-privilege escalation)", () => {
      expect(canGrade({ id: "student-1", role: "STUDENT" }, course)).toBe(false);
      expect(canGradeCourse({ id: "student-1", role: "STUDENT" }, course)).toBe(false);
    });

    it("authorizes administrators to grade any course", () => {
      expect(canGrade({ id: "admin-1", role: "ADMIN" }, course)).toBe(true);
      expect(canGradeCourse({ id: "admin-1", role: "ADMIN" }, course)).toBe(true);
    });
  });

  describe("Platform Administrative Controls (canPublishCourse, canManageUsers)", () => {
    it("allows only ADMIN to publish courses", () => {
      expect(canPublishCourse({ role: "ADMIN" })).toBe(true);
      expect(canPublishCourse({ role: "LECTURER" })).toBe(false);
      expect(canPublishCourse({ role: "TA" })).toBe(false);
      expect(canPublishCourse({ role: "STUDENT" })).toBe(false);
    });

    it("allows only ADMIN to manage user accounts", () => {
      expect(canManageUsers({ role: "ADMIN" })).toBe(true);
      expect(canManageUsers({ role: "LECTURER" })).toBe(false);
      expect(canManageUsers({ role: "TA" })).toBe(false);
      expect(canManageUsers({ role: "STUDENT" })).toBe(false);
    });
  });
});
