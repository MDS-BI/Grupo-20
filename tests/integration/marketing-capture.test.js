import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initApp } from '../../src/app.js';
import { loadEntities } from '../../src/storage.js';

function mountCapture() {
  window.history.replaceState({}, '', '/?view=capture');
  document.body.innerHTML = '<div id="app"></div>';
  return initApp(document.getElementById('app'));
}

function fillCommonFields() {
  document.getElementById('field-name').value = 'Visitante Público';
  document.getElementById('field-rut').value = '11.111.111-1';
  document.getElementById('field-targetDate').value = '1980-05-05';
  const channel = document.getElementById('field-canal_contacto');
  channel.value = 'llamada';
  channel.dispatchEvent(new Event('change', { bubbles: true }));
  document.getElementById('field-contacto_telefono').value = '+56912345678';
}

function submit() {
  document
    .getElementById('capture-form')
    .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}

describe('Captura pública sin marco ERP (T085)', () => {
  beforeEach(() => mountCapture());
  afterEach(() => window.history.replaceState({}, '', '/'));

  it('renderiza el formulario público sin barra superior, lateral ni navegación', () => {
    expect(document.getElementById('capture-form')).toBeTruthy();
    expect(document.querySelector('.topbar')).toBeNull();
    expect(document.querySelector('.sidebar')).toBeNull();
    expect(document.querySelector('#view-root')).toBeNull();
    expect(document.querySelector('[data-action="navigate"]')).toBeNull();
  });

  it('no crea el prospecto y explica el motivo si falta el consentimiento', () => {
    fillCommonFields();
    submit();
    expect(loadEntities()).toHaveLength(0);
    expect(document.getElementById('error-consentimiento').textContent).toContain(
      'Completa los campos obligatorios.'
    );
  });

  it('crea el prospecto con consentimiento y muestra confirmación clara sin marco ERP', () => {
    fillCommonFields();
    document.getElementById('field-consentimiento').checked = true;
    submit();
    expect(loadEntities()).toHaveLength(1);
    expect(loadEntities()[0].estado_comercial).toBe('prospecto');
    const confirmation = document.getElementById('capture-confirmation');
    expect(confirmation.textContent).toContain('Prospecto registrado correctamente.');
    expect(confirmation.getAttribute('role')).toBe('status');
    expect(document.querySelector('.sidebar')).toBeNull();
  });
});
