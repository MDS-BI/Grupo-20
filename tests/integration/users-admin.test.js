import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initApp } from '../../src/app.js';
import { signIn, seedAuth } from '../helpers/auth-session.js';
import { deactivateUser, DEMO_PASSWORD, listUsers } from '../../src/auth.js';
import { RANK_OPTIONS } from '../../src/components/users-admin.js';
import { MESSAGES } from '../../src/utils/messages.js';

let app;

function setSearch(search = '') {
  window.history.replaceState({}, '', `${window.location.pathname}${search}`);
}

function mount() {
  document.body.innerHTML = '<div id="app"></div>';
  app = initApp(document.getElementById('app'));
  return app;
}

async function mountAs(username) {
  await signIn(username);
  return mount();
}

function click(selector) {
  const element = document.querySelector(selector);
  expect(element, `No se encontró ${selector}`).toBeTruthy();
  element.click();
}

function submitUserForm({ username, password, rank }) {
  const form = document.querySelector('#user-form');
  expect(form).toBeTruthy();
  form.querySelector('[name="username"]').value = username;
  form.querySelector('[name="password"]').value = password;
  form.querySelector('[name="rank"]').value = rank;
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}

function rankLabel(rank) {
  return RANK_OPTIONS.find(([value]) => value === rank)?.[1] || rank;
}

describe('Gestionar usuarios', () => {
  beforeEach(() => {
    seedAuth();
    setSearch('');
  });

  afterEach(() => {
    app?.destroy();
    app = null;
    setSearch('');
  });

  it('muestra Gestionar usuarios solo en el menú de gerente', async () => {
    await mountAs('gerente');
    expect(
      document.querySelector('[data-action="navigate"][data-view="users-admin"]')
    ).toBeTruthy();

    for (const username of ['marketing', 'ventas', 'atencion']) {
      app.destroy();
      await mountAs(username);
      expect(
        document.querySelector('[data-action="navigate"][data-view="users-admin"]')
      ).toBeNull();
    }
  });

  it('permite abrir la vista y crear ana.munoz con rango Nivel 2', async () => {
    await mountAs('gerente');
    click('[data-action="navigate"][data-view="users-admin"]');
    expect(document.querySelector('.users-admin-view')).toBeTruthy();

    submitUserForm({ username: 'ana.munoz', password: DEMO_PASSWORD, rank: 'n2_sales' });

    await vi.waitFor(() =>
      expect(document.querySelector('.users-admin-view').textContent).toContain('ana.munoz')
    );
    expect(document.querySelector('.users-admin-view').textContent).toContain(
      rankLabel('n2_sales')
    );
    expect(listUsers().find((user) => user.usernameKey === 'ana.munoz')?.rank).toBe('n2_sales');
  });

  it('permite editar el rango de ventas', async () => {
    const pedro = listUsers().find((user) => user.usernameKey === 'ventas');
    await mountAs('gerente');
    app.navigate('users-admin');
    click(`[data-action="edit-user"][data-id="${pedro.id}"]`);

    const form = document.querySelector('#user-form');
    expect(form.querySelector('[name="username"]').value).toBe('ventas');
    form.querySelector('[name="rank"]').value = 'n1_support';
    submitUserForm({ username: 'ventas', password: '', rank: 'n1_support' });

    expect(listUsers().find((user) => user.id === pedro.id).rank).toBe('n1_support');
    expect(document.querySelector('.users-admin-view').textContent).toContain(
      rankLabel('n1_support')
    );
  });

  it('rechaza crear " VENTAS " por duplicado tras normalizar', async () => {
    await mountAs('gerente');
    app.navigate('users-admin');

    submitUserForm({ username: ' VENTAS ', password: DEMO_PASSWORD, rank: 'n4_manager' });

    await vi.waitFor(() => expect(document.querySelector('#users-admin-error')).toBeTruthy());
    expect(document.querySelector('#users-admin-error').textContent).toBe(MESSAGES.required);
    expect(listUsers().filter((user) => user.usernameKey === 'ventas')).toHaveLength(1);
  });

  it('desactivar ventas revoca su sesión activa', async () => {
    const pedro = listUsers().find((user) => user.usernameKey === 'ventas');
    await signIn('ventas');
    const pedroSession = localStorage.getItem('erp_session');
    expect(pedroSession).toBeTruthy();

    app?.destroy();
    await mountAs('gerente');
    app.navigate('users-admin');
    click(`[data-action="deactivate-user"][data-id="${pedro.id}"]`);

    expect(localStorage.getItem('erp_session')).toBeTruthy();
    expect(listUsers().find((user) => user.id === pedro.id).active).toBe(false);
    expect(document.querySelector('.users-admin-view').textContent).toContain('Inactivo');

    localStorage.setItem('erp_session', pedroSession);
    deactivateUser(pedro.id);
    expect(localStorage.getItem('erp_session')).toBeNull();
  });

  it('no expone edición de la matriz de permisos', async () => {
    await mountAs('gerente');
    app.navigate('users-admin');

    expect(document.getElementById('app').innerHTML).toContain(
      'La matriz de permisos se define en el código'
    );
    expect(document.querySelector('[data-action*="permission"]')).toBeNull();
    expect(
      document.querySelector('input[name^="permission"], select[name^="permission"]')
    ).toBeNull();
  });
});
