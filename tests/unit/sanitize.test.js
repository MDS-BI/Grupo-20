import { describe, it, expect } from 'vitest';
import { escapeHtml, sanitizeText } from '../../src/utils/sanitize.js';

describe('Saneamiento XSS (T111)', () => {
  it('escapa etiquetas HTML y comillas', () => {
    expect(escapeHtml('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(escapeHtml(`"'&`)).toBe('&quot;&#39;&amp;');
  });

  it('recorta y escapa texto de usuario', () => {
    expect(sanitizeText('  <img src=x onerror=alert(1)>  ')).toBe(
      '&lt;img src=x onerror=alert(1)&gt;',
    );
  });

  it('maneja valores nulos o indefinidos sin lanzar errores', () => {
    expect(escapeHtml(null)).toBe('');
    expect(sanitizeText(undefined)).toBe('');
  });
});
