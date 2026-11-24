import { describe, it, expect, beforeEach } from 'vitest';
import { initApp } from '../../src/app.js';

let app;

function mount() {
  document.body.innerHTML = '<div id="app"></div>';
  app = initApp(document.getElementById('app'), { rawConfig: {} });
  return app;
}

function createEntity(name, code) {
  app.navigate('manage-entity');
  document.getElementById('field-name').value = name;
  document.getElementById('field-code').value = code;
  document
    .getElementById('entity-form')
    .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}

function selectEntityForDocuments() {
  app.navigate('manage-document');
  const select = document.getElementById('document-entity-select');
  select.value = select.querySelector('option:not([value=""])').value;
  select.dispatchEvent(new Event('change', { bubbles: true }));
}

describe('CRUD de documentos en la pantalla de gestión (H4/H11)', () => {
  beforeEach(() => {
    mount();
  });

  it('crea, edita y elimina un documento asociado a la entidad seleccionada', () => {
    createEntity('Acme', 'AC-1');
    selectEntityForDocuments();
    document.getElementById('field-notes').value = 'Nota inicial';
    document
      .getElementById('document-form')
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(document.querySelector('.document-list .list-item-notes').textContent).toBe(
      'Nota inicial'
    );

    document.querySelector('[data-action="edit-document"]').click();
    document.getElementById('field-notes').value = 'Nota editada';
    document
      .getElementById('document-form')
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(document.querySelector('.document-list .list-item-notes').textContent).toBe(
      'Nota editada'
    );

    document.querySelector('[data-action="delete-document"]').click();
    expect(document.querySelector('.document-list')).toBeNull();
  });

  it('muestra retroalimentación cuando la fecha de término es anterior a la de inicio', () => {
    createEntity('Acme', 'AC-1');
    selectEntityForDocuments();
    document.getElementById('field-startDate').value = '2026-05-10';
    document.getElementById('field-endDate').value = '2026-05-01';
    document
      .getElementById('document-form')
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(document.querySelector('.field-error')).toBeTruthy();
  });
});
