import { describe, it, expect, beforeEach } from 'vitest';
import { normalizeConfig } from '../../src/module-config.js';
import { initApp } from '../../src/app.js';

function qs(id) {
  return document.getElementById(id);
}

function mount(config) {
  document.body.innerHTML = '<div id="app"></div>';
  return initApp(document.getElementById('app'), normalizeConfig(config));
}

describe('User Story 5 - invalid configuration fallback', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
  });

  it('starts with defaults and shows a visible warning when configuration is invalid', () => {
    mount({
      moduleName: '',
      customFields: [{ target: 'entity', key: 'x', label: 'X', type: 'unknown' }],
      statusLifecycle: { statuses: ['a'], transitions: { a: ['ghost'] } },
      theme: { accentColor: 'not-a-color' },
    });

    expect(qs('config-warning').hidden).toBe(false);
    expect(qs('config-warning').textContent).toContain('Configuración');
    expect(qs('brand-name').textContent).toBe('Módulo Base ERP');
    expect(document.documentElement.style.getPropertyValue('--accent')).toBe('#2563eb');
    expect(qs('nav-entities-label').textContent).toBe('Entidades');
    expect(qs('nav-documents-label').textContent).toBe('Documentos');
  });

  it('does not show the warning for a valid configuration', () => {
    mount({ moduleName: 'Ventas' });
    expect(qs('config-warning').hidden).toBe(true);
    expect(qs('brand-name').textContent).toBe('Ventas');
  });
});
