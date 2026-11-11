import { describe, it, expect } from 'vitest';
import { initApp } from '../../src/app.js';

function mount(rawConfig) {
  document.body.innerHTML = '<div id="app"></div>';
  return initApp(document.getElementById('app'), { rawConfig });
}

describe('Regresión de aclaraciones (sesión 2026-11-01)', () => {
  it('código único sin distinguir mayúsculas ni espacios', () => {
    mount();
    document.querySelector('[data-action="navigate"][data-view="manage-entity"]').click();
    document.getElementById('field-name').value = 'Acme';
    document.getElementById('field-code').value = 'AC-1';
    document.getElementById('entity-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    document.querySelector('[data-action="navigate"][data-view="manage-entity"]').click();
    document.getElementById('field-name').value = 'Otra';
    document.getElementById('field-code').value = ' Ac-1 ';
    document.getElementById('entity-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(document.querySelector('.field-error').textContent).toMatch(/código/i);
  });

  it('confirmación de eliminación indica cuántos documentos se eliminarán', () => {
    mount();
    document.querySelector('[data-action="navigate"][data-view="manage-entity"]').click();
    document.getElementById('field-name').value = 'Acme';
    document.getElementById('field-code').value = 'AC-1';
    document.getElementById('entity-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    document.querySelector('[data-action="navigate"][data-view="manage-document"]').click();
    const select = document.getElementById('document-entity-select');
    select.value = select.querySelector('option:not([value=""])').value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    document.getElementById('document-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    document.getElementById('document-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    let capturedMessage = null;
    window.confirm = (msg) => {
      capturedMessage = msg;
      return false;
    };
    document.querySelector('[data-action="navigate"][data-view="search"]').click();
    document.querySelector('[data-action="edit-entity"]').click();
    document.querySelector('[data-action="delete-entity"]').click();
    expect(capturedMessage).toContain('2');
  });

  it('configuración inválida arranca con valores predeterminados y muestra una advertencia visible', () => {
    mount({ moduleName: '' });
    expect(document.querySelector('.config-warning')).toBeTruthy();
    expect(document.querySelector('.module-name').textContent).toBe('Módulo Base ERP');
  });

  it('los valores de campos personalizados retirados se conservan ocultos y reaparecen al redeclarar el campo', () => {
    const withField = { customFields: { entity: [{ key: 'vip', label: 'VIP', type: 'text' }] } };
    mount(withField);
    document.querySelector('[data-action="navigate"][data-view="manage-entity"]').click();
    document.getElementById('field-name').value = 'Acme';
    document.getElementById('field-code').value = 'AC-1';
    document.getElementById('field-vip').value = 'si';
    document.getElementById('entity-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    mount(null);
    document.querySelector('[data-action="navigate"][data-view="manage-entity"]').click();
    expect(document.getElementById('field-vip')).toBeNull();

    mount(withField);
    document.querySelector('[data-action="navigate"][data-view="search"]').click();
    document.querySelector('[data-action="edit-entity"]').click();
    expect(document.getElementById('field-vip').value).toBe('si');
  });

  it('el estado del documento permanece como texto libre sin ciclo de vida configurado', () => {
    mount();
    document.querySelector('[data-action="navigate"][data-view="manage-entity"]').click();
    document.getElementById('field-name').value = 'Acme';
    document.getElementById('field-code').value = 'AC-1';
    document.getElementById('entity-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    document.querySelector('[data-action="navigate"][data-view="manage-document"]').click();
    const select = document.getElementById('document-entity-select');
    select.value = select.querySelector('option:not([value=""])').value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    expect(document.getElementById('field-status').tagName).toBe('INPUT');
  });
});
