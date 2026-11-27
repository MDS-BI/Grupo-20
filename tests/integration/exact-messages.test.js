import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initApp } from '../../src/app.js';
import { logout } from '../../src/auth.js';
import { DEFAULT_CONFIG, MODULE_CONFIG, setActiveConfig } from '../../src/module-config.js';
import { addEntity, deleteEntity, loadEntities } from '../../src/storage.js';
import { formatRut } from '../../src/utils/field-formats.js';
import { MESSAGES } from '../../src/utils/messages.js';
import { seedAuth, signIn } from '../helpers/auth-session.js';

const EXPECTED_MESSAGES = {
  noResults: 'No se encontraron resultados.',
  required: 'Completa los campos obligatorios.',
  invalidRut: 'El RUT es inválido.',
  duplicateRut: 'El RUT ya está registrado.',
  invalidContact: 'Revisa el dato de contacto según el canal elegido.',
  prospectRegistered: 'Prospecto registrado correctamente.',
  chatQueryRegistered: 'Consulta registrada; un ejecutivo hará seguimiento.',
  noCampaignRecords: 'Sin registros para esta campaña.',
  permissionDenied: 'No tienes permiso para realizar esta acción',
  accessDenied: 'Acceso denegado',
};

let app = null;
let sequence = 0;

function setSearch(search = '') {
  window.history.replaceState({}, '', `${window.location.pathname}${search}`);
}

function mount(rawConfig = MODULE_CONFIG) {
  document.body.innerHTML = '<div id="app"></div>';
  app = initApp({
    mountElement: document.getElementById('app'),
    rawConfig,
    enableAuth: true,
  });
  return app;
}

function setCaptureField(name, value) {
  const field = document.querySelector(`#capture-form [name="${name}"]`);
  field.value = String(value);
  field.dispatchEvent(new Event('input', { bubbles: true }));
  field.dispatchEvent(new Event('change', { bubbles: true }));
}

function fillCapture({
  name = 'Cliente de captura',
  rut = formatRut(88000000 + (sequence += 1)),
  telefono = '+56912345678',
  consent = true,
} = {}) {
  setCaptureField('canal_contacto', 'llamada');
  setCaptureField('name', name);
  setCaptureField('targetDate', '1990-01-01');
  setCaptureField('rut', rut);
  setCaptureField('contacto_telefono', telefono);
  document.querySelector('#capture-form [name="consentimiento"]').checked = consent;
  return rut;
}

function submitCapture() {
  document.querySelector('#capture-form').dispatchEvent(new Event('submit', { bubbles: true }));
}

beforeEach(async () => {
  await signIn('gerente');
  setActiveConfig(MODULE_CONFIG);
  setSearch('');
});

afterEach(() => {
  app?.destroy();
  app = null;
  vi.restoreAllMocks();
  setActiveConfig(DEFAULT_CONFIG);
  setSearch('');
  localStorage.clear();
});

describe('Mensajes exactos', () => {
  it('declara los diez textos sin variantes', () => {
    expect(MESSAGES).toMatchObject(EXPECTED_MESSAGES);
    expect(Object.keys(EXPECTED_MESSAGES)).toHaveLength(10);
  });

  it(MESSAGES.noResults, () => {
    mount();
    app.navigate('search');
    const input = document.querySelector('#search-input');
    input.value = 'NO-EXISTE-999';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    expect(document.querySelector('#search-results .empty-state').textContent).toBe(
      'No se encontraron resultados.'
    );
  });

  it(MESSAGES.required, () => {
    setSearch('?view=capture');
    mount();
    fillCapture({ name: '', rut: '', telefono: '' });
    submitCapture();

    expect(document.querySelector('#error-rut').textContent).toBe(
      'Completa los campos obligatorios.'
    );
  });

  it(MESSAGES.invalidRut, () => {
    setSearch('?view=capture');
    mount();
    fillCapture({ rut: '12.345.678-6' });
    submitCapture();

    expect(document.querySelector('#error-rut').textContent).toBe('El RUT es inválido.');
  });

  it(MESSAGES.duplicateRut, () => {
    const rut = '12.345.678-5';
    addEntity({
      name: 'Cliente previo',
      targetDate: '1990-01-01',
      rut,
      canal_contacto: 'llamada',
      contacto_telefono: '+56912345678',
    });
    setSearch('?view=capture');
    mount();
    fillCapture({ rut });
    submitCapture();

    expect(document.querySelector('#error-rut').textContent).toBe('El RUT ya está registrado.');
  });

  it(MESSAGES.invalidContact, () => {
    setSearch('?view=capture');
    mount();
    fillCapture({ telefono: 'abc' });
    submitCapture();

    expect(document.querySelector('#error-contacto_telefono').textContent).toBe(
      'Revisa el dato de contacto según el canal elegido.'
    );
  });

  it(MESSAGES.prospectRegistered, () => {
    setSearch('?view=capture');
    mount();
    fillCapture();
    submitCapture();

    expect(document.querySelector('#capture-confirmation').textContent).toBe(
      'Prospecto registrado correctamente.'
    );
    expect(loadEntities().some((entity) => entity.estado_comercial === 'prospecto')).toBe(true);
  });

  it(MESSAGES.chatQueryRegistered, () => {
    setSearch('?view=capture');
    mount();
    fillCapture();
    submitCapture();
    const mensaje = document.querySelector('#chat-form [name="mensaje"]');
    mensaje.value = 'Consulta urgente sin respuesta configurada';
    mensaje.dispatchEvent(new Event('input', { bubbles: true }));
    document.querySelector('#chat-form').dispatchEvent(new Event('submit', { bubbles: true }));

    expect(document.querySelector('.chat-response').textContent).toBe(
      'Consulta registrada; un ejecutivo hará seguimiento.'
    );
  });

  it(MESSAGES.noCampaignRecords, () => {
    const config = {
      ...MODULE_CONFIG,
      marketing: {
        ...MODULE_CONFIG.marketing,
        campaigns: [
          {
            id: 'campaign-empty',
            name: 'Campaña sin registros',
            stage: 'prospecto',
            event: 'document_created',
            action: 'create_document',
            status: 'activa',
            startDate: '2026-01-01',
            endDate: '2026-12-31',
          },
        ],
      },
    };
    mount(config);
    app.navigate('marketing');
    document
      .querySelector('[data-section="performance"]')
      .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    const select = document.querySelector('#performance-campaign');
    select.value = 'campaign-empty';
    select.dispatchEvent(new Event('change', { bubbles: true }));

    expect(document.querySelector('.marketing-performance .empty-state').textContent).toBe(
      'Sin registros para esta campaña.'
    );
  });

  it(MESSAGES.permissionDenied, async () => {
    const rut = '12.345.679-3';
    const owner = addEntity({
      name: 'Cliente de otro ejecutivo',
      targetDate: '1990-01-01',
      rut,
      canal_contacto: 'llamada',
      contacto_telefono: '+56912345678',
      ownerId: 'user-gerente',
    });
    expect(owner.rut).toBe(rut);

    await signIn('ventas');
    let thrown;
    try {
      deleteEntity(owner.id);
    } catch (error) {
      thrown = error;
    }

    expect(thrown?.message).toBe('No tienes permiso para realizar esta acción');
  });

  it(MESSAGES.accessDenied, async () => {
    await signIn('atencion');
    mount();
    app.navigate('marketing');

    expect(document.querySelector('#route-notice').textContent).toBe('Acceso denegado');
  });

  it('no muestra mensajes de credenciales en el acceso por botones', async () => {
    logout();
    seedAuth();
    mount();

    expect(document.querySelector('.login-view')).toBeTruthy();
    expect(document.querySelector('[data-action="login-user"]')).toBeTruthy();
    for (const text of ['Ingresa una contraseña', 'Usuario no encontrado']) {
      expect(document.body.textContent, text).not.toContain(text);
    }
  });
});
