import { describe, expect, it } from "vitest";
import { dollarsToCents, parseCreateCourse, slugify } from "./courses";

describe("slugify", () => {
  it("lowercases and hyphenates a title", () => {
    expect(slugify("Designing Inclusive Online Assessments")).toBe(
      "designing-inclusive-online-assessments",
    );
  });

  it("strips punctuation, diacritics, and collapses separators", () => {
    expect(slugify("  Café & Crème: Façade!!  ")).toBe("cafe-creme-facade");
  });

  it("never leaves leading or trailing hyphens", () => {
    expect(slugify("--Hello, World--")).toBe("hello-world");
  });
});

describe("dollarsToCents", () => {
  it("converts whole dollars to integer cents", () => {
    expect(dollarsToCents("79")).toBe(7900);
  });

  it("rounds fractional dollars to the nearest cent", () => {
    expect(dollarsToCents("9.99")).toBe(999);
  });

  it("treats empty input as free", () => {
    expect(dollarsToCents("")).toBe(0);
  });

  it("returns NaN for non-numeric input", () => {
    expect(Number.isNaN(dollarsToCents("free"))).toBe(true);
  });
});

describe("parseCreateCourse", () => {
  const valid = {
    title: "Intro to Responsible AI",
    description: "A practical course on using AI responsibly in the classroom.",
    categoryId: "cat-ai",
    difficulty: "BEGINNER",
    price: "0",
  };

  it("accepts a well-formed course", () => {
    const result = parseCreateCourse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.priceCents).toBe(0);
      expect(result.data.difficulty).toBe("BEGINNER");
    }
  });

  it("converts the dollar price into cents", () => {
    const result = parseCreateCourse({ ...valid, price: "79" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.priceCents).toBe(7900);
    }
  });

  it("rejects a too-short title", () => {
    expect(parseCreateCourse({ ...valid, title: "Hi" }).success).toBe(false);
  });

  it("rejects a too-short description", () => {
    expect(parseCreateCourse({ ...valid, description: "Too short" }).success).toBe(false);
  });

  it("rejects an unknown difficulty", () => {
    expect(parseCreateCourse({ ...valid, difficulty: "EXPERT" }).success).toBe(false);
  });

  it("rejects a missing category", () => {
    expect(parseCreateCourse({ ...valid, categoryId: "" }).success).toBe(false);
  });

  it("rejects a negative price", () => {
    expect(parseCreateCourse({ ...valid, price: "-5" }).success).toBe(false);
  });
});
