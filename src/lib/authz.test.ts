import { describe, expect, it } from "vitest";
import { canGrade } from "./grading-rules";

const course = { lecturerId: "usr-lecturer", assistantIds: ["usr-ta"] };

describe("canGrade (object-level authorization)", () => {
  it("lets an admin grade any course", () => {
    expect(canGrade({ id: "usr-admin", role: "ADMIN" }, course)).toBe(true);
  });

  it("lets a lecturer grade only their own course", () => {
    expect(canGrade({ id: "usr-lecturer", role: "LECTURER" }, course)).toBe(true);
    expect(canGrade({ id: "usr-other", role: "LECTURER" }, course)).toBe(false);
  });

  it("lets a TA grade only courses they assist", () => {
    expect(canGrade({ id: "usr-ta", role: "TA" }, course)).toBe(true);
    expect(canGrade({ id: "usr-ta-other", role: "TA" }, course)).toBe(false);
  });

  it("never lets a student grade", () => {
    expect(canGrade({ id: "usr-student", role: "STUDENT" }, course)).toBe(false);
    // Even if the student id somehow matches the lecturer field, role gates it.
    expect(canGrade({ id: "usr-lecturer", role: "STUDENT" }, course)).toBe(false);
  });
});
