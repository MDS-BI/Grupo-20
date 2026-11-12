import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { loadEntities, loadDocuments, documentsForEntity } from '../../src/storage.js';

const html = fs.readFileSync(fileURLToPath(new URL('../../index.html', import.meta.url)), 'utf8');

let dom;

function qs(id){ return document.getElementById(id); }

beforeEach(async () => {
  dom = new JSDOM(html, { url: 'http://localhost/' });
  const w = dom.window;
  globalThis.window = w;
  globalThis.document = w.document;
  globalThis.localStorage = w.localStorage;
  globalThis.alert = vi.fn();
  globalThis.confirm = vi.fn(() => true);
  w.scrollTo = vi.fn();
  w.localStorage.clear();
  vi.resetModules();
  const { boot } = await import('../../src/app.js');
  await boot();
});

afterEach(() => {
  dom.window.close();
});

describe('User Story 2 - register clients and commercial contacts', () => {
  it('registers an entity with an associated document and shows it in the entity profile', () => {
    qs('nav-entities').click();
    qs('name').value = 'Acme';
    qs('code').value = 'AC-001';
    qs('entity-form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
    const entity = loadEntities()[0];
    expect(entity).toBeDefined();

    qs('nav-documents').click();
    qs('document-entity').value = entity.entity_id;
    qs('series').value = 'FAC';
    qs('folio').value = '1001';
    qs('startDate').value = '2026-08-01';
    qs('endDate').value = '2026-08-05';
    qs('document-form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));

    expect(loadDocuments().length).toBe(1);
    expect(documentsForEntity(entity.entity_id).length).toBe(1);
    expect(documentsForEntity(entity.entity_id)[0].folio).toBe(1001);

    qs('nav-search').click();
    qs('search-input').value = 'acme';
    qs('search-input').dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    qs('search-results-list').querySelector('.entity-item').click();

    expect(qs('entity-detail').hidden).toBe(false);
    const history = [...qs('entity-history').querySelectorAll('.history-item')];
    expect(history.length).toBe(1);
    expect(history[0].textContent).toContain('FAC-1001');
  });
});
