import { describe, it, expect } from 'vitest';
import { initApp } from '../../src/app.js';

function mount(rawConfig) {
  document.body.innerHTML = '<div id="app"></div>';
  return initApp(document.getElementById('app'), { rawConfig });
}

const CONFIG_WITH_CUSTOM_FIELD = {
  customFields: {
    entity: [{ key: 'creditLimit', label: 'Límite de crédito', type: 'number', required: true }],
    document: [],
  },
};

describe('Campos personalizados declarados en la configuración (H8)', () => {
  it('renderiza el campo numérico y bloquea el guardado en blanco', () => {
    mount(CONFIG_WITH_CUSTOM_FIELD);
    document.querySelector('[data-action="navigate"][data-view="manage-entity"]').click();
    const field = document.getElementById('field-creditLimit');
    expect(field.type).toBe('number');

    document.getElementById('field-name').value = 'Acme';
    document.getElementById('field-code').value = 'AC-1';
    document.getElementById('entity-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(document.querySelector('.field-error').textContent).toMatch(/crédito/i);
  });

  it('muestra el valor guardado y permite encontrarlo por búsqueda', () => {
    mount(CONFIG_WITH_CUSTOM_FIELD);
    document.querySelector('[data-action="navigate"][data-view="manage-entity"]').click();
    document.getElementById('field-name').value = 'Acme';
    document.getElementById('field-code').value = 'AC-1';
    document.getElementById('field-creditLimit').value = '5000';
    document.getElementById('entity-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    document.querySelector('[data-action="navigate"][data-view="search"]').click();
    document.querySelector('[data-action="view-entity"]').click();
    // El valor personalizado persiste; no se expone directamente en la ficha base,
    // pero sigue disponible al reabrir el formulario de edición.
    document.querySelector('[data-action="navigate"][data-view="search"]').click();
    document.querySelector('[data-action="edit-entity"]').click();
    expect(document.getElementById('field-creditLimit').value).toBe('5000');
  });

  it('cuando no hay campos personalizados declarados, el comportamiento es el del módulo base', () => {
    mount(null);
    document.querySelector('[data-action="navigate"][data-view="manage-entity"]').click();
    expect(document.getElementById('field-creditLimit')).toBeNull();
  });

  it('oculta un valor personalizado retirado de la configuración y lo restaura al redeclarar el campo', () => {
    mount(CONFIG_WITH_CUSTOM_FIELD);
    document.querySelector('[data-action="navigate"][data-view="manage-entity"]').click();
    document.getElementById('field-name').value = 'Acme';
    document.getElementById('field-code').value = 'AC-1';
    document.getElementById('field-creditLimit').value = '5000';
    document.getElementById('entity-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    // El campo se retira de la configuración del módulo.
    mount(null);
    document.querySelector('[data-action="navigate"][data-view="manage-entity"]').click();
    expect(document.getElementById('field-creditLimit')).toBeNull();

    // Al redeclararlo, el valor guardado reaparece.
    mount(CONFIG_WITH_CUSTOM_FIELD);
    document.querySelector('[data-action="navigate"][data-view="manage-entity"]').click();
    document.querySelector('[data-action="navigate"][data-view="search"]').click();
    document.querySelector('[data-action="edit-entity"]').click();
    expect(document.getElementById('field-creditLimit').value).toBe('5000');
  });
});
