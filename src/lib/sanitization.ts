/**
 * Input sanitization and XSS prevention for user-generated content:
 * discussion forums, assignment submissions, feedback, and user profile fields.
 */

// Matches dangerous HTML tags and their attributes
const SCRIPT_TAG_REGEX = /<\s*script[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi;
const IFRAME_TAG_REGEX = /<\s*iframe[^>]*>[\s\S]*?<\s*\/\s*iframe\s*>/gi;
const OBJECT_TAG_REGEX = /<\s*(object|embed|applet)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi;
const FORM_TAG_REGEX = /<\s*form[^>]*>[\s\S]*?<\s*\/\s*form\s*>/gi;
const STYLE_TAG_REGEX = /<\s*style[^>]*>[\s\S]*?<\s*\/\s*style\s*>/gi;

// Matches inline event handlers (onerror, onload, onclick, etc.)
const INLINE_EVENT_REGEX = /\son\w+\s*=\s*(['"]).*?\1/gi;
const INLINE_EVENT_UNQUOTED_REGEX = /\son\w+\s*=\s*[^>\s]+/gi;

// Matches dangerous URL schemes
const JAVASCRIPT_URL_REGEX = /javascript\s*:[^"'>\s]*/gi;
const VBSCRIPT_URL_REGEX = /vbscript\s*:[^"'>\s]*/gi;
const DATA_HTML_URL_REGEX = /data\s*:\s*text\/html[^"'>\s]*/gi;

// Control characters (null byte, backspace, unicode bidi overrides)
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS_REGEX = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u202A-\u202E\u2066-\u2069]/g;

/**
 * Strips all HTML tags from an input string, returning clean plain text.
 */
export function stripHtml(input: unknown): string {
  if (input == null) return "";
  const str = String(input);
  return str
    .replace(SCRIPT_TAG_REGEX, "")
    .replace(IFRAME_TAG_REGEX, "")
    .replace(OBJECT_TAG_REGEX, "")
    .replace(STYLE_TAG_REGEX, "")
    .replace(/<[^>]*>/g, "")
    .replace(CONTROL_CHARS_REGEX, "")
    .trim();
}

/**
 * Sanitizes rich text / markdown input by stripping dangerous scripts, event handlers, and protocols.
 */
export function sanitizeRichText(input: unknown): string {
  if (input == null) return "";
  let str = String(input)
    .replace(SCRIPT_TAG_REGEX, "")
    .replace(IFRAME_TAG_REGEX, "")
    .replace(OBJECT_TAG_REGEX, "")
    .replace(FORM_TAG_REGEX, "")
    .replace(STYLE_TAG_REGEX, "")
    .replace(INLINE_EVENT_REGEX, "")
    .replace(INLINE_EVENT_UNQUOTED_REGEX, "")
    .replace(JAVASCRIPT_URL_REGEX, "")
    .replace(VBSCRIPT_URL_REGEX, "")
    .replace(DATA_HTML_URL_REGEX, "")
    .replace(CONTROL_CHARS_REGEX, "");

  // Normalize line endings
  str = str.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  return str.trim();
}

/**
 * Sanitizes plain text inputs with character limit enforcement.
 */
export function sanitizePlainText(input: unknown, maxLength = 5000): string {
  const stripped = stripHtml(input);
  return stripped.slice(0, maxLength);
}

/**
 * Sanitizes discussion forum post bodies.
 */
export function sanitizeDiscussionPost(body: unknown, maxLength = 5000): string {
  const sanitized = sanitizeRichText(body);
  return sanitized.slice(0, maxLength);
}

/**
 * Sanitizes student assignment submissions.
 */
export function sanitizeAssignmentSubmission(body: unknown, maxLength = 50000): string {
  const sanitized = sanitizeRichText(body);
  return sanitized.slice(0, maxLength);
}

/**
 * Sanitizes lecturer / TA grading feedback.
 */
export function sanitizeGradingFeedback(feedback: unknown, maxLength = 2000): string {
  const sanitized = sanitizeRichText(feedback);
  return sanitized.slice(0, maxLength);
}

/**
 * Escapes HTML entities for safe string interpolation in templates.
 */
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
