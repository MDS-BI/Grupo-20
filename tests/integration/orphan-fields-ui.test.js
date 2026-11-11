import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { normalizeConfig, setActiveConfig } from '../../src/module-config.js';
import { addEntity, loadEntities } from '../../src/storage.js';

const html = fs.readFileSync(fileURLToPath(new URL('../../index.html', import.meta.url)), 'utf8');

const regionField = { target: 'entity', key: 'region', label: 'Región', type: 'text' };
const configWithRegion = { customFields: [regionField] };

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

async function seedWithRegion(){
  vi.resetModules();
  const moduleConfig = await import('../../src/module-config.js');
  const storage = await import('../../src/storage.js');
  moduleConfig.setActiveConfig(configWithRegion);
  storage.addEntity({ name: 'Acme', code: 'AC-001', region: 'EMEA' });
}

async function bootWith(configOverride){
  vi.resetModules();
  const { initApp } = await import('../../src/app.js');
  await initApp(normalizeConfig(configOverride));
}

function searchFor(term){
  qs('nav-search').click();
  qs('search-input').value = term;
  qs('search-input').dispatchEvent(new dom.window.Event('input', { bubbles: true }));
}

describe('User Story 7 - orphan custom values', () => {
  it('hides undeclared values from the interface without deleting them', async () => {
    await seedWithRegion();
    await bootWith({ customFields: [] });

    qs('nav-entities').click();
    expect(qs('cf-region')).toBeNull();

    searchFor('acme');
    const item = qs('search-results-list').querySelector('.entity-item');
    expect(item).not.toBeNull();
    expect(item.textContent).not.toContain('Región');

    expect(loadEntities()[0].region).toBe('EMEA');
  });

  it('restores hidden values in the form and search once the field is declared again', async () => {
    await seedWithRegion();
    await bootWith(configWithRegion);

    qs('nav-entities').click();
    const select = qs('edit-entity');
    select.value = select.options[1].value;
    select.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    expect(qs('cf-region').value).toBe('EMEA');

    searchFor('emea');
    const item = qs('search-results-list').querySelector('.entity-item');
    expect(item).not.toBeNull();
    expect(item.textContent).toContain('Región: EMEA');
  });
});
