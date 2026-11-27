import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { initApp } from '../../src/app.js';
import { MODULE_CONFIG } from '../../src/module-config.js';
import { addEntity, loadEntities } from '../../src/storage.js';

let app;

function setSearch(search = '') {
  window.history.replaceState({}, '', `${window.location.pathname}${search}`);
}

function mount() {
  document.body.innerHTML = '<div id="app"></div>';
  app = initApp(document.getElementById('app'), { rawConfig: MODULE_CONFIG });
  return app;
}

function seedEntity() {
  return addEntity({
    name: 'Acme',
    targetDate: '1980-05-05',
    rut: '11.111.111-1',
    canal_contacto: 'llamada',
    contacto_telefono: '+56912345678',
  });
}

describe('Pantalla de gestión dedicada (T223/T225)', () => {
  beforeEach(() => {
    setSearch('');
  });

  afterEach(() => {
    app?.destroy();
    app = null;
    setSearch('');
  });

  it('abre ?view=manage-entity con el alta vacía y sin mutar los registros al volver al panel', () => {
    setSearch('?view=manage-entity');
    mount();
    const before = localStorage.getItem('erp_entities');

    expect(document.querySelector('.manage-view .client-management-table')).toBeTruthy();
    expect(document.querySelector('.client-form-section h2').textContent).toBe('Nuevo Cliente');
    expect(document.getElementById('field-name').value).toBe('');
    expect(document.getElementById('field-rut').value).toBe('');
    expect(document.querySelector('.manage-view .entity-list')).toBeNull();
    expect(document.querySelector('.sidebar [data-view^="manage"]')).toBeNull();

    app.navigate('dashboard');
    expect(localStorage.getItem('erp_entities')).toBe(before);
  });

  it('abre el alta vacía desde el panel sin reutilizar una edición anterior', () => {
    seedEntity();
    mount();
    app.navigate('manage-entity');
    document.querySelector('[data-action="edit-entity"]').click();
    expect(document.querySelector('.client-form-section h2').textContent).toContain('Editar');

    app.navigate('dashboard');
    document.querySelector('[data-action="quick-manage"]').click();

    expect(document.querySelector('.client-form-section h2').textContent).toBe('Nuevo Cliente');
    expect(document.getElementById('field-name').value).toBe('');
    expect(
      document.querySelector('.client-form-section [data-action="archive-entity"]')
    ).toBeNull();
  });

  it('muestra la tabla de gestión con la columna Acciones sin usar la lista de búsqueda', () => {
    seedEntity();
    mount();
    app.navigate('manage-entity');

    expect(document.querySelector('.manage-view .entity-list')).toBeNull();
    expect(
      [...document.querySelectorAll('.client-management-table th')].map((th) => th.textContent)
    ).toContain('Acciones');
    expect(document.querySelector('.client-management-table').textContent).toContain('Acme');
    expect(loadEntities()).toHaveLength(1);
  });

  it('alterna entre la pestaña de entidades y la de documentos', () => {
    mount();
    app.navigate('manage-entity');
    expect(
      document
        .querySelector('[data-action="manage-tab"][data-tab="entity"]')
        .classList.contains('active')
    ).toBe(true);

    app.navigate('manage-document');
    expect(
      document
        .querySelector('[data-action="manage-tab"][data-tab="document"]')
        .classList.contains('active')
    ).toBe(true);
  });
});
