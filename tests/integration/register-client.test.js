import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadEntities, loadDocuments, documentsForEntity } from '../../src/storage.js';
import { initApp } from '../../src/app.js';

const CONFIG = {
  customFields: {
    entity: [],
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

describe('User Story 2 - register clients and commercial contacts', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
    localStorage.clear();
    globalThis.confirm = vi.fn(() => true);
    initApp(document.getElementById('app'), { rawConfig: CONFIG });
  });

  it('registers an entity with an associated document and shows it in the entity profile', () => {
    navigate('manage-entity');
    qs('field-name').value = 'Acme';
    qs('field-code').value = 'AC-001';
    qs('entity-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    const entity = loadEntities()[0];
    expect(entity).toBeDefined();

    navigate('manage-document');
    qs('document-entity-select').value = entity.entity_id;
    qs('document-entity-select').dispatchEvent(new Event('change', { bubbles: true }));
    qs('field-series').value = 'FAC';
    qs('field-folio').value = '1001';
    qs('field-startDate').value = '2026-08-01';
    qs('field-endDate').value = '2026-08-05';
    qs('document-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    expect(loadDocuments().length).toBe(1);
    expect(documentsForEntity(entity.entity_id).length).toBe(1);
    expect(String(documentsForEntity(entity.entity_id)[0].folio)).toBe('1001');

    navigate('search');
    qs('search-input').value = 'acme';
    qs('search-input').dispatchEvent(new Event('input', { bubbles: true }));
    qs('search-results-list').querySelector('[data-action="view-entity"]').click();

    expect(qs('entity-detail').hidden).toBe(false);
    const history = [...qs('entity-history').querySelectorAll('.history-item')];
    expect(history.length).toBe(1);
    expect(history[0].textContent).toContain('FAC');
    expect(history[0].textContent).toContain('1001');
  });
});
