import { describe, it, expect, beforeEach } from 'vitest';
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

function addDocumentToSelectedEntity(notes, startDate) {
  document.querySelector('[data-action="navigate"][data-view="manage-document"]').click();
  const select = document.getElementById('document-entity-select');
  select.value = select.querySelector('option:not([value=""])').value;
  select.dispatchEvent(new Event('change', { bubbles: true }));
  document.getElementById('field-notes').value = notes;
  document.getElementById('field-startDate').value = startDate;
  document.getElementById('document-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}

describe('Ficha de entidad con historial ordenado (H3)', () => {
  beforeEach(() => {
    mount();
  });

  it('muestra los datos de la entidad y su historial ordenado por fecha', () => {
    createEntity('Cliente Uno', 'CL-1');
    addDocumentToSelectedEntity('Segunda interacción', '2026-03-01');
    addDocumentToSelectedEntity('Primera interacción', '2026-01-01');

    document.querySelector('[data-action="navigate"][data-view="search"]').click();
    document.querySelector('[data-action="view-entity"]').click();

    const notesInOrder = Array.from(document.querySelectorAll('.list-item-notes')).map((el) => el.textContent);
    expect(notesInOrder).toEqual(['Primera interacción', 'Segunda interacción']);
  });

  it('refleja las ediciones hechas en la pantalla de gestión', () => {
    createEntity('Cliente Uno', 'CL-1');
    document.querySelector('[data-action="navigate"][data-view="search"]').click();
    document.querySelector('[data-action="view-entity"]').click();
    expect(document.querySelector('.entity-detail-header h2').textContent).toBe('Cliente Uno');

    document.querySelector('[data-action="navigate"][data-view="search"]').click();
    document.querySelector('[data-action="edit-entity"]').click();
    document.getElementById('field-name').value = 'Cliente Uno Renombrado';
    document.getElementById('entity-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    document.querySelector('[data-action="navigate"][data-view="search"]').click();
    document.querySelector('[data-action="view-entity"]').click();
    expect(document.querySelector('.entity-detail-header h2').textContent).toBe('Cliente Uno Renombrado');
  });
});
