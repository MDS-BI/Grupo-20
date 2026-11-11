import { describe, it, expect } from 'vitest';
import { escapeHtml } from '../../src/utils/sanitize.js';

describe('escapeHtml', () => {
  it('escapes the characters that can break out of HTML text and attributes', () => {
    expect(escapeHtml('<script>alert("x")</script>')).toBe(
      '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;'
    );
    expect(escapeHtml("Tom & Jerry's")).toBe('Tom &amp; Jerry&#39;s');
  });

  it('returns an empty string for null and undefined values', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
  });

  it('stringifies numbers and already safe text unchanged', () => {
    expect(escapeHtml(42)).toBe('42');
    expect(escapeHtml('texto seguro')).toBe('texto seguro');
  });
});
