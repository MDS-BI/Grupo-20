import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { initApp } from '../../src/app.js';
import { listUsers } from '../../src/auth.js';
import { can, assertPermission } from '../../src/auth/permissions.js';
import { DEFAULT_CONFIG, MODULE_CONFIG, setActiveConfig } from '../../src/module-config.js';
import { addEntity, deleteEntity, loadEntities, updateEntity } from '../../src/storage.js';
import { formatRut } from '../../src/utils/field-formats.js';
import { MESSAGES } from '../../src/utils/messages.js';
import { seedAuth, signIn } from '../helpers/auth-session.js';

let app = null;

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

function expectDenied(view) {
  app.navigate(view);
  expect(document.querySelector('#route-notice').textContent, view).toBe(MESSAGES.accessDenied);
  expect(app.getState().view, view).toBe('dashboard');
}

beforeEach(() => {
  seedAuth();
  setActiveConfig(MODULE_CONFIG);
  setSearch('');
});

afterEach(() => {
  app?.destroy();
  app = null;
  setActiveConfig(DEFAULT_CONFIG);
  setSearch('');
  localStorage.clear();
});

describe('Matriz por rango en rutas profundas', () => {
  it('N4 accede a Panel, Buscar, Resumen, Marketing, Postventa y usuarios', async () => {
    await signIn('gerente');
    mount();

    for (const view of [
      'dashboard',
      'search',
      'summary',
      'marketing',
      'postventa',
      'users-admin',
    ]) {
      app.navigate(view);
      expect(app.getState().view, view).toBe(view);
      expect(document.querySelector('#route-notice'), view).toBeNull();
    }
  });

  it('N3 accede a Marketing y Buscar, pero no a Resumen, Postventa ni usuarios', async () => {
    await signIn('marketing');
    mount();

    for (const view of ['search', 'marketing']) {
      app.navigate(view);
      expect(app.getState().view, view).toBe(view);
    }
    for (const view of ['summary', 'postventa', 'users-admin']) expectDenied(view);
  });

  it('N2 accede a su Resumen y Postventa, pero no a Marketing ni usuarios', async () => {
    await signIn('ventas');
    mount();

    for (const view of ['summary', 'postventa']) {
      app.navigate(view);
      expect(app.getState().view, view).toBe(view);
    }
    for (const view of ['marketing', 'users-admin']) expectDenied(view);
  });

  it('N1 accede a Postventa y Buscar, pero no a Resumen, Marketing ni usuarios', async () => {
    await signIn('atencion');
    mount();

    for (const view of ['search', 'postventa']) {
      app.navigate(view);
      expect(app.getState().view, view).toBe(view);
    }
    for (const view of ['summary', 'marketing', 'users-admin']) expectDenied(view);
  });

  it('sin sesión conserva la ruta profunda y muestra la grilla de acceso', () => {
    setSearch('?view=marketing');
    mount();

    expect(app.getState().view).toBe('login');
    expect(app.getState().pendingRoute).toMatchObject({ view: 'marketing' });
    expect(document.querySelectorAll('[data-action="login-user"]')).toHaveLength(4);
    expect(document.querySelector('.sidebar')).toBeNull();
  });
});

describe('Permisos de propiedad y matriz no editable', () => {
  it('N2 no edita ni elimina clientes de otro usuario desde la interfaz ni la capa de datos', async () => {
    const users = listUsers();
    const ventas = users.find((user) => user.usernameKey === 'ventas');
    const gerente = users.find((user) => user.usernameKey === 'gerente');
    await signIn('gerente');
    const other = addEntity({
      name: 'Cliente ajeno',
      code: 'PERM-AJENO',
      ownerId: gerente.id,
      ejecutivo_asignado: gerente.id,
      targetDate: '1980-05-05',
      rut: formatRut(13000120),
      canal_contacto: 'llamada',
      contacto_telefono: '+56 9 1234 5678',
    });
    const own = addEntity({
      name: 'Cliente propio',
      code: 'PERM-PROPIO',
      ownerId: ventas.id,
      ejecutivo_asignado: ventas.id,
      targetDate: '1980-05-05',
      rut: formatRut(13000121),
      canal_contacto: 'llamada',
      contacto_telefono: '+56 9 1234 5678',
    });

    await signIn('ventas');
    mount();
    app.navigate('search');

    expect(document.querySelector(`[data-action="edit-entity"][data-id="${own.id}"]`)).toBeTruthy();
    expect(document.querySelector(`[data-action="edit-entity"][data-id="${other.id}"]`)).toBeNull();
    expect(
      document.querySelector(`[data-action="delete-entity"][data-id="${other.id}"]`)
    ).toBeNull();

    const before = localStorage.getItem('erp_entities');
    expect(() => updateEntity(other.id, { name: 'Manipulado' })).toThrow(MESSAGES.permissionDenied);
    expect(() => deleteEntity(other.id)).toThrow(MESSAGES.permissionDenied);
    expect(localStorage.getItem('erp_entities')).toBe(before);
    expect(loadEntities().find((entity) => entity.id === other.id).name).toBe('Cliente ajeno');
  });

  it('permissions:view es un contrato interno sin interfaz editable', async () => {
    expect(can('n4_manager', 'permissions:view')).toBe(true);
    expect(can('n4_manager', 'permissions:edit')).toBe(false);
    expect(() => assertPermission('n4_manager', 'permissions:edit')).toThrow(
      MESSAGES.permissionDenied
    );

    await signIn('gerente');
    mount();
    app.navigate('users-admin');

    expect(document.querySelector('.users-admin-view')).toBeTruthy();
    expect(document.querySelector('[data-action*="permission"]')).toBeNull();
    expect(
      document.querySelector('input[name^="permission"], select[name^="permission"]')
    ).toBeNull();
  });
});
