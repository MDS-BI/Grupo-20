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

const UNSAFE_SCHEME = /^(javascript|data|vbscript):/i;
const SCHEME = /^([a-z][a-z\d+.-]*):/i;
const SAFE_SCHEME = /^https?$/i;

function normalizedUrl(value) {
  return String(value === null || value === undefined ? '' : value)
    .trim()
    .replace(/[\u0000-\u001f\u007f]/g, '');
}

export function isSafeUrl(value) {
  const url = normalizedUrl(value);
  if (!url || UNSAFE_SCHEME.test(url)) return false;
  const scheme = url.match(SCHEME);
  return !scheme || SAFE_SCHEME.test(scheme[1]);
}

export function safeUrl(value) {
  const url = String(value === null || value === undefined ? '' : value).trim();
  if (!isSafeUrl(url)) return '';
  return escapeHtml(url);
}
