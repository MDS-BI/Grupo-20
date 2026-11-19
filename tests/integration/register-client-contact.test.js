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

describe('Registrar clientes y contactos comerciales (H2)', () => {
  beforeEach(() => {
    mount();
  });

  it('registra un cliente y una interacción asociada; ambos quedan visibles', () => {
    createEntity('Cliente Uno', 'CL-1');

    document.querySelector('[data-action="navigate"][data-view="manage-document"]').click();
    const select = document.getElementById('document-entity-select');
    select.value = select.querySelector('option:not([value=""])').value;
    select.dispatchEvent(new Event('change', { bubbles: true }));

    document.getElementById('field-notes').value = 'Llamada de bienvenida';
    document.getElementById('field-startDate').value = '2026-11-01';
    document.getElementById('document-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    expect(document.querySelector('.document-list .list-item').textContent).toContain('Llamada de bienvenida');

    document.querySelector('[data-action="navigate"][data-view="search"]').click();
    expect(document.querySelector('#search-results').textContent).toContain('Cliente Uno');
  });

  it('rechaza el registro cuando faltan datos obligatorios del cliente', () => {
    document.querySelector('[data-action="navigate"][data-view="manage-entity"]').click();
    document.getElementById('field-name').value = '';
    document.getElementById('field-code').value = '';
    document.getElementById('entity-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(document.querySelectorAll('.field-error').length).toBeGreaterThan(0);
  });
});
