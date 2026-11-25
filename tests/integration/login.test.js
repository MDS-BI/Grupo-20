import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initApp } from '../../src/app.js';
import { signIn, seedAuth } from '../helpers/auth-session.js';
import { deactivateUser, listUsers, updateUser } from '../../src/auth.js';

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

  it.each([
    ['gerente', 'Nivel 4 - Gerente Comercial'],
    ['marketing', 'Nivel 3 - Ejecutivo de Marketing'],
    ['ventas', 'Nivel 2 - Ejecutivo de Ventas'],
    ['atencion', 'Nivel 1 - Atencion al Cliente'],
  ])('%s inicia sesión con una contraseña cualquiera', async (username, rankLabel) => {
    mount();
    await submitLogin(`  ${username.toUpperCase()}  `, `clave-${username}-cualquiera`);

    await vi.waitFor(() => expect(app.getState().currentUser?.username).toBe(username));
    expect(document.querySelector('#current-user').textContent).toBe(username);
    expect(document.querySelector('#current-rank').textContent).toBe(rankLabel);
    expect(document.querySelector('.user-meta')).toBeTruthy();
    expect(document.querySelector('#login-form')).toBeNull();
    expect(localStorage.getItem('erp_session')).toBeTruthy();

    click('[data-action="logout"]');
    await vi.waitFor(() => expect(document.querySelector('.login-view')).toBeTruthy());
    expect(localStorage.getItem('erp_session')).toBeNull();
    expect(document.querySelector('.user-meta')).toBeNull();
  });

  it('el menú de gerente ofrece Gestionar usuarios y Cerrar sesión', async () => {
    mount();
    await submitLogin('gerente', 'clave-cualquiera');

    await vi.waitFor(() => expect(app.getState().currentUser?.username).toBe('gerente'));
    const menu = document.querySelector('.user-meta');
    expect(menu.textContent).toContain('Gestionar usuarios');
    expect(menu.textContent).toContain('Cerrar sesión');
  });

  it('rechaza la contraseña vacía con el mensaje exacto y no crea sesión', async () => {
    mount();
    await submitLogin('gerente', '');

    await vi.waitFor(() =>
      expect(document.querySelector('#login-message').textContent).toBe('Ingresa una contraseña')
    );
    expect(document.querySelector('.user-meta')).toBeNull();
    expect(document.querySelector('.dashboard')).toBeNull();
    expect(localStorage.getItem('erp_session')).toBeNull();
  });

  it('rechaza un usuario inexistente con el mensaje exacto y no crea sesión', async () => {
    mount();
    await submitLogin('desconocido', 'clave-cualquiera');

    await vi.waitFor(() =>
      expect(document.querySelector('#login-message').textContent).toBe('Usuario no encontrado')
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

    await submitLogin('gerente', 'clave-cualquiera');
    await vi.waitFor(() => expect(document.querySelector('.commercial-summary')).toBeTruthy());
    expect(window.location.search).toBe('?view=summary');
  });

  it('la ruta del resumen se conserva en recarga y en Back/Forward', async () => {
    setSearch('?view=summary');
    mount();
    await submitLogin('gerente', 'clave-cualquiera');
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
    await signIn('gerente');
    const first = mount();
    expect(document.querySelector('#current-user').textContent).toBe('gerente');

    first.destroy();
    app = mount();
    expect(document.querySelector('#current-user').textContent).toBe('gerente');
    expect(document.querySelector('#current-rank').textContent).toBe('Nivel 4 - Gerente Comercial');
    expect(document.querySelector('.login-view')).toBeNull();
  });

  it('desactivar ventas con sesión activa redirige a login en la siguiente acción', async () => {
    const user = listUsers().find((candidate) => candidate.usernameKey === 'ventas');
    await signIn('ventas');
    mount();
    expect(document.querySelector('#current-user').textContent).toBe('ventas');

    deactivateUser(user.id);
    app.navigate('search');

    await vi.waitFor(() => expect(document.querySelector('.login-view')).toBeTruthy());
    expect(localStorage.getItem('erp_session')).toBeNull();
    expect(document.querySelector('.user-meta')).toBeNull();
  });

  it('el cambio de rango de ventas se refleja en la barra y los permisos en la siguiente acción', async () => {
    await signIn('ventas');
    mount();
    expect(document.querySelector('#current-rank').textContent).toBe(
      'Nivel 2 - Ejecutivo de Ventas'
    );

    const user = listUsers().find((candidate) => candidate.usernameKey === 'ventas');
    updateUser(user.id, { rank: 'n3_marketing' });
    app.navigate('search');

    expect(document.querySelector('#current-rank').textContent).toBe(
      'Nivel 3 - Ejecutivo de Marketing'
    );
    expect(document.querySelector('[data-action="navigate"][data-view="summary"]')).toBeNull();
    expect(document.querySelector('[data-action="navigate"][data-view="marketing"]')).toBeTruthy();
    expect(document.querySelector('[data-action="navigate"][data-view="users-admin"]')).toBeNull();
  });
});
