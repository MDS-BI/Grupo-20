import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { normalizeConfig } from '../../src/module-config.js';
import { addEntity, addDocument, loadEntities, loadDocuments } from '../../src/storage.js';

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

async function bootWith(configOverride){
  vi.resetModules();
  const { initApp } = await import('../../src/app.js');
  await initApp(normalizeConfig(configOverride));
}

function submitEntity(name, code){
  qs('nav-entities').click();
  qs('name').value = name;
  qs('code').value = code;
  qs('entity-form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
}

describe('Clarifications 2026-11-01', () => {
  it('rejects a duplicate code ignoring case and spaces', async () => {
    await bootWith(undefined);
    submitEntity('Acme', 'AC-001');
    expect(loadEntities().length).toBe(1);

    submitEntity('Other', ' ac-001 ');
    expect(loadEntities().length).toBe(1);
    expect(qs('error-code').textContent).toContain('único');
  });

  it('shows a visible warning and falls back to defaults for invalid configuration', async () => {
    await bootWith({ moduleName: '', theme: { accentColor: 'not-a-color' } });

    expect(qs('config-warning').hidden).toBe(false);
    expect(qs('config-warning').textContent).toContain('Configuración');
    expect(qs('brand-name').textContent).toBe('Módulo Base ERP');
    expect(document.documentElement.style.getPropertyValue('--accent')).toBe('#2563eb');
  });

  it('renders user-provided text as text without executing markup', async () => {
    await bootWith(undefined);
    addEntity({
      name: '<img src=x onerror="window.__xss = 1">',
      code: 'XSS-1',
      description: '<script>window.__xss = 2</script>'
    });

    qs('nav-search').click();
    qs('search-input').value = 'img';
    qs('search-input').dispatchEvent(new dom.window.Event('input', { bubbles: true }));

    const item = qs('search-results-list').querySelector('.entity-item');
    expect(item).not.toBeNull();
    expect(item.querySelector('img')).toBeNull();
    expect(item.querySelector('script')).toBeNull();
    expect(item.textContent).toContain('<img');
    expect(window.__xss).toBeUndefined();
  });

  it('asks for confirmation before deleting an entity and reports how many documents will be removed', async () => {
    await bootWith(undefined);
    const entity = addEntity({ name: 'Acme', code: 'AC-001' });
    addDocument({ entityId: entity.entity_id, folio: 1, startDate: '2026-08-01', endDate: '2026-08-02' });
    addDocument({ entityId: entity.entity_id, folio: 2, startDate: '2026-08-03', endDate: '2026-08-04' });

    qs('nav-entities').click();
    const select = qs('edit-entity');
    select.value = select.options[1].value;
    select.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    qs('delete-entity').click();

    expect(globalThis.confirm).toHaveBeenCalledTimes(1);
    expect(globalThis.confirm.mock.calls[0][0]).toContain('2 documento');
    expect(loadEntities().length).toBe(0);
    expect(loadDocuments().length).toBe(0);
  });
});
