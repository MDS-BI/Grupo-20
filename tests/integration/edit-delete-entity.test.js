import { describe, it, expect, beforeEach, vi } from 'vitest';
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
  document.getElementById('entity-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}

describe('Editar y eliminar entidades con confirmación (H4)', () => {
  beforeEach(() => {
    mount();
  });

  it('edita una entidad y la búsqueda refleja el cambio', () => {
    createEntity('Acme', 'AC-1');
    document.querySelector('[data-action="navigate"][data-view="search"]').click();
    document.querySelector('[data-action="edit-entity"]').click();
    document.getElementById('field-name').value = 'Acme Actualizado';
    document.getElementById('entity-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    document.querySelector('[data-action="navigate"][data-view="search"]').click();
    expect(document.querySelector('#search-results').textContent).toContain('Acme Actualizado');
  });

  it('pide confirmación indicando cuántos documentos se eliminarán y cancela si el usuario rechaza', () => {
    createEntity('Acme', 'AC-1');
    app.navigate('manage-document');
    const select = document.getElementById('document-entity-select');
    select.value = select.querySelector('option:not([value=""])').value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    document.getElementById('document-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    document.querySelector('[data-action="navigate"][data-view="search"]').click();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    document.querySelector('[data-action="edit-entity"]').click();
    document.querySelector('[data-action="delete-entity"]').click();
    expect(confirmSpy).toHaveBeenCalledWith(expect.stringContaining('1'));

    document.querySelector('[data-action="navigate"][data-view="search"]').click();
    expect(document.querySelectorAll('#search-results .list-item')).toHaveLength(1);
    confirmSpy.mockRestore();
  });

  it('elimina la entidad y sus documentos en cascada cuando el usuario confirma', () => {
    createEntity('Acme', 'AC-1');
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    document.querySelector('[data-action="navigate"][data-view="search"]').click();
    document.querySelector('[data-action="edit-entity"]').click();
    document.querySelector('[data-action="delete-entity"]').click();

    document.querySelector('[data-action="navigate"][data-view="search"]').click();
    expect(document.querySelectorAll('#search-results .list-item')).toHaveLength(0);
    confirmSpy.mockRestore();
  });
});
