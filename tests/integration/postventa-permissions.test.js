import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { initApp } from '../../src/app.js';
import { logout } from '../../src/auth.js';
import { DEFAULT_CONFIG, setActiveConfig } from '../../src/module-config.js';
import { MESSAGES } from '../../src/utils/messages.js';
import { signIn } from '../helpers/auth-session.js';
import {
  addEntity,
  createTicketDocument,
  loadDocuments,
  setStorageAuthEnforced,
} from '../../src/storage.js';

let app = null;
let ownEntity;
let otherEntity;

function setSearch(search = '') {
  window.history.replaceState({}, '', `${window.location.pathname}${search}`);
}

function mount() {
  document.body.innerHTML = '<div id="app"></div>';
  app = initApp(document.getElementById('app'), { rawConfig: null, enableAuth: true });
  return app;
}

function submit(selector) {
  const form = document.querySelector(selector);
  expect(form, `No se encontró ${selector}`).toBeTruthy();
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}

function setField(name, value) {
  const field = document.querySelector(`#ticket-form [name="${name}"]`);
  expect(field, `No se encontró ${name}`).toBeTruthy();
  field.value = value;
}

function openInlinePanel() {
  const button = document.querySelector('[data-action="ticket-form"]');
  expect(button, 'No se encontró Nuevo Ticket').toBeTruthy();
  button.click();
  expect(document.querySelector('#ticket-form')).toBeTruthy();
}

function createTicketFor(entityId, asunto) {
  return createTicketDocument({
    entity_id: entityId,
    asunto,
    categoria: 'garantia',
    prioridad: 'media',
    status: 'Abierto',
  });
}

describe('Permisos de Postventa en UI, ruta y datos (T199)', () => {
  beforeEach(async () => {
    setActiveConfig(DEFAULT_CONFIG);
    await signIn('gerente');
    setStorageAuthEnforced(true);
    ownEntity = addEntity({
      name: 'Cliente de Ventas',
      code: 'PV-OWN',
      ejecutivo_asignado: 'user-ventas',
      ownerId: 'user-ventas',
    });
    otherEntity = addEntity({
      name: 'Cliente de Gerencia',
      code: 'PV-OTHER',
      ejecutivo_asignado: 'user-gerente',
      ownerId: 'user-gerente',
    });
    setSearch('');
  });

  afterEach(() => {
    setStorageAuthEnforced(false);
    logout();
    app?.destroy();
    app = null;
    setSearch('');
    localStorage.clear();
  });

  it('N1 crea tickets y cambia cualquier estado con nota', async () => {
    await signIn('atencion');
    setSearch('?view=postventa');
    mount();
    expect(app.getState().view).toBe('postventa');
    openInlinePanel();
    setField('entity_id', ownEntity.entity_id);
    setField('asunto', 'Falla reportada');
    setField('categoria', 'soporte_tecnico');
    setField('prioridad', 'alta');
    submit('#ticket-form');

    let tickets = loadDocuments();
    expect(tickets).toHaveLength(1);
    expect(tickets[0]).toMatchObject({ ticket: true, status: 'Abierto' });
    expect(app.getState().view).toBe('postventa');
    expect(window.location.search).toBe('?view=postventa');

    const row = document.querySelector(`[data-ticket-id="${tickets[0].id}"]`);
    row.querySelector('[data-ticket-note]').value = 'Resuelto por teléfono';
    const status = row.querySelector('[data-action="ticket-status-change"]');
    status.value = 'Resuelto';
    status.dispatchEvent(new Event('change', { bubbles: true }));

    tickets = loadDocuments();
    expect(tickets[0].status).toBe('Resuelto');
    expect(tickets[0].nota_resolucion).toBe('Resuelto por teléfono');
    expect(document.querySelector('.postventa-cards').textContent).toContain('Resueltos');

    const reopen = document
      .querySelector(`[data-ticket-id="${tickets[0].id}"]`)
      .querySelector('[data-action="ticket-status-change"]');
    reopen.value = 'Abierto';
    reopen.dispatchEvent(new Event('change', { bubbles: true }));

    tickets = loadDocuments();
    expect(tickets[0].status).toBe('Abierto');
    expect(tickets[0].nota_resolucion).toBe('Resuelto por teléfono');
  });

  it('N4 también crea y cambia estados', async () => {
    await signIn('gerente');
    setSearch('?view=postventa');
    mount();
    expect(app.getState().view).toBe('postventa');
    openInlinePanel();
    setField('entity_id', otherEntity.entity_id);
    setField('asunto', 'Solicitud de garantía');
    setField('categoria', 'garantia');
    setField('prioridad', 'baja');
    submit('#ticket-form');

    expect(loadDocuments()).toHaveLength(1);
    expect(app.getState().view).toBe('postventa');
    expect(window.location.search).toBe('?view=postventa');
    const status = document.querySelector('[data-action="ticket-status-change"]');
    status.value = 'En revisión';
    status.dispatchEvent(new Event('change', { bubbles: true }));
    expect(loadDocuments()[0].status).toBe('En revisión');
  });

  it('N2 ve solo sus clientes y no tiene controles de creación ni cambio', async () => {
    createTicketFor(ownEntity.entity_id, 'Ticket propio');
    createTicketFor(otherEntity.entity_id, 'Ticket ajeno');
    logout();
    await signIn('ventas');
    mount();
    app.navigate('postventa');

    const table = document.querySelector('.client-management-table');
    expect(table.textContent).toContain('Ticket propio');
    expect(table.textContent).not.toContain('Ticket ajeno');
    expect(document.querySelector('[data-action="ticket-form"]')).toBeNull();
    expect(document.querySelector('[data-action="ticket-status-change"]')).toBeNull();
    expect(document.querySelector('[data-ticket-note]')).toBeNull();

    const before = localStorage.getItem('erp_documents');
    expect(() => createTicketFor(ownEntity.entity_id, 'Intento denegado')).toThrow(
      MESSAGES.permissionDenied
    );
    expect(localStorage.getItem('erp_documents')).toBe(before);
  });

  it('N2 no ve Nuevo Ticket y recibe denegación si se fuerza el panel', async () => {
    logout();
    await signIn('ventas');
    mount();
    app.navigate('postventa');

    expect(app.getState().view).toBe('postventa');
    expect(document.querySelector('[data-action="ticket-form"]')).toBeNull();

    const before = localStorage.getItem('erp_documents');
    app.getState().ticketFormOpen = true;
    app.navigate('postventa');
    setField('entity_id', ownEntity.entity_id);
    setField('asunto', 'Intento N2');
    setField('categoria', 'consulta');
    setField('prioridad', 'baja');
    submit('#ticket-form');

    expect(document.querySelector('#route-notice').textContent).toBe(MESSAGES.permissionDenied);
    expect(localStorage.getItem('erp_documents')).toBe(before);
    expect(() => createTicketFor(ownEntity.entity_id, 'Intento N2 directo')).toThrow(
      MESSAGES.permissionDenied
    );
    expect(localStorage.getItem('erp_documents')).toBe(before);
  });

  it('N3 recibe acceso denegado en enlace profundo y la capa de datos rechaza la escritura', async () => {
    await signIn('marketing');
    setSearch('?view=postventa');
    mount();

    expect(document.querySelector('#route-notice').textContent).toBe(MESSAGES.accessDenied);
    expect(app.getState().view).toBe('dashboard');
    const before = localStorage.getItem('erp_documents');
    expect(() => createTicketFor(ownEntity.entity_id, 'Intento de marketing')).toThrow(
      MESSAGES.permissionDenied
    );
    expect(localStorage.getItem('erp_documents')).toBe(before);
  });

  it('?view=ticket-form ya no es una vista y N3 sigue sin poder escribir tickets', async () => {
    await signIn('marketing');
    setSearch('?view=ticket-form');
    mount();

    expect(document.querySelector('#ticket-form')).toBeNull();
    expect(document.querySelector('#route-notice')).toBeNull();
    expect(app.getState().view).toBe('dashboard');

    const before = localStorage.getItem('erp_documents');
    expect(() => createTicketFor(ownEntity.entity_id, 'Intento N3')).toThrow(
      MESSAGES.permissionDenied
    );
    expect(localStorage.getItem('erp_documents')).toBe(before);
  });

  it('el visitante conserva el enlace profundo y ve el login', async () => {
    logout();
    setSearch('?view=postventa');
    mount();

    expect(app.getState().view).toBe('login');
    expect(app.getState().pendingRoute).toMatchObject({ view: 'postventa' });
    expect(window.location.search).toBe('?view=postventa');
    expect(() => createTicketFor(ownEntity.entity_id, 'Intento anónimo')).toThrow(
      MESSAGES.permissionDenied
    );
  });

  it('?view=ticket-form ya no genera una ruta pendiente para el visitante', async () => {
    logout();
    setSearch('?view=ticket-form');
    mount();

    expect(app.getState().view).toBe('login');
    expect(app.getState().pendingRoute).toMatchObject({ view: 'dashboard' });
    expect(window.location.search).toBe('');
    expect(document.querySelector('#ticket-form')).toBeNull();

    const before = localStorage.getItem('erp_documents');
    expect(() => createTicketFor(ownEntity.entity_id, 'Intento visitante')).toThrow(
      MESSAGES.permissionDenied
    );
    expect(localStorage.getItem('erp_documents')).toBe(before);
  });
});
