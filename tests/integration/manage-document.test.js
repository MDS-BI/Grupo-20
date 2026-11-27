import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { initApp } from '../../src/app.js';
import { MODULE_CONFIG } from '../../src/module-config.js';
import { addDocument, addEntity } from '../../src/storage.js';

let app;

function setSearch(search = '') {
  window.history.replaceState({}, '', `${window.location.pathname}${search}`);
}

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

function selectEntityForDocuments() {
  app.navigate('manage-document');
  const select = document.getElementById('document-entity-select');
  select.value = select.querySelector('option:not([value=""])').value;
  select.dispatchEvent(new Event('change', { bubbles: true }));
}

function seedCrmEntity(name = 'Acme', code = 'CRM-1') {
  return addEntity({
    name,
    code,
    targetDate: '1980-05-05',
    rut: '11.111.111-1',
    canal_contacto: 'llamada',
    contacto_telefono: '+56912345678',
  });
}

describe('CRUD de documentos en la pantalla de gestión (T224/H11)', () => {
  beforeEach(() => {
    setSearch('');
    mount();
  });

  afterEach(() => {
    app?.destroy();
    app = null;
    setSearch('');
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

describe('Alta de interacciones desde la gestión (T224)', () => {
  afterEach(() => {
    app?.destroy();
    app = null;
    setSearch('');
  });

  it('abre ?view=manage-document con el formulario vacío sin mutar los registros al volver al panel', () => {
    seedCrmEntity();
    setSearch('?view=manage-document');
    mount(MODULE_CONFIG);
    const before = localStorage.getItem('erp_documents');

    expect(document.querySelector('.manage-view h2').textContent).toContain('Nueva interacción');
    expect(document.getElementById('document-form')).toBeTruthy();
    expect(document.getElementById('field-notes').value).toBe('');
    expect(document.querySelector('.sidebar [data-view^="manage"]')).toBeNull();

    app.navigate('dashboard');
    expect(localStorage.getItem('erp_documents')).toBe(before);
  });

  it('abre el alta vacía desde el panel sin reutilizar una edición anterior', () => {
    const entity = seedCrmEntity();
    addDocument({
      entity_id: entity.entity_id,
      notes: 'Nota previa',
      status: 'pendiente',
    });
    mount(MODULE_CONFIG);
    app.navigate('manage-document');
    document.querySelector('[data-action="edit-document"]').click();
    expect(document.getElementById('field-notes').value).toBe('Nota previa');

    app.navigate('dashboard');
    document.querySelector('[data-action="navigate"][data-view="manage-document"]').click();

    expect(document.querySelector('.manage-view h2').textContent).toContain('Nueva interacción');
    expect(document.getElementById('field-notes').value).toBe('');
    expect(document.querySelector('.manage-view > [data-action="delete-document"]')).toBeNull();
  });
});
