import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { initApp } from '../../src/app.js';
import { NAV_ITEMS } from '../../src/components/shell.js';
import { signIn, seedAuth } from '../helpers/auth-session.js';
import { MESSAGES } from '../../src/utils/messages.js';

let app;

function setSearch(search = '') {
  window.history.replaceState({}, '', `${window.location.pathname}${search}`);
}

function mountAs(username) {
  if (username) {
    return signIn(username).then(() => mount());
  }
  document.body.innerHTML = '<div id="app"></div>';
  app = initApp(document.getElementById('app'));
  return Promise.resolve(app);
}

function mount() {
  document.body.innerHTML = '<div id="app"></div>';
  app = initApp(document.getElementById('app'));
  return app;
}

function navViews() {
  return [...document.querySelectorAll('.sidebar-button[data-view]')].map(
    (button) => button.dataset.view
  );
}

function actionKeys() {
  return [...document.querySelectorAll('.dashboard .quick-actions button')].map((button) =>
    button.dataset.action === 'navigate' ? `navigate:${button.dataset.view}` : button.dataset.action
  );
}

describe('Navegación filtrada por rango (T231)', () => {
  beforeEach(() => {
    seedAuth();
    setSearch('');
  });

  afterEach(() => {
    app?.destroy();
    app = null;
    setSearch('');
  });

  it('NAV_ITEMS declara las vistas base y N4 ve las tres acciones rápidas', async () => {
    expect(NAV_ITEMS.map((item) => item.key)).toEqual([
      'dashboard',
      'search',
      'summary',
      'marketing',
      'postventa',
    ]);

    await mountAs('gerente');

    expect(navViews()).toEqual(['dashboard', 'search', 'summary', 'marketing', 'postventa']);
    expect(actionKeys()).toEqual(['quick-manage', 'navigate:manage-document', 'quick-search']);
    expect(
      document.querySelector('[data-action="navigate"][data-view="users-admin"]')
    ).toBeTruthy();
  });

  it('N3 no ve Resumen ni acciones rápidas de gestión', async () => {
    await mountAs('marketing');

    expect(navViews()).not.toContain('summary');
    expect(navViews()).toContain('marketing');
    expect(navViews()).not.toContain('postventa');
    expect(document.querySelector('[data-action="navigate"][data-view="users-admin"]')).toBeNull();
    expect(actionKeys()).toEqual(['quick-search']);
  });

  it('N2 ve las tres acciones rápidas pero no Resumen ni Marketing', async () => {
    await mountAs('ventas');

    expect(navViews()).toContain('dashboard');
    expect(navViews()).toContain('search');
    expect(navViews()).not.toContain('summary');
    expect(navViews()).not.toContain('marketing');
    expect(navViews()).toContain('postventa');
    expect(document.querySelector('[data-action="navigate"][data-view="users-admin"]')).toBeNull();
    expect(actionKeys()).toEqual(['quick-manage', 'navigate:manage-document', 'quick-search']);
  });

  it('N1 solo ve Buscar registros como acción rápida', async () => {
    await mountAs('atencion');

    expect(navViews()).toEqual(['dashboard', 'search', 'postventa']);
    expect(navViews()).not.toContain('summary');
    expect(navViews()).not.toContain('marketing');
    expect(actionKeys()).toEqual(['quick-search']);
    expect(document.querySelector('[data-action="navigate"][data-view="users-admin"]')).toBeNull();
  });

  it('enlaces directos de gestión siguen denegados para N1', async () => {
    for (const view of ['manage-entity', 'manage-document']) {
      app?.destroy();
      setSearch(`?view=${view}`);
      await mountAs('atencion');

      expect(document.querySelector('#route-notice')?.textContent, `?view=${view}`).toBe(
        MESSAGES.accessDenied
      );
      expect(document.querySelector('.manage-view')).toBeNull();
    }
  });

  it('enlaces directos sin permiso muestran Acceso denegado y vuelven al Panel', async () => {
    for (const view of ['summary', 'marketing', 'users-admin']) {
      app?.destroy();
      setSearch(`?view=${view}`);
      await mountAs('atencion');

      expect(document.querySelector('#route-notice')?.textContent, `?view=${view}`).toBe(
        MESSAGES.accessDenied
      );
      expect(document.querySelector('.dashboard')).toBeTruthy();
      expect(document.querySelector('.commercial-summary')).toBeNull();
      expect(document.querySelector('.marketing-view')).toBeNull();
      expect(document.querySelector('.users-admin-view')).toBeNull();
    }
  });

  it('enlaces directos de visitante muestran login, sin controles internos', async () => {
    for (const view of ['summary', 'marketing', 'users-admin']) {
      app?.destroy();
      setSearch(`?view=${view}`);
      await mountAs(null);

      expect(document.querySelector('.login-view'), `?view=${view}`).toBeTruthy();
      expect(document.body.textContent).not.toContain(MESSAGES.accessDenied);
      expect(navViews()).toEqual([]);
      expect(actionKeys()).toEqual([]);
    }
  });
});
