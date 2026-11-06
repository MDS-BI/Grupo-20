import { describe, it, expect } from 'vitest';
import { initApp } from '../../src/app.js';

function mount(rawConfig) {
  document.body.innerHTML = '<div id="app"></div>';
  return initApp(document.getElementById('app'), { rawConfig });
}

const LIFECYCLE_CONFIG = {
  statusLifecycle: {
    states: ['cotizacion', 'pedido', 'facturado'],
    transitions: { cotizacion: ['pedido'], pedido: ['facturado'] },
  },
};

function createEntityAndSelectForDocuments() {
  document.querySelector('[data-action="navigate"][data-view="manage-entity"]').click();
  document.getElementById('field-name').value = 'Acme';
  document.getElementById('field-code').value = 'AC-1';
  document.getElementById('entity-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  document.querySelector('[data-action="navigate"][data-view="manage-document"]').click();
  const select = document.getElementById('document-entity-select');
  select.value = select.querySelector('option:not([value=""])').value;
  select.dispatchEvent(new Event('change', { bubbles: true }));
}

describe('Ciclo de vida de estados de documentos (H13)', () => {
  it('ofrece solo los estados alcanzables y rechaza una transición inválida', () => {
    mount(LIFECYCLE_CONFIG);
    createEntityAndSelectForDocuments();
    const statusSelect = document.getElementById('field-status');
    expect(statusSelect.tagName).toBe('SELECT');
    const optionValues = Array.from(statusSelect.options).map((o) => o.value).filter(Boolean);
    expect(optionValues).toEqual(['cotizacion', 'pedido', 'facturado']);

    statusSelect.value = 'cotizacion';
    document.getElementById('document-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(document.querySelector('.status-badge').textContent).toBe('cotizacion');

    document.querySelector('[data-action="edit-document"]').click();
    document.getElementById('field-status').value = 'facturado';
    document.getElementById('document-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(document.querySelector('.field-error').textContent).toMatch(/transición/i);
  });

  it('mantiene el estado como texto libre cuando no hay ciclo de vida configurado', () => {
    mount(null);
    createEntityAndSelectForDocuments();
    expect(document.getElementById('field-status').tagName).toBe('INPUT');
  });
});
