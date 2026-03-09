/**
 * Session ID generation utility.
 * Shared across all pages that need gateway session management.
 */
export function makeSessionId(prefix = "web-session") {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return `${prefix}-${window.crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 9)}`;
}
