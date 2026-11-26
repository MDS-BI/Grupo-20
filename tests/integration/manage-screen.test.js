import { describe, it, expect, beforeEach } from 'vitest';
import { initApp } from '../../src/app.js';

let app;

function mount() {
  document.body.innerHTML = '<div id="app"></div>';
  app = initApp(document.getElementById('app'), { rawConfig: {} });
  return app;
}

describe('Pantalla de gestión dedicada (H4)', () => {
  beforeEach(() => {
    mount();
  });

  it('muestra la tabla de gestión con la columna Acciones sin usar la lista de búsqueda', () => {
    document.getElementById('field-name'); // no-op to ensure dom ready
    app.navigate('manage-entity');
    document.getElementById('field-name').value = 'Acme';
    document.getElementById('field-code').value = 'AC-1';
    document
      .getElementById('entity-form')
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    expect(document.querySelector('.manage-view .entity-list')).toBeNull();
    expect(document.querySelector('.client-management-table')).toBeTruthy();
    expect(
      [...document.querySelectorAll('.client-management-table th')].map((th) => th.textContent)
    ).toContain('Acciones');
    expect(document.querySelector('.client-management-table').textContent).toContain('Acme');
  });

  it('alterna entre la pestaña de entidades y la de documentos', () => {
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
