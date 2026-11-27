import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initApp } from '../../src/app.js';
import {
  createUser,
  deactivateUser,
  listUsers,
  SESSION_HOURS,
  updateUser,
} from '../../src/auth.js';
import { seedAuth, signIn } from '../helpers/auth-session.js';

const FORBIDDEN_MESSAGES = ['Ingresa una contraseña', 'Usuario no encontrado'];

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

function userId(usernameKey) {
  const user = listUsers().find((candidate) => candidate.usernameKey === usernameKey);
  expect(user, `No se encontró el usuario ${usernameKey}`).toBeTruthy();
  return user.id;
}

function clickLogin(usernameKey) {
  click(`[data-action="login-user"][data-user-id="${userId(usernameKey)}"]`);
}

function loginButtons() {
  return [...document.querySelectorAll('[data-action="login-user"]')];
}

describe('Inicio de sesión por botones y sesión persistente', () => {
  beforeEach(() => {
    seedAuth();
    setSearch('');
  });

  afterEach(() => {
    app?.destroy();
    app = null;
    setSearch('');
  });

  it('muestra exactamente cuatro botones sin campos de credenciales ni marco ERP', () => {
    mount();

    const buttons = loginButtons();
    expect(buttons.map((button) => button.textContent.trim())).toEqual([
      'Gerente',
      'Marketing',
      'Ventas',
      'Atención al Cliente',
    ]);
    expect(buttons.map((button) => button.dataset.userId)).toEqual([
      'user-gerente',
      'user-marketing',
      'user-ventas',
      'user-atencion',
    ]);
    for (const button of buttons) {
      expect(button.getAttribute('type')).toBe('button');
      expect(button.getAttribute('data-action')).toBe('login-user');
    }
    expect(document.querySelector('#login-form')).toBeNull();
    expect(document.querySelector('#login-username')).toBeNull();
    expect(document.querySelector('#login-password')).toBeNull();
    expect(document.querySelector('input[type="password"]')).toBeNull();
    const labels = [...document.querySelectorAll('label')].map((label) => label.textContent.trim());
    expect(labels).not.toContain('Usuario');
    expect(labels).not.toContain('Contraseña');
    for (const text of FORBIDDEN_MESSAGES) expect(document.body.textContent).not.toContain(text);
    expect(document.querySelector('.sidebar')).toBeNull();
    expect(document.querySelector('.topbar')).toBeNull();
    expect(document.querySelector('#view-root')).toBeNull();
    expect(document.querySelector('.quick-actions')).toBeNull();
    expect(document.body.textContent).not.toContain('Resumen');
  });

  it.each([
    ['gerente', 'Nivel 4 - Gerente Comercial', 'Gerente'],
    ['marketing', 'Nivel 3 - Ejecutivo de Marketing', 'Marketing'],
    ['ventas', 'Nivel 2 - Ejecutivo de Ventas', 'Ventas'],
    ['atencion', 'Nivel 1 - Atencion al Cliente', 'Atención al Cliente'],
  ])('el botón %s inicia sesión con su rango', async (usernameKey, rankLabel, buttonLabel) => {
    mount();
    const button = loginButtons().find((item) => item.textContent.trim() === buttonLabel);
    expect(button).toBeTruthy();
    button.click();

    await vi.waitFor(() => expect(app.getState().currentUser?.username).toBe(usernameKey));
    expect(document.querySelector('#current-user').textContent).toBe(usernameKey);
    expect(document.querySelector('#current-rank').textContent).toBe(rankLabel);
    expect(document.querySelector('.user-meta')).toBeTruthy();
    expect(document.querySelector('.login-view')).toBeNull();
    const session = JSON.parse(localStorage.getItem('erp_session'));
    expect(session.userId).toBe(userId(usernameKey));
    expect(Date.parse(session.expiresAt) - Date.parse(session.issuedAt)).toBe(
      SESSION_HOURS * 60 * 60 * 1000
    );

    click('[data-action="logout"]');
    await vi.waitFor(() => expect(document.querySelector('.login-view')).toBeTruthy());
    expect(localStorage.getItem('erp_session')).toBeNull();
    expect(document.querySelector('.user-meta')).toBeNull();
  });

  it('muestra los usuarios creados detrás de los cuatro semilla', async () => {
    const ana = createUser({ username: 'ana.munoz', rank: 'n2_sales' });
    mount();

    expect(loginButtons().map((button) => button.textContent.trim())).toEqual([
      'Gerente',
      'Marketing',
      'Ventas',
      'Atención al Cliente',
      'ana.munoz',
    ]);
    click(`[data-action="login-user"][data-user-id="${ana.id}"]`);

    await vi.waitFor(() => expect(app.getState().currentUser?.username).toBe('ana.munoz'));
    expect(document.querySelector('#current-rank').textContent).toBe(
      'Nivel 2 - Ejecutivo de Ventas'
    );
  });

  it('no ofrece botón para usuarios desactivados', () => {
    deactivateUser(userId('ventas'));
    mount();

    const buttons = loginButtons();
    expect(buttons.map((button) => button.textContent.trim())).toEqual([
      'Gerente',
      'Marketing',
      'Atención al Cliente',
    ]);
    expect(document.querySelector(`[data-user-id="${userId('ventas')}"]`)).toBeNull();
  });

  it('la sesión se niega al expirar y vuelve a la pantalla de botones', async () => {
    mount();
    clickLogin('gerente');
    await vi.waitFor(() => expect(app.getState().currentUser?.username).toBe('gerente'));
    const session = JSON.parse(localStorage.getItem('erp_session'));

    localStorage.setItem(
      'erp_session',
      JSON.stringify({ ...session, expiresAt: new Date(Date.now() - 1000).toISOString() })
    );
    app.navigate('search');

    await vi.waitFor(() => expect(document.querySelector('.login-view')).toBeTruthy());
    expect(localStorage.getItem('erp_session')).toBeNull();
    expect(loginButtons()).toHaveLength(4);
  });

  it('?view=summary sin sesión redirige a login y restaura el resumen tras elegir usuario', async () => {
    setSearch('?view=summary');
    mount();

    expect(document.querySelector('.login-view')).toBeTruthy();
    expect(app.getState().pendingRoute?.view).toBe('summary');
    clickLogin('gerente');

    await vi.waitFor(() => expect(document.querySelector('.commercial-summary')).toBeTruthy());
    expect(window.location.search).toBe('?view=summary');
  });

  it('la ruta del resumen se conserva en recarga y en Back/Forward', async () => {
    setSearch('?view=summary');
    mount();
    clickLogin('gerente');
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

  it('el menú de gerente ofrece Gestionar usuarios y Cerrar sesión', async () => {
    mount();
    clickLogin('gerente');
    await vi.waitFor(() => expect(app.getState().currentUser?.username).toBe('gerente'));

    const menu = document.querySelector('.user-meta');
    expect(menu.textContent).toContain('Gestionar usuarios');
    expect(menu.textContent).toContain('Cerrar sesión');
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
