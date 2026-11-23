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

describe('Alta de clientes con perfil CRM (T040)', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
    localStorage.clear();
    globalThis.confirm = vi.fn(() => true);
    initApp(document.getElementById('app'));
  });

  function openForm() {
    navigate('manage-entity');
  }

  function fillRequired({ name = 'Acme', rut = '11.111.111-1' } = {}) {
    qs('field-name').value = name;
    qs('field-targetDate').value = '1980-05-05';
    qs('field-rut').value = rut;
    qs('field-canal_contacto').value = 'llamada';
    qs('field-canal_contacto').dispatchEvent(new Event('change', { bubbles: true }));
    qs('field-contacto_telefono').value = '+56912345678';
  }

  function submit() {
    qs('entity-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  }

  it('exige fecha de nacimiento, RUT y canal de contacto', () => {
    openForm();
    qs('field-name').value = 'Acme';
    submit();

    expect(document.getElementById('error-targetDate').textContent).toContain('Fecha de nacimiento');
    expect(document.getElementById('error-rut').textContent).toContain('RUT');
    expect(document.getElementById('error-canal_contacto').textContent).toContain('Canal');
    expect(loadEntities()).toHaveLength(0);
  });

  it('genera un código único que no se muestra ni se puede editar', () => {
    openForm();
    expect(qs('field-code')).toBeNull();
    fillRequired();
    submit();

    const entity = loadEntities()[0];
    expect(entity).toBeDefined();
    expect(entity.code).toMatch(/^CLI-\d{3}$/);
    expect(document.body.textContent).not.toContain(entity.code);
  });

  it('rechaza un RUT duplicado aunque cambie de formato', () => {
    openForm();
    fillRequired();
    submit();
    expect(loadEntities()).toHaveLength(1);

    openForm();
    fillRequired({ name: 'Otra', rut: '11111111-1' });
    submit();

    expect(document.getElementById('error-rut').textContent).toMatch(/existe/i);
    expect(loadEntities()).toHaveLength(1);
  });
});
