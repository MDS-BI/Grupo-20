import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initApp } from '../../src/app.js';

function mount() {
  document.body.innerHTML = '<div id="app"></div>';
  return initApp(document.getElementById('app'));
}

function createEntity(name, code) {
  document.querySelector('[data-action="navigate"][data-view="manage-entity"]').click();
  document.getElementById('field-name').value = name;
  document.getElementById('field-code').value = code;
  document.getElementById('entity-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}

describe('Registrar, editar, eliminar y cascada de documentos (H11)', () => {
  beforeEach(() => {
    mount();
  });

  it('añade un documento y queda asociado a la entidad', () => {
    createEntity('Acme', 'AC-1');
    document.querySelector('[data-action="navigate"][data-view="manage-document"]').click();
    const select = document.getElementById('document-entity-select');
    select.value = select.querySelector('option:not([value=""])').value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    document.getElementById('field-notes').value = 'Detalle del documento';
    document.getElementById('document-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(document.querySelector('.document-list .list-item-notes').textContent).toBe('Detalle del documento');
  });

  it('elimina los documentos asociados cuando se elimina la entidad', () => {
    createEntity('Acme', 'AC-1');
    document.querySelector('[data-action="navigate"][data-view="manage-document"]').click();
    const select = document.getElementById('document-entity-select');
    select.value = select.querySelector('option:not([value=""])').value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    document.getElementById('document-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    vi.spyOn(window, 'confirm').mockReturnValue(true);
    document.querySelector('[data-action="navigate"][data-view="search"]').click();
    document.querySelector('[data-action="edit-entity"]').click();
    document.querySelector('[data-action="delete-entity"]').click();

    document.querySelector('[data-action="navigate"][data-view="manage-document"]').click();
    expect(document.getElementById('document-entity-select').querySelectorAll('option').length).toBe(1);
  });

  it('impide guardar un documento cuando falta información obligatoria y explica qué corregir', () => {
    createEntity('Acme', 'AC-1');
    document.querySelector('[data-action="navigate"][data-view="manage-document"]').click();
    const select = document.getElementById('document-entity-select');
    select.value = select.querySelector('option:not([value=""])').value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    document.getElementById('field-startDate').value = '2026-05-10';
    document.getElementById('field-endDate').value = '2026-01-01';
    document.getElementById('document-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(document.querySelector('.field-error').textContent).toBeTruthy();
  });
});
