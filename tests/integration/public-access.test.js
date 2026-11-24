import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { initApp } from '../../src/app.js';
import { DEFAULT_CONFIG, MODULE_CONFIG, setActiveConfig } from '../../src/module-config.js';
import { loadDocuments, loadEntities } from '../../src/storage.js';
import { formatRut } from '../../src/utils/field-formats.js';
import { MESSAGES } from '../../src/utils/messages.js';
import { seedAuth } from '../helpers/auth-session.js';

let app = null;
let sequence = 0;

function setSearch(search = '') {
  window.history.replaceState({}, '', `${window.location.pathname}${search}`);
}

function mount() {
  document.body.innerHTML = '<div id="app"></div>';
  app = initApp({
    mountElement: document.getElementById('app'),
    rawConfig: MODULE_CONFIG,
    enableAuth: true,
  });
  return app;
}

function setField(formSelector, name, value) {
  const field = document.querySelector(`${formSelector} [name="${name}"]`);
  field.value = String(value);
  field.dispatchEvent(new Event('input', { bubbles: true }));
  field.dispatchEvent(new Event('change', { bubbles: true }));
}

function fillCapture({ consent = true, rut = formatRut(99000000 + (sequence += 1)) } = {}) {
  setField('#capture-form', 'canal_contacto', 'llamada');
  setField('#capture-form', 'name', 'Visitante público');
  setField('#capture-form', 'targetDate', '1990-01-01');
  setField('#capture-form', 'rut', rut);
  setField('#capture-form', 'contacto_telefono', '+56912345678');
  document.querySelector('#capture-form [name="consentimiento"]').checked = consent;
  return rut;
}

function submitCapture() {
  document.querySelector('#capture-form').dispatchEvent(new Event('submit', { bubbles: true }));
}

function submitChat(mensaje, { consent = true } = {}) {
  setField('#chat-form', 'mensaje', mensaje);
  document.querySelector('#chat-form [name="consentimiento"]').checked = consent;
  document.querySelector('#chat-form').dispatchEvent(new Event('submit', { bubbles: true }));
}

beforeEach(() => {
  seedAuth();
  setActiveConfig(MODULE_CONFIG);
  setSearch('?view=capture');
});

afterEach(() => {
  app?.destroy();
  app = null;
  setActiveConfig(DEFAULT_CONFIG);
  setSearch('');
  localStorage.clear();
});

describe('Acceso público a captura y chat', () => {
  it('permite capturar prospectos sin iniciar sesión', () => {
    mount();

    expect(app.getState().view).toBe('capture');
    expect(app.getState().currentUser).toBeNull();
    expect(document.querySelector('#login-form')).toBeNull();

    fillCapture();
    submitCapture();

    expect(document.querySelector('#capture-confirmation').textContent).toBe(
      MESSAGES.prospectRegistered
    );
    expect(app.getState().currentUser).toBeNull();
  });

  it('exige consentimiento explícito antes de registrar el prospecto', () => {
    mount();
    fillCapture({ consent: false });
    submitCapture();

    expect(document.querySelector('#error-consentimiento').textContent).toBe(MESSAGES.required);
    expect(loadEntities()).toEqual([]);
  });

  it('registra solo los datos declarados en captureFields y el consentimiento', () => {
    mount();
    const rut = fillCapture();
    submitCapture();

    const entity = loadEntities()[0];
    expect(entity).toMatchObject({
      name: 'Visitante público',
      targetDate: '1990-01-01',
      rut,
      canal_contacto: 'llamada',
      contacto_telefono: '+56912345678',
      estado_comercial: 'prospecto',
      consentimiento: true,
      consentimiento_version: MODULE_CONFIG.marketing.privacyNoticeVersion,
    });
    expect(entity.contacto_correo).toBeUndefined();
    expect(entity.rubro).toBeUndefined();

    const allowed = new Set([
      ...MODULE_CONFIG.marketing.captureFields,
      'campaña',
      'estado_comercial',
      'consentimiento',
      'consentimiento_fecha',
      'consentimiento_version',
      'id',
      'entity_id',
      'code',
      'category',
      'description',
      'createdAt',
      'updatedAt',
      'ownerId',
    ]);
    for (const key of Object.keys(entity)) {
      expect(allowed.has(key), `campo ${key}`).toBe(true);
    }
  });

  it('no registra consultas de chat sin un prospecto vinculado', () => {
    mount();
    expect(document.querySelector('#chat-form .empty-state').textContent).toBe(
      'Regístrate para abrir la conversación.'
    );

    submitChat('Consulta sin registro');

    expect(document.querySelector('.chat-response').textContent).toBe(
      'La consulta debe estar asociada a una entidad.'
    );
    expect(loadDocuments()).toEqual([]);
  });

  it('vincula las consultas al prospecto capturado y responde las FAQs', () => {
    mount();
    fillCapture();
    submitCapture();

    const pregunta = MODULE_CONFIG.marketing.faq[0].pregunta;
    submitChat(pregunta);

    const entity = loadEntities()[0];
    const messages = loadDocuments().filter(
      (doc) => doc.entity_id === entity.entity_id && doc.canal === 'chat'
    );
    expect(document.querySelector('.chat-response').textContent).toBe(
      MODULE_CONFIG.marketing.faq[0].respuesta
    );
    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({
      canal: 'chat',
      mensaje: pregunta,
      tipo_interaccion: 'consulta',
      status: 'respondida',
      respondida: true,
    });
    expect(messages[0].respuesta).toBe(MODULE_CONFIG.marketing.faq[0].respuesta);
    expect(app.getState().currentUser).toBeNull();
  });
});
