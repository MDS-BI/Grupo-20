import { describe, expect, it } from 'vitest';
import { NAV_ITEMS, renderShellHtml } from '../../src/components/shell.js';

describe('Navegación lateral', () => {
  it('mantiene cinco entradas con icono y etiqueta accesible', () => {
    expect(NAV_ITEMS.map((item) => item.key)).toEqual([
      'dashboard',
      'search',
      'summary',
      'marketing',
      'postventa',
    ]);
    const html = renderShellHtml({ moduleName: 'CRM Comercial', labels: {} }, 'dashboard', {
      authEnabled: false,
    });
    expect((html.match(/class="sidebar-button/g) || []).length).toBe(5);
    expect(html).toContain('aria-label="Panel"');
    expect(html).toContain('<svg');
  });

  it('filtra la navegación según el rango cuando se solicita', () => {
    const html = renderShellHtml({ moduleName: 'CRM Comercial', labels: {} }, 'dashboard', {
      authEnabled: true,
      role: 'visitor',
    });
    expect(html).not.toContain('class="sidebar-button');
  });
});
