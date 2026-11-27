import { afterEach, describe, expect, it, vi } from 'vitest';
import { initApp } from '../../src/app.js';
import { listUsers } from '../../src/auth.js';
import { seedAuth, signIn } from '../helpers/auth-session.js';

let app = null;

function setSearch(search) {
  window.history.replaceState({}, '', `${window.location.pathname}${search}`);
}

function mount() {
  app = initApp({ mountElement: document.body, rawConfig: null, enableAuth: true });
  return app;
}

afterEach(() => {
  app?.destroy();
  app = null;
  setSearch('');
  localStorage.clear();
});

describe('Navegación por rutas relativas (T168)', () => {
  it('la raíz sin ?view muestra el Panel y no ?view=panel', async () => {
    await signIn('gerente');
    setSearch('');
    const instance = mount();

    expect(instance.getState().view).toBe('dashboard');
    expect(document.querySelector('.dashboard')).toBeTruthy();
    expect(window.location.search).toBe('');

    instance.navigate('dashboard');
    expect(window.location.search).toBe('');

    setSearch('?view=panel');
    instance.destroy();
    mount();

    expect(app.getState().view).toBe('dashboard');
    expect(document.body.textContent).not.toContain('?view=panel');
    expect(window.location.search).toBe('');
  });

  it('conserva el deep link al redirigir a login y lo restaura tras autenticarse', async () => {
    seedAuth();
    setSearch('?view=summary');
    mount();

    expect(app.getState().view).toBe('login');
    expect(app.getState().pendingRoute).toMatchObject({ view: 'summary' });
    expect(window.location.search).toBe('?view=summary');

    const gerente = listUsers().find((user) => user.usernameKey === 'gerente');
    document.querySelector(`[data-action="login-user"][data-user-id="${gerente.id}"]`).click();

    await vi.waitFor(() => expect(app.getState().view).toBe('summary'));
    expect(window.location.search).toBe('?view=summary');
    expect(document.querySelector('#view-root').textContent).toContain('Resumen');
  });

  it('mantiene la ruta al retroceder y avanzar en el historial', async () => {
    await signIn('gerente');
    setSearch('?view=summary');
    mount();

    expect(window.location.search).toBe('?view=summary');

    app.navigate('search');
    expect(window.location.search).toBe('?view=search');

    window.history.back();
    await vi.waitFor(() => expect(app.getState().view).toBe('summary'));
    expect(window.location.search).toBe('?view=summary');

    window.history.forward();
    await vi.waitFor(() => expect(app.getState().view).toBe('search'));
    expect(window.location.search).toBe('?view=search');
  });

  it('reconoce la ruta ?view=capture como pública con autenticación activada', () => {
    seedAuth();
    setSearch('?view=capture');
    mount();

    expect(app.getState().view).toBe('capture');
    expect(document.querySelector('#capture-form')).toBeTruthy();
    expect(window.location.search).toBe('?view=capture');
  });

  it('muestra Acceso denegado y vuelve al Panel en una ruta sin permiso', async () => {
    await signIn('atencion');
    setSearch('?view=summary');
    mount();

    expect(document.querySelector('#route-notice').textContent).toBe('Acceso denegado');
    expect(app.getState().view).toBe('dashboard');
    expect(window.location.search).toBe('');

    app.navigate('users-admin');
    expect(document.querySelector('#route-notice').textContent).toBe('Acceso denegado');
    expect(app.getState().view).toBe('dashboard');
  });
});
