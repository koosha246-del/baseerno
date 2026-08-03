/**
 * Sanitization utilities — XSS prevention helpers.
 *
 * Used to safely render user-generated content (messages, comments)
 * that cannot be trusted as raw HTML.
 */

/**
 * Escape HTML special characters to prevent XSS injection.
 * Converts &, <, >, ", ' to their HTML entity equivalents.
 *
 * @example
 *   escapeHtml('<script>alert("xss")</script>')
 *   // → "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;"
 */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Strip HTML tags from a string, leaving only plain text.
 * Useful for search indexing and preview snippets.
 *
 * @example
 *   stripHtml("<p>Hello <b>world</b></p>")
 *   // → "Hello world"
 */
export function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, "");
}

/**
 * Truncate a string to a maximum length, appending ellipsis if truncated.
 * Preserves word boundaries when possible.
 *
 * @example
 *   truncateText("Hello world this is a long text", 15)
 *   // → "Hello world..."
 */
export function truncateText(s: string, maxLength: number): string {
  if (s.length <= maxLength) return s;
  const trimmed = s.slice(0, maxLength);
  const lastSpace = trimmed.lastIndexOf(" ");
  if (lastSpace > 0) {
    return s.slice(0, lastSpace) + "...";
  }
  return trimmed + "...";
}
