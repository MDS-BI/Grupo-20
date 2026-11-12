import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { normalizeConfig } from '../../src/module-config.js';

const html = fs.readFileSync(fileURLToPath(new URL('../../index.html', import.meta.url)), 'utf8');

let dom;

function qs(id){ return document.getElementById(id); }

beforeEach(() => {
  dom = new JSDOM(html, { url: 'http://localhost/' });
  const w = dom.window;
  globalThis.window = w;
  globalThis.document = w.document;
  globalThis.localStorage = w.localStorage;
  globalThis.alert = vi.fn();
  globalThis.confirm = vi.fn(() => true);
  w.scrollTo = vi.fn();
  w.localStorage.clear();
});

afterEach(() => {
  dom.window.close();
});

describe('User Story 5 - invalid configuration fallback', () => {
  it('starts with defaults and shows a visible warning when configuration is invalid', async () => {
    vi.resetModules();
    const { initApp } = await import('../../src/app.js');
    await initApp(normalizeConfig({
      moduleName: '',
      customFields: [{ target: 'entity', key: 'x', label: 'X', type: 'unknown' }],
      statusLifecycle: { statuses: ['a'], transitions: { a: ['ghost'] } },
      theme: { accentColor: 'not-a-color' }
    }));

    expect(qs('config-warning').hidden).toBe(false);
    expect(qs('config-warning').textContent).toContain('Configuración');
    expect(qs('brand-name').textContent).toBe('Módulo Base ERP');
    expect(document.documentElement.style.getPropertyValue('--accent')).toBe('#2563eb');
    expect(qs('nav-entities-label').textContent).toBe('Entidades');
    expect(qs('nav-documents-label').textContent).toBe('Documentos');
  });

  it('does not show the warning for a valid configuration', async () => {
    vi.resetModules();
    const { initApp } = await import('../../src/app.js');
    await initApp(normalizeConfig({ moduleName: 'Ventas' }));
    expect(qs('config-warning').hidden).toBe(true);
    expect(qs('brand-name').textContent).toBe('Ventas');
  });
});
