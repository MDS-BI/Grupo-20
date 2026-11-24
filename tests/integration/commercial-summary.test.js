import { describe, it, expect, beforeEach } from 'vitest';
import { initApp } from '../../src/app.js';
import { addEntity, addDocument } from '../../src/storage.js';

const SUMMARY_CONFIG = {
  moduleName: 'CRM Comercial',
  labels: {
    entity: 'Cliente',
    entityPlural: 'Clientes',
    document: 'Interacción',
    documentPlural: 'Interacciones',
  },
  statusLifecycle: {
    states: ['pendiente', 'en_revision', 'cerrado'],
    pendingStates: ['en_revision'],
  },
};

let app;

function mount(rawConfig = {}) {
  document.body.innerHTML = '<div id="app"></div>';
  app = initApp(document.getElementById('app'), { rawConfig });
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

function addDocumentWithStatus(status) {
  app.navigate('manage-document');
  const select = document.getElementById('document-entity-select');
  select.value = select.querySelector('option:not([value=""])').value;
  select.dispatchEvent(new Event('change', { bubbles: true }));
  const statusSelect = document.getElementById('field-status');
  statusSelect.value = status || 'pendiente';
  statusSelect.dispatchEvent(new Event('change', { bubbles: true }));
  document
    .getElementById('document-form')
    .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}

describe('Resumen de Gestión Comercial (H6)', () => {
  beforeEach(() => {
    mount();
  });

  it('muestra un estado vacío con indicadores en cero y las etiquetas Clientes e Historial/Ficha', () => {
    document.querySelector('[data-action="navigate"][data-view="summary"]').click();
    const values = Array.from(document.querySelectorAll('.summary-cards .stat-value')).map(
      (el) => el.textContent
    );
    expect(values).toEqual(['0', '0', '0']);
    expect(document.querySelector('.empty-state')).toBeTruthy();
    expect(document.querySelector('.commercial-summary h2').textContent).toBe('Clientes');
    expect(document.querySelector('.commercial-summary').textContent).toContain('Historial/Ficha');
  });

  it('los indicadores coinciden con los registros y se actualiza al completar un estado', () => {
    createEntity('Cliente Uno', 'CL-1');
    addDocumentWithStatus();

    document.querySelector('[data-action="navigate"][data-view="summary"]').click();
    let values = Array.from(document.querySelectorAll('.summary-cards .stat-value')).map(
      (el) => el.textContent
    );
    expect(values).toEqual(['1', '1', '1']);
    expect(document.querySelector('.pending-list').textContent).toContain('Cliente Uno');
    expect(document.querySelector('.commercial-summary').textContent).toContain('Historial/Ficha');
    expect(document.querySelector('.pending-list [data-action="view-entity"]').textContent).toBe(
      'Ver ficha'
    );

    app.navigate('manage-document');
    const select = document.getElementById('document-entity-select');
    select.value = select.querySelector('option:not([value=""])').value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    document.querySelector('[data-action="edit-document"]').click();
    document.getElementById('field-status').value = 'completado';
    document
      .getElementById('document-form')
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    document.querySelector('[data-action="navigate"][data-view="summary"]').click();
    values = Array.from(document.querySelectorAll('.summary-cards .stat-value')).map(
      (el) => el.textContent
    );
    expect(values).toEqual(['1', '1', '0']);
  });

  it('permite seleccionar una entidad desde el resumen para abrir su ficha', () => {
    createEntity('Cliente Uno', 'CL-1');
    addDocumentWithStatus();
    document.querySelector('[data-action="navigate"][data-view="summary"]').click();
    document.querySelector('.pending-list [data-action="view-entity"]').click();
    expect(document.querySelector('.entity-detail-header h2').textContent).toBe('Cliente Uno');
  });

  it('cuenta como pendientes solo los estados marcados en pendingStates', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const app = initApp(document.getElementById('app'), { rawConfig: SUMMARY_CONFIG });
    const entity = addEntity({ name: 'Cliente Uno', code: 'CL-1' });
    addDocument({ entity_id: entity.entity_id, status: 'pendiente' });
    addDocument({ entity_id: entity.entity_id, status: 'en_revision' });

    app.navigate('summary');
    const values = Array.from(document.querySelectorAll('.summary-cards .stat-value')).map(
      (el) => el.textContent
    );
    expect(values).toEqual(['1', '2', '1']);
    expect(document.querySelector('.pending-list').textContent).toContain('Cliente Uno');
    app.destroy();
  });
});
