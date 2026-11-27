import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { initApp } from '../../src/app.js';
import { MODULE_CONFIG } from '../../src/module-config.js';
import { loadDocuments, loadEntities } from '../../src/storage.js';
import { seedAuth, signIn } from '../helpers/auth-session.js';

let app = null;

function setSearch(search = '') {
  window.history.replaceState({}, '', `${window.location.pathname}${search}`);
}

function mountPortal() {
  document.body.innerHTML = '<div id="app"></div>';
  app = initApp(document.getElementById('app'));
  return app;
}

function mountAuthenticated(search) {
  setSearch(search);
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

function submit(formSelector) {
  document
    .querySelector(formSelector)
    .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}

function switchToSupport() {
  document.querySelector('[data-action="portal-tab"][data-tab="support"]').click();
}

function fillQuote() {
  setField('#portal-quote-form', 'name', 'Empresa Cotizante');
  setField('#portal-quote-form', 'empresa', 'Comercial Andina');
  setField('#portal-quote-form', 'correo', 'contacto@ejemplo.cl');
  setField('#portal-quote-form', 'telefono', '+56912345678');
  setField('#portal-quote-form', 'servicio_interes', 'Implementación ERP');
  setField('#portal-quote-form', 'monto_estimado', '1500');
  document.querySelector('#portal-quote-form [name="consentimiento"]').checked = true;
}

function seedPortalClient() {
  localStorage.setItem(
    'erp_entities',
    JSON.stringify([
      {
        id: 'cli-portal',
        entity_id: 'cli-portal',
        name: 'Cliente Soporte',
        code: 'CLI-900',
        contacto_correo: 'soporte@ejemplo.cl',
        contacto_telefono: '+56987654321',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ])
  );
}

beforeEach(() => {
  seedAuth();
  setSearch('?view=client-portal');
});

afterEach(() => {
  app?.destroy();
  app = null;
  setSearch('');
  localStorage.clear();
});

describe('Portal del Cliente público', () => {
  it('muestra dos pestañas exactas sin marco ERP', () => {
    mountPortal();

    expect(document.querySelector('.topbar')).toBeNull();
    expect(document.querySelector('.sidebar')).toBeNull();
    expect(document.querySelector('#view-root')).toBeNull();
    expect(document.querySelector('[data-action="navigate"]')).toBeNull();
    expect(
      [...document.querySelectorAll('[data-action="portal-tab"]')].map((tab) =>
        tab.textContent.trim()
      )
    ).toEqual(['Solicitar cotización', 'Soporte Postventa']);
    expect(document.querySelector('#portal-quote-form')).toBeTruthy();
  });

  it('rechaza una cotización incompleta sin crear registros', () => {
    const entitiesBefore = localStorage.getItem('erp_entities');
    const documentsBefore = localStorage.getItem('erp_documents');
    mountPortal();

    submit('#portal-quote-form');

    expect(document.querySelector('#portal-error').textContent).toBe(
      'Completa los campos obligatorios.'
    );
    expect(localStorage.getItem('erp_entities')).toBe(entitiesBefore);
    expect(localStorage.getItem('erp_documents')).toBe(documentsBefore);
  });

  it('crea prospecto y cotización con consentimiento', () => {
    mountPortal();
    fillQuote();

    submit('#portal-quote-form');

    expect(document.querySelector('#portal-confirmation').textContent).toBe(
      'Solicitud registrada correctamente.'
    );
    const prospect = loadEntities().find((entity) => entity.name === 'Empresa Cotizante');
    expect(prospect).toMatchObject({
      empresa: 'Comercial Andina',
      contacto_correo: 'contacto@ejemplo.cl',
      contacto_telefono: '+56912345678',
      estado_comercial: 'prospecto',
      consentimiento: true,
    });
    expect(prospect.consentimiento_fecha).toBeTruthy();
    expect(
      loadDocuments().some(
        (document) =>
          document.entity_id === prospect.entity_id &&
          document.servicio_interes === 'Implementación ERP' &&
          document.monto_estimado === 1500 &&
          !document.ticket
      )
    ).toBe(true);
  });

  it('descarta la pestaña y los borradores al recargar', () => {
    mountPortal();
    switchToSupport();
    setField('#portal-support-form', 'correo_cliente', 'soporte@ejemplo.cl');

    app.destroy();
    mountPortal();

    expect(document.querySelector('#portal-quote-form')).toBeTruthy();
    expect(document.querySelector('#portal-support-form')).toBeNull();
  });

  it('rechaza soporte sin cliente sin mutar registros', () => {
    const entitiesBefore = localStorage.getItem('erp_entities');
    const documentsBefore = localStorage.getItem('erp_documents');
    mountPortal();
    switchToSupport();
    setField('#portal-support-form', 'correo_cliente', 'desconocido@ejemplo.cl');
    setField('#portal-support-form', 'categoria', 'consulta');
    setField('#portal-support-form', 'descripcion', 'Sin coincidencia');

    submit('#portal-support-form');

    expect(document.querySelector('#portal-error').textContent).toBe(
      'No encontramos un cliente con ese correo o teléfono.'
    );
    expect(localStorage.getItem('erp_entities')).toBe(entitiesBefore);
    expect(localStorage.getItem('erp_documents')).toBe(documentsBefore);
  });

  it('crea un ticket Abierto/Media y lo refleja en Postventa sin recarga', async () => {
    seedPortalClient();
    mountPortal();
    switchToSupport();
    setField('#portal-support-form', 'correo_cliente', '+56 9 8765 4321');
    setField('#portal-support-form', 'categoria', 'consulta');
    setField('#portal-support-form', 'descripcion', 'No encuentro mi pedido.');

    submit('#portal-support-form');

    expect(document.querySelector('#portal-confirmation').textContent).toBe(
      'Ticket registrado correctamente.'
    );
    const ticket = loadDocuments().find((document) => document.ticket === true);
    expect(ticket).toMatchObject({
      entity_id: 'cli-portal',
      asunto: 'Consulta',
      categoria: 'consulta',
      notes: 'No encuentro mi pedido.',
      status: 'Abierto',
      prioridad: 'media',
    });

    app.destroy();
    await signIn('atencion');
    mountAuthenticated('?view=postventa');

    expect(document.body.textContent).toContain('Cliente Soporte');
    expect(document.body.textContent).toContain('Tickets abiertos1');
  });
});
