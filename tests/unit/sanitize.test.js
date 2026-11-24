import { describe, it, expect } from 'vitest';
import { escapeHtml, isSafeUrl, safeUrl, sanitizeText } from '../../src/utils/sanitize.js';

describe('Saneamiento XSS (T013/T127)', () => {
  it('escapa etiquetas HTML y comillas', () => {
    expect(escapeHtml('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(escapeHtml(`"'&`)).toBe('&quot;&#39;&amp;');
  });

  it('recorta y escapa texto de usuario', () => {
    expect(sanitizeText('  <img src=x onerror=alert(1)>  ')).toBe(
      '&lt;img src=x onerror=alert(1)&gt;'
    );
  });

  it('maneja valores nulos o indefinidos sin lanzar errores', () => {
    expect(escapeHtml(null)).toBe('');
    expect(sanitizeText(undefined)).toBe('');
  });

  it('rechaza esquemas peligrosos incluso con espacios o controladores', () => {
    for (const url of [
      'javascript:alert(1)',
      '  JaVaScRiPt:alert(1)',
      'java\nscript:alert(1)',
      'data:text/html,x',
      'vbscript:msgbox(1)',
    ]) {
      expect(isSafeUrl(url)).toBe(false);
      expect(safeUrl(url)).toBe('');
    }
  });

  it('permite URLs http, https y relativas escapando el resultado', () => {
    expect(isSafeUrl('https://ejemplo.cl/r?a=1&b=2')).toBe(true);
    expect(safeUrl('https://ejemplo.cl/r?a=1&b=2')).toBe('https://ejemplo.cl/r?a=1&amp;b=2');
    expect(safeUrl('http://ejemplo.cl')).toBe('http://ejemplo.cl');
    expect(safeUrl('/ficha/123')).toBe('/ficha/123');
    expect(safeUrl('./ficha?x=1"')).toBe('./ficha?x=1&quot;');
    expect(safeUrl('')).toBe('');
  });
});
