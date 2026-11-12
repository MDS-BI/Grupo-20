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

function addDocumentWithStatus(status) {
  document.querySelector('[data-action="navigate"][data-view="manage-document"]').click();
  const select = document.getElementById('document-entity-select');
  select.value = select.querySelector('option:not([value=""])').value;
  select.dispatchEvent(new Event('change', { bubbles: true }));
  document.getElementById('field-status').value = status;
  document.getElementById('document-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}

describe('Resumen de Gestión Comercial (H6)', () => {
  beforeEach(() => {
    mount();
  });

  it('muestra un estado vacío con indicadores en cero cuando no hay registros', () => {
    document.querySelector('[data-action="navigate"][data-view="summary"]').click();
    const values = Array.from(document.querySelectorAll('.summary-cards .stat-value')).map((el) => el.textContent);
    expect(values).toEqual(['0', '0', '0']);
    expect(document.querySelector('.empty-state')).toBeTruthy();
  });

  it('los indicadores coinciden con los registros y se actualizan al completar un pendiente', () => {
    createEntity('Cliente Uno', 'CL-1');
    addDocumentWithStatus('pendiente');

    document.querySelector('[data-action="navigate"][data-view="summary"]').click();
    let values = Array.from(document.querySelectorAll('.summary-cards .stat-value')).map((el) => el.textContent);
    expect(values).toEqual(['1', '1', '1']);
    expect(document.querySelector('.pending-list').textContent).toContain('Cliente Uno');

    document.querySelector('[data-action="navigate"][data-view="manage-document"]').click();
    const select = document.getElementById('document-entity-select');
    select.value = select.querySelector('option:not([value=""])').value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    document.querySelector('[data-action="edit-document"]').click();
    document.getElementById('field-status').value = 'completado';
    document.getElementById('document-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    document.querySelector('[data-action="navigate"][data-view="summary"]').click();
    values = Array.from(document.querySelectorAll('.summary-cards .stat-value')).map((el) => el.textContent);
    expect(values).toEqual(['1', '1', '0']);
  });

  it('permite seleccionar una entidad pendiente desde el resumen para abrir su ficha', () => {
    createEntity('Cliente Uno', 'CL-1');
    addDocumentWithStatus('pendiente');
    document.querySelector('[data-action="navigate"][data-view="summary"]').click();
    document.querySelector('.pending-list [data-action="view-entity"]').click();
    expect(document.querySelector('.entity-detail-header h2').textContent).toBe('Cliente Uno');
  });
});
