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
  return [...document.querySelectorAll('[data-action]')].map((button) => button.dataset.action);
}

describe('Navegación filtrada por rango', () => {
  beforeEach(() => {
    seedAuth();
    setSearch('');
  });

  afterEach(() => {
    app?.destroy();
    app = null;
    setSearch('');
  });

  it('NAV_ITEMS declara las vistas base y N4 ve todas las acciones', async () => {
    expect(NAV_ITEMS.map((item) => item.key)).toEqual([
      'dashboard',
      'search',
      'summary',
      'marketing',
    ]);

    await mountAs('camila.ramirez');

    expect(navViews()).toEqual(['dashboard', 'search', 'summary', 'marketing']);
    const actions = actionKeys();
    expect(actions).toContain('quick-new-entity');
    expect(actions).toContain('quick-new-document');
    expect(actions).toContain('quick-manage');
    expect(actions).toContain('quick-search');
    expect(
      document.querySelector('[data-action="navigate"][data-view="users-admin"]')
    ).toBeTruthy();
  });

  it('N3 no ve Resumen, Gestionar usuarios ni acciones rápidas de gestión de clientes', async () => {
    await mountAs('lucia.fernandez');

    expect(navViews()).not.toContain('summary');
    expect(navViews()).toContain('marketing');
    expect(document.querySelector('[data-action="navigate"][data-view="users-admin"]')).toBeNull();
    const actions = actionKeys();
    expect(actions).not.toContain('quick-new-entity');
    expect(actions).not.toContain('quick-manage');
    expect(actions).toContain('quick-search');
  });

  it('N2 no ve Resumen, Marketing ni Gestionar usuarios', async () => {
    await mountAs('pedro.soto');

    expect(navViews()).toContain('dashboard');
    expect(navViews()).toContain('search');
    expect(navViews()).not.toContain('summary');
    expect(navViews()).not.toContain('marketing');
    expect(document.querySelector('[data-action="navigate"][data-view="users-admin"]')).toBeNull();
  });

  it('N1 solo ve Panel y Buscar, sin acciones rápidas de edición', async () => {
    await mountAs('sofia.torres');

    expect(navViews()).toEqual(['dashboard', 'search']);
    expect(navViews()).not.toContain('summary');
    expect(navViews()).not.toContain('marketing');
    const actions = actionKeys();
    expect(actions).not.toContain('quick-new-entity');
    expect(actions).not.toContain('quick-new-document');
    expect(actions).not.toContain('quick-manage');
    expect(document.querySelector('[data-action="navigate"][data-view="users-admin"]')).toBeNull();
  });

  it('enlaces directos sin permiso muestran Acceso denegado y vuelven al Panel', async () => {
    for (const view of ['summary', 'marketing', 'users-admin']) {
      app?.destroy();
      setSearch(`?view=${view}`);
      await mountAs('sofia.torres');

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
      expect(actionKeys()).not.toContain('quick-new-entity');
      expect(actionKeys()).not.toContain('quick-manage');
    }
  });
});
