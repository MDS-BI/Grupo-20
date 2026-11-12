import { describe, it, expect, beforeEach, vi } from 'vitest';
import { addEntity, addDocument, updateEntity } from '../../src/storage.js';
import { initApp } from '../../src/app.js';

const CONFIG = {
  customFields: {
    entity: [{ key: 'taxId', label: 'Identificación fiscal', type: 'text' }],
    document: [
      { key: 'series', label: 'Serie', type: 'text' },
      { key: 'folio', label: 'Folio', type: 'number' },
    ],
  },
};

function qs(id) {
  return document.getElementById(id);
}

function navigate(view) {
  document.querySelector(`[data-action="navigate"][data-view="${view}"]`).click();
}

function searchAndOpen(term) {
  navigate('search');
  qs('search-input').value = term;
  qs('search-input').dispatchEvent(new Event('input', { bubbles: true }));
  const item = qs('search-results-list').querySelector('.entity-item');
  expect(item).not.toBeNull();
  item.querySelector('[data-action="view-entity"]').click();
}

describe('User Story 3 - consult entity history', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
    localStorage.clear();
    globalThis.confirm = vi.fn(() => true);
    initApp(document.getElementById('app'), { rawConfig: CONFIG });
  });

  it('opens the entity profile with its document history sorted by date', () => {
    const entity = addEntity({ name: 'Acme', code: 'AC-001', taxId: 'RFC800101AB1' });
    addDocument({ entity_id: entity.entity_id, series: 'FAC', folio: 1, startDate: '2026-08-01', endDate: '2026-08-02', status: 'quote' });
    addDocument({ entity_id: entity.entity_id, series: 'FAC', folio: 2, startDate: '2026-08-10', endDate: '2026-08-11', status: 'order' });

    searchAndOpen('acme');

    expect(qs('entity-detail').hidden).toBe(false);
    expect(qs('entity-detail-title').textContent).toContain('Acme');
    expect(qs('entity-detail-info').textContent).toContain('RFC800101AB1');

    const items = [...qs('entity-history').querySelectorAll('.history-item')];
    expect(items.length).toBe(2);
    expect(items[0].textContent).toContain('2026-08-01');
    expect(items[0].textContent).toContain('quote');
    expect(qs('entity-history-empty').hidden).toBe(true);
  });

  it('shows an empty history state for entities without documents', () => {
    addEntity({ name: 'Globex', code: 'GL-002' });
    searchAndOpen('globex');
    expect(qs('entity-history').querySelectorAll('.history-item').length).toBe(0);
    expect(qs('entity-history-empty').hidden).toBe(false);
  });

  it('reflects updates made in the management screen when the profile is reopened', () => {
    const entity = addEntity({ name: 'Acme', code: 'AC-001' });
    searchAndOpen('acme');
    expect(qs('entity-detail-title').textContent).toContain('Acme');

    updateEntity(entity.id, { name: 'Acme Renamed' });

    navigate('dashboard');
    searchAndOpen('acme');
    expect(qs('entity-detail-title').textContent).toContain('Acme Renamed');
  });
});
