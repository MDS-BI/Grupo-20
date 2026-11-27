import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initApp } from '../../src/app.js';
import { logout } from '../../src/auth.js';
import {
  archiveEntity,
  addDocument,
  addEntity,
  deleteEntity,
  loadDocuments,
  loadEntities,
} from '../../src/storage.js';
import { MESSAGES } from '../../src/utils/messages.js';
import { formatRut } from '../../src/utils/field-formats.js';
import { seedAuth, signIn } from '../helpers/auth-session.js';

let app;
let sequence = 0;

function setSearch(search = '') {
  window.history.replaceState({}, '', `${window.location.pathname}${search}`);
}

function mount() {
  document.body.innerHTML = '<div id="app"></div>';
  app = initApp(document.getElementById('app'));
  return app;
}

function createEntity(name) {
  sequence += 1;
  return addEntity({
    name,
    code: `ARC-${sequence}`,
    targetDate: '1980-05-05',
    rut: formatRut(12000000 + sequence),
    canal_contacto: 'llamada',
    contacto_telefono: '+56 9 1234 5678',
  });
}

function click(selector) {
  const element = document.querySelector(selector);
  expect(element, `No se encontró ${selector}`).toBeTruthy();
  element.click();
}

function cardValues() {
  return [...document.querySelectorAll('.summary-cards .stat-card .stat-value')].map(
    (element) => element.textContent
  );
}

beforeEach(() => {
  seedAuth();
  setSearch('');
});

afterEach(() => {
  app?.destroy();
  app = null;
  vi.restoreAllMocks();
  logout();
  setSearch('');
});

describe('Ciclo de vida de clientes: archivar, restaurar y eliminar', () => {
  it('archiva un cliente conservando su historial y lo muestra solo en Archivados', async () => {
    await signIn('gerente');
    const entity = createEntity('Cliente Archivable');
    addDocument({ entity_id: entity.entity_id, status: 'pendiente', notes: 'Seguimiento' });
    mount();

    app.navigate('search');
    click(`[data-action="archive-entity"][data-id="${entity.id}"]`);

    const stored = loadEntities().find((item) => item.id === entity.id);
    expect(stored.archivedAt).toBeTruthy();
    expect(loadDocuments()).toHaveLength(1);
    expect(document.querySelector('#search-results').textContent).not.toContain(
      'Cliente Archivable'
    );

    click('[data-action="client-status-filter"][data-status="archived"]');
    expect(document.querySelector('#search-results').textContent).toContain('Cliente Archivable');
    expect(document.querySelector('#search-results .status-badge.archived')).toBeTruthy();
    expect(
      document.querySelector(`[data-action="restore-entity"][data-id="${entity.id}"]`)
    ).toBeTruthy();

    app.navigate('dashboard');
    expect(cardValues()).toEqual(['0', '0', '0', '0%', '$0']);
  });

  it('restaura un cliente y recalcula los indicadores del panel', async () => {
    await signIn('gerente');
    const entity = createEntity('Cliente Restaurable');
    addDocument({ entity_id: entity.entity_id, status: 'cerrado ganado', importe: 100 });
    mount();

    app.navigate('search');
    click(`[data-action="archive-entity"][data-id="${entity.id}"]`);
    app.navigate('dashboard');
    expect(cardValues()).toEqual(['0', '0', '0', '0%', '$0']);

    app.navigate('search');
    click('[data-action="client-status-filter"][data-status="archived"]');
    click(`[data-action="restore-entity"][data-id="${entity.id}"]`);
    expect(loadEntities().find((item) => item.id === entity.id).archivedAt).toBeUndefined();

    app.navigate('dashboard');
    expect(cardValues()).toEqual(['1', '1', '1', '100%', '$0']);
  });

  it('bloquea la eliminación con registros vinculados y ofrece archivar', async () => {
    await signIn('gerente');
    const entity = createEntity('Cliente Con Historial');
    addDocument({ entity_id: entity.entity_id, status: 'pendiente' });
    mount();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    app.navigate('search');
    click(`[data-action="delete-entity"][data-id="${entity.id}"]`);

    expect(confirmSpy).toHaveBeenCalledWith(
      expect.stringContaining('No se puede eliminar este cliente')
    );
    expect(confirmSpy.mock.calls[0][0]).toContain('1 registros vinculados');
    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(loadEntities().find((item) => item.id === entity.id).archivedAt).toBeTruthy();
    expect(loadDocuments()).toHaveLength(1);

    await logout();
    await signIn('ventas');
    expect(() => deleteEntity(entity.id)).toThrow(MESSAGES.permissionDenied);
    expect(loadEntities().find((item) => item.id === entity.id).archivedAt).toBeTruthy();
  });

  it('pide confirmación antes de eliminar definitivamente un cliente sin registros', async () => {
    await signIn('gerente');
    const entity = createEntity('Cliente Sin Historial');
    mount();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    app.navigate('search');
    click(`[data-action="delete-entity"][data-id="${entity.id}"]`);
    expect(loadEntities().some((item) => item.id === entity.id)).toBe(true);

    confirmSpy.mockReturnValue(true);
    click(`[data-action="delete-entity"][data-id="${entity.id}"]`);
    expect(loadEntities().some((item) => item.id === entity.id)).toBe(false);
  });

  it('oculta las acciones de ciclo de vida a roles sin entity:delete y las rechaza en storage', async () => {
    const entity = createEntity('Cliente De Ventas');
    await signIn('ventas');
    mount();

    app.navigate('search');
    expect(document.querySelector('[data-action="archive-entity"]')).toBeNull();
    expect(document.querySelector('[data-action="restore-entity"]')).toBeNull();
    expect(document.querySelector('[data-action="delete-entity"]')).toBeNull();
    expect(() => archiveEntity(entity.id)).toThrow(MESSAGES.permissionDenied);
    expect(loadEntities().find((item) => item.id === entity.id).archivedAt).toBeUndefined();
  });

  it('gestiona archivar y restaurar desde la tabla Acciones del panel de gestión', async () => {
    await signIn('gerente');
    const entity = createEntity('Cliente Desde Gestion');
    mount();

    app.navigate('manage-entity');
    const table = document.querySelector('.client-management-table');
    expect([...table.querySelectorAll('th')].map((th) => th.textContent)).toContain('Acciones');
    const row = [...table.querySelectorAll('.client-management-row')].find((item) =>
      item.textContent.includes('Cliente Desde Gestion')
    );
    expect(row?.querySelector('[data-action="edit-entity"]')).toBeTruthy();
    expect(row?.querySelector('[data-action="archive-entity"]')).toBeTruthy();
    expect(row?.querySelector('[data-action="delete-entity"]')).toBeTruthy();

    click(`.client-management-table [data-action="archive-entity"][data-id="${entity.id}"]`);
    expect(loadEntities().find((item) => item.id === entity.id).archivedAt).toBeTruthy();
    expect(document.querySelector('.client-management-table').textContent).not.toContain(
      'Cliente Desde Gestion'
    );

    click('.client-management [data-action="client-status-filter"][data-status="archived"]');
    expect(document.querySelector('.client-management-table').textContent).toContain(
      'Cliente Desde Gestion'
    );
    click(`.client-management-table [data-action="restore-entity"][data-id="${entity.id}"]`);
    expect(loadEntities().find((item) => item.id === entity.id).archivedAt).toBeUndefined();
  });

  it('oculta archivar, restaurar y eliminar en la tabla de gestión de ventas', async () => {
    await signIn('gerente');
    createEntity('Cliente Sin Permisos Gestion');
    await logout();
    await signIn('ventas');
    mount();

    app.navigate('manage-entity');
    const table = document.querySelector('.client-management-table');
    expect(table).toBeTruthy();
    expect([...table.querySelectorAll('th')].map((th) => th.textContent)).toContain('Acciones');
    expect(table.querySelector('[data-action="archive-entity"]')).toBeNull();
    expect(table.querySelector('[data-action="restore-entity"]')).toBeNull();
    expect(table.querySelector('[data-action="delete-entity"]')).toBeNull();
  });

  it('confirma antes de eliminar definitivamente desde la tabla de gestión', async () => {
    await signIn('gerente');
    const entity = createEntity('Cliente Eliminable Gestion');
    mount();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    app.navigate('manage-entity');
    click(`.client-management-table [data-action="delete-entity"][data-id="${entity.id}"]`);
    expect(confirmSpy).toHaveBeenCalledWith('¿Eliminar este cliente?');
    expect(loadEntities().some((item) => item.id === entity.id)).toBe(true);

    confirmSpy.mockReturnValue(true);
    click(`.client-management-table [data-action="delete-entity"][data-id="${entity.id}"]`);
    expect(loadEntities().some((item) => item.id === entity.id)).toBe(false);
  });

  it('abre la ficha rápida desde gestión sin modificar los registros', async () => {
    await signIn('gerente');
    const entity = createEntity('Cliente Consulta Rápida');
    mount();
    const snapshot = localStorage.getItem('erp_entities');

    app.navigate('manage-entity');
    click(`[data-action="open-client-quick-view"][data-entity-id="${entity.entity_id}"]`);

    expect(document.querySelector('#client-quick-view')).toBeTruthy();
    expect(localStorage.getItem('erp_entities')).toBe(snapshot);
  });
});
