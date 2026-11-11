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

describe('Buscar y encontrar entidades (H3/H9)', () => {
  beforeEach(() => {
    mount();
  });

  it('muestra solo las entidades coincidentes a medida que se escribe', () => {
    createEntity('Acme Corp', 'AC-1');
    createEntity('Globex', 'GL-1');

    document.querySelector('[data-action="navigate"][data-view="search"]').click();
    const input = document.getElementById('search-input');
    input.value = 'acme';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    const results = document.querySelectorAll('#search-results .list-item');
    expect(results).toHaveLength(1);
    expect(results[0].textContent).toContain('Acme Corp');
  });

  it('muestra un estado vacío claro cuando no hay coincidencias', () => {
    createEntity('Acme Corp', 'AC-1');
    document.querySelector('[data-action="navigate"][data-view="search"]').click();
    const input = document.getElementById('search-input');
    input.value = 'no-existe-en-ningun-registro';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(document.querySelector('#search-results .empty-state')).toBeTruthy();
  });

  it('mantiene el foco del campo de búsqueda al escribir (no se re-renderiza el input completo)', () => {
    createEntity('Acme Corp', 'AC-1');
    document.querySelector('[data-action="navigate"][data-view="search"]').click();
    const input = document.getElementById('search-input');
    input.focus();
    input.value = 'a';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(document.activeElement).toBe(input);
  });
});
