import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { addEntity, addDocument, updateEntity } from '../../src/storage.js';

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

function searchAndOpen(term){
  qs('nav-search').click();
  qs('search-input').value = term;
  qs('search-input').dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  const item = qs('search-results-list').querySelector('.entity-item');
  expect(item).not.toBeNull();
  item.click();
}

describe('User Story 3 - consult entity history', () => {
  it('opens the entity profile with its document history sorted by date', () => {
    const entity = addEntity({ name: 'Acme', code: 'AC-001', taxId: 'RFC800101AB1' });
    addDocument({ entityId: entity.entity_id, series: 'FAC', folio: 1, startDate: '2026-08-01', endDate: '2026-08-02', status: 'quote' });
    addDocument({ entityId: entity.entity_id, series: 'FAC', folio: 2, startDate: '2026-08-10', endDate: '2026-08-11', status: 'order' });

    searchAndOpen('acme');

    expect(qs('entity-detail').hidden).toBe(false);
    expect(qs('entity-detail-title').textContent).toContain('Acme');
    expect(qs('entity-detail-info').textContent).toContain('RFC800101AB1');

    const items = [...qs('entity-history').querySelectorAll('.history-item')];
    expect(items.length).toBe(2);
    expect(items[0].textContent).toContain('2026-08-10');
    expect(items[0].textContent).toContain('order');
    expect(qs('entity-history-empty').hidden).toBe(true);
  });

  it('shows an empty history state for entities without documents', () => {
    addEntity({ name: 'Globex', code: 'GL-002' });
    searchAndOpen('globex');
    expect(qs('entity-history').children.length).toBe(0);
    expect(qs('entity-history-empty').hidden).toBe(false);
  });

  it('reflects updates made in the management screen when the profile is reopened', () => {
    const entity = addEntity({ name: 'Acme', code: 'AC-001' });
    searchAndOpen('acme');
    expect(qs('entity-detail-title').textContent).toContain('Acme');

    updateEntity(entity.id, { name: 'Acme Renamed' });

    qs('nav-dashboard').click();
    searchAndOpen('acme');
    expect(qs('entity-detail-title').textContent).toContain('Acme Renamed');
  });
});
