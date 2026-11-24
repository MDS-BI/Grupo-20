import { describe, it, expect } from 'vitest';
import { initApp } from '../../src/app.js';

let app;

function mount(rawConfig) {
  document.body.innerHTML = '<div id="app"></div>';
  app = initApp(document.getElementById('app'), { rawConfig });
  return app;
}

const LIFECYCLE_CONFIG = {
  statusLifecycle: {
    states: ['cotizacion', 'pedido', 'facturado'],
    transitions: { cotizacion: ['pedido'], pedido: ['facturado'] },
  },
};

function createEntityAndSelectForDocuments() {
  app.navigate('manage-entity');
  document.getElementById('field-name').value = 'Acme';
  document.getElementById('field-code').value = 'AC-1';
  document
    .getElementById('entity-form')
    .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  app.navigate('manage-document');
  const select = document.getElementById('document-entity-select');
  select.value = select.querySelector('option:not([value=""])').value;
  select.dispatchEvent(new Event('change', { bubbles: true }));
}

describe('Ciclo de vida de estados de documentos (H13)', () => {
  it('ofrece los estados de las transiciones como sugerencias con texto libre y rechaza una transición inválida', () => {
    mount(LIFECYCLE_CONFIG);
    createEntityAndSelectForDocuments();
    const statusInput = document.getElementById('field-status');
    expect(statusInput.tagName).toBe('INPUT');
    expect(statusInput.getAttribute('list')).toBe('options-status');
    const optionValues = Array.from(document.querySelectorAll('#options-status option')).map(
      (o) => o.value
    );
    expect(optionValues).toEqual(['cotizacion', 'pedido', 'facturado']);

    statusInput.value = 'cotizacion';
    document
      .getElementById('document-form')
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(document.querySelector('.status-badge').textContent).toBe('cotizacion');

    document.querySelector('[data-action="edit-document"]').click();
    document.getElementById('field-status').value = 'facturado';
    document
      .getElementById('document-form')
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(document.querySelector('.field-error').textContent).toMatch(/transición/i);
  });

  it('mantiene el estado como texto libre cuando no hay ciclo de vida configurado', () => {
    mount(null);
    createEntityAndSelectForDocuments();
    expect(document.getElementById('field-status').tagName).toBe('INPUT');
  });
});
