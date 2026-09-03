import { describe, expect, it } from "vitest";
import {
  escapeHtml,
  sanitizeAssignmentSubmission,
  sanitizeDiscussionPost,
  sanitizeGradingFeedback,
  sanitizePlainText,
  sanitizeRichText,
  stripHtml,
} from "./sanitization";

describe("Input Sanitization & Security Defenses", () => {
  describe("stripHtml", () => {
    it("returns empty string for null, undefined, or empty values", () => {
      expect(stripHtml(null)).toBe("");
      expect(stripHtml(undefined)).toBe("");
      expect(stripHtml("")).toBe("");
    });

    it("strips standard HTML formatting tags leaving clean text", () => {
      const input = "<p>Hello <strong>World</strong>! Here is a <a href='https://example.com'>link</a>.</p>";
      expect(stripHtml(input)).toBe("Hello World! Here is a link.");
    });

    it("strips executable <script> tags and all enclosed Javascript", () => {
      const input = "Legitimate text.<script>alert('XSS'); window.location='http://attacker.com';</script> More text.";
      expect(stripHtml(input)).toBe("Legitimate text. More text.");
    });

    it("strips nested, case-varied, and multiline script tags", () => {
      const input = "Prefix <SCRIpt type='text/javascript'>\n\n maliciousCode(); \n\n</script > Postfix";
      expect(stripHtml(input)).toBe("Prefix  Postfix");
    });

    it("strips <iframe>, <embed>, <object>, and <style> tags and their contents", () => {
      const input = "Content <iframe src='http://evil.com'></iframe><style>body { display: none; }</style> End.";
      expect(stripHtml(input)).toBe("Content  End.");
    });

    it("removes dangerous unicode and ASCII control characters", () => {
      // Null byte \u0000, backspace \u0008, bidi override \u202E
      const input = "Clean\u0000Text\u202EOverride";
      expect(stripHtml(input)).toBe("CleanTextOverride");
    });
  });

  describe("sanitizeRichText & sanitizeDiscussionPost", () => {
    it("strips inline event handlers (onerror, onload, onclick, onmouseover)", () => {
      const malicious = '<img src="valid.png" onerror="alert(document.cookie)" onload="doEvil()" />';
      const sanitized = sanitizeRichText(malicious);

      expect(sanitized).not.toContain("onerror");
      expect(sanitized).not.toContain("alert");
      expect(sanitized).not.toContain("onload");
    });

    it("strips javascript: pseudo-protocols in links", () => {
      const input = '<a href="javascript:alert(1)">Click here</a>';
      const sanitized = sanitizeRichText(input);

      expect(sanitized).not.toContain("javascript:");
    });

    it("strips vbscript: and data:text/html protocols", () => {
      const vb = '<a href="vbscript:msgbox(1)">VB</a>';
      const dataHtml = '<a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">Data</a>';

      expect(sanitizeRichText(vb)).not.toContain("vbscript:");
      expect(sanitizeRichText(dataHtml)).not.toContain("data:text/html");
    });

    it("normalizes CRLF line endings to LF", () => {
      const crlf = "Line 1\r\nLine 2\rLine 3";
      expect(sanitizeRichText(crlf)).toBe("Line 1\nLine 2\nLine 3");
    });

    it("enforces discussion post length limits", () => {
      const longPost = "A".repeat(6000);
      const sanitized = sanitizeDiscussionPost(longPost, 100);
      expect(sanitized).toHaveLength(100);
    });
  });

  describe("sanitizeAssignmentSubmission", () => {
    it("preserves legitimate source code blocks while stripping executable HTML tags", () => {
      const codeSubmission = [
        "# Python solution",
        "def solve(n):",
        "    return n * 2",
        "",
        "<script>stealTokens()</script>",
        "print(solve(5))",
      ].join("\n");

      const sanitized = sanitizeAssignmentSubmission(codeSubmission);
      expect(sanitized).toContain("def solve(n):");
      expect(sanitized).toContain("print(solve(5))");
      expect(sanitized).not.toContain("<script>");
      expect(sanitized).not.toContain("stealTokens()");
    });

    it("enforces submission length boundaries", () => {
      const hugeSubmission = "x".repeat(60000);
      const sanitized = sanitizeAssignmentSubmission(hugeSubmission, 50000);
      expect(sanitized).toHaveLength(50000);
    });
  });

  describe("sanitizeGradingFeedback & sanitizePlainText", () => {
    it("sanitizes grading feedback and caps length", () => {
      const feedback = "Great work on problem 2! <script>alert(1)</script>";
      const sanitized = sanitizeGradingFeedback(feedback);
      expect(sanitized).toBe("Great work on problem 2!");
    });

    it("strips all HTML and caps length for plain text fields", () => {
      const input = "<h1>Title</h1><p>Description</p>";
      expect(sanitizePlainText(input, 10)).toBe("TitleDescr");
    });
  });

  describe("escapeHtml", () => {
    it("escapes all five primary HTML entity characters", () => {
      const raw = `Tom & Jerry <script>"quotes" and 'single'</script>`;
      const escaped = escapeHtml(raw);

      expect(escaped).toBe("Tom &amp; Jerry &lt;script&gt;&quot;quotes&quot; and &#039;single&#039;&lt;/script&gt;");
    });

    it("preserves safe plain text untouched", () => {
      const text = "Normal sentence with numbers 12345.";
      expect(escapeHtml(text)).toBe(text);
    });
  });
});
