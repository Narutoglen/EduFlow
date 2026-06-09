import { describe, expect, it } from "vitest";
import { courses, userForRole } from "./mock-data";
import {
  canEditCourse,
  canGradeCourse,
  canModerateCourse,
  hasPermission,
} from "./rbac";

describe("role permissions", () => {
  it("allows admins to manage users and approve courses", () => {
    expect(hasPermission("ADMIN", "users:manage")).toBe(true);
    expect(hasPermission("ADMIN", "course:approve")).toBe(true);
  });

  it("keeps teaching assistants from editing course content", () => {
    const ta = userForRole("TA");
    const course = courses[0];

    expect(canEditCourse(ta, course)).toBe(false);
    expect(canModerateCourse(ta, course)).toBe(true);
    expect(canGradeCourse(ta, course)).toBe(true);
  });

  it("lets lecturers edit only their own courses", () => {
    const lecturer = userForRole("LECTURER");

    expect(canEditCourse(lecturer, courses[0])).toBe(true);
    expect(canEditCourse(userForRole("STUDENT"), courses[0])).toBe(false);
  });
});
