import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initApp } from '../../src/app.js';
import { signIn, seedAuth } from '../helpers/auth-session.js';
import {
  DEMO_PASSWORD,
  createUser,
  deactivateUser,
  listUsers,
  updateUser,
} from '../../src/auth.js';

let app;

function setSearch(search = '') {
  window.history.replaceState({}, '', `${window.location.pathname}${search}`);
}

function mount() {
  document.body.innerHTML = '<div id="app"></div>';
  app = initApp(document.getElementById('app'));
  return app;
}

function click(selector) {
  const element = document.querySelector(selector);
  expect(element, `No se encontró ${selector}`).toBeTruthy();
  element.click();
}

async function submitLogin(username, password) {
  const form = document.querySelector('#login-form');
  expect(form, 'Debe existir el formulario de inicio de sesión').toBeTruthy();
  form.querySelector('#login-username').value = username;
  form.querySelector('#login-password').value = password;
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}

async function ensureAna() {
  let ana = listUsers().find((user) => user.usernameKey === 'ana.munoz');
  if (!ana) {
    ana = await createUser({ username: 'ana.munoz', password: DEMO_PASSWORD, rank: 'n2_sales' });
  }
  return ana;
}

describe('Inicio de sesión y sesión persistente', () => {
  beforeEach(() => {
    seedAuth();
    setSearch('');
  });

  afterEach(() => {
    app?.destroy();
    app = null;
    setSearch('');
  });

  it('la raíz sin sesión muestra solo Usuario y Contraseña, sin marco ERP', () => {
    mount();

    expect(document.querySelector('.login-view')).toBeTruthy();
    expect(document.querySelector('label[for="login-username"]').textContent.trim()).toBe(
      'Usuario'
    );
    expect(document.querySelector('label[for="login-password"]').textContent.trim()).toBe(
      'Contraseña'
    );
    expect(document.querySelector('#login-form')).toBeTruthy();
    expect(document.querySelector('.sidebar')).toBeNull();
    expect(document.querySelector('.topbar')).toBeNull();
    expect(document.querySelector('#view-root')).toBeNull();
    expect(document.querySelector('.quick-actions')).toBeNull();
    expect(document.body.textContent).not.toContain('Resumen');
  });

  it('camila.ramirez inicia sesión con nombre, rango, menú de usuario y cierre de sesión', async () => {
    mount();
    await submitLogin('camila.ramirez', DEMO_PASSWORD);

    await vi.waitFor(() => expect(app.getState().currentUser?.username).toBe('camila.ramirez'));
    expect(document.querySelector('#current-user').textContent).toBe('camila.ramirez');
    expect(document.querySelector('#current-rank').textContent).toBe('Nivel 4 - Gerente comercial');
    const menu = document.querySelector('.user-meta');
    expect(menu).toBeTruthy();
    expect(menu.textContent).toContain('Gestionar usuarios');
    expect(menu.textContent).toContain('Cerrar sesión');

    click('[data-action="logout"]');
    await vi.waitFor(() => expect(document.querySelector('.login-view')).toBeTruthy());
    expect(localStorage.getItem('erp_session')).toBeNull();
    expect(document.querySelector('.user-meta')).toBeNull();
  });

  it('un login incorrecto de pedro.soto muestra el mensaje exacto y no crea sesión', async () => {
    mount();
    await submitLogin('pedro.soto', 'clave-incorrecta');

    await vi.waitFor(() =>
      expect(document.querySelector('#login-message').textContent).toBe(
        'Usuario o contraseña incorrectos'
      )
    );
    expect(document.querySelector('.user-meta')).toBeNull();
    expect(document.querySelector('.dashboard')).toBeNull();
    expect(localStorage.getItem('erp_session')).toBeNull();
  });

  it('?view=summary sin sesión redirige a login y restaura el resumen tras autenticarse', async () => {
    setSearch('?view=summary');
    mount();

    expect(document.querySelector('.login-view')).toBeTruthy();
    expect(app.getState().pendingRoute?.view).toBe('summary');

    await submitLogin('camila.ramirez', DEMO_PASSWORD);
    await vi.waitFor(() => expect(document.querySelector('.commercial-summary')).toBeTruthy());
    expect(window.location.search).toBe('?view=summary');
  });

  it('la ruta del resumen se conserva en recarga y en Back/Forward', async () => {
    setSearch('?view=summary');
    mount();
    await submitLogin('camila.ramirez', DEMO_PASSWORD);
    await vi.waitFor(() => expect(document.querySelector('.commercial-summary')).toBeTruthy());

    app.navigate('search');
    expect(window.location.search).toBe('?view=search');
    window.history.back();
    await vi.waitFor(() => expect(document.querySelector('.commercial-summary')).toBeTruthy());
    expect(window.location.search).toBe('?view=summary');

    app.destroy();
    app = mount();
    expect(document.querySelector('.commercial-summary')).toBeTruthy();
    expect(window.location.search).toBe('?view=summary');
  });

  it('recargar o reabrir la aplicación conserva la sesión iniciada', async () => {
    await signIn('camila.ramirez');
    const first = mount();
    expect(document.querySelector('#current-user').textContent).toBe('camila.ramirez');

    first.destroy();
    app = mount();
    expect(document.querySelector('#current-user').textContent).toBe('camila.ramirez');
    expect(document.querySelector('#current-rank').textContent).toBe('Nivel 4 - Gerente comercial');
    expect(document.querySelector('.login-view')).toBeNull();
  });

  it('desactivar pedro.soto con sesión activa redirige a login en la siguiente acción', async () => {
    const pedro = listUsers().find((user) => user.usernameKey === 'pedro.soto');
    await signIn('pedro.soto');
    mount();
    expect(document.querySelector('#current-user').textContent).toBe('pedro.soto');

    deactivateUser(pedro.id);
    app.navigate('search');

    await vi.waitFor(() => expect(document.querySelector('.login-view')).toBeTruthy());
    expect(localStorage.getItem('erp_session')).toBeNull();
    expect(document.querySelector('.user-meta')).toBeNull();
  });

  it('el cambio de rango de ana.munoz se refleja en la barra y los permisos en la siguiente acción', async () => {
    await ensureAna();
    await signIn('ana.munoz');
    mount();
    expect(document.querySelector('#current-rank').textContent).toBe(
      'Nivel 2 - Ejecutivo de Ventas'
    );

    const ana = listUsers().find((user) => user.usernameKey === 'ana.munoz');
    updateUser(ana.id, { rank: 'n3_marketing' });
    app.navigate('search');

    expect(document.querySelector('#current-rank').textContent).toBe(
      'Nivel 3 - Ejecutivo de Marketing'
    );
    expect(document.querySelector('[data-action="navigate"][data-view="summary"]')).toBeNull();
    expect(document.querySelector('[data-action="navigate"][data-view="marketing"]')).toBeTruthy();
    expect(document.querySelector('[data-action="navigate"][data-view="users-admin"]')).toBeNull();
  });
});
