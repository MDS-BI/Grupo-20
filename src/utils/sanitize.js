const HTML_ESCAPES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/**
 * Escapes HTML special characters so a string is safe to interpolate into
 * innerHTML without introducing markup or attribute/event injection.
 */
export function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

/**
 * Trims user-entered text and escapes it for safe DOM rendering.
 */
export function sanitizeText(value) {
  if (value === null || value === undefined) return '';
  return escapeHtml(String(value).trim());
}
