import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { initApp } from '../../src/app.js';
import { DEFAULT_CONFIG, MODULE_CONFIG, setActiveConfig } from '../../src/module-config.js';
import { seedAuth } from '../helpers/auth-session.js';

let app = null;

function setSearch(search = '') {
  window.history.replaceState({}, '', `${window.location.pathname}${search}`);
}

function mount(rawConfig = MODULE_CONFIG) {
  document.body.innerHTML = '<div id="app"></div>';
  app = initApp({
    mountElement: document.getElementById('app'),
    rawConfig,
    enableAuth: true,
  });
  return app;
}

beforeEach(() => {
  seedAuth();
  setSearch('');
});

afterEach(() => {
  app?.destroy();
  app = null;
  setActiveConfig(DEFAULT_CONFIG);
  setSearch('');
  localStorage.clear();
});

describe('Tarjeta de acceso del Portal del Cliente', () => {
  it('muestra una tarjeta centrada con botones en dos columnas y enlace discreto', () => {
    mount();

    const card = document.querySelector('.login-card');
    const grid = card?.querySelector('.login-grid');
    const link = card?.querySelector('[data-action="portal-link"]');

    expect(card).toBeTruthy();
    expect(grid).toBeTruthy();
    expect(grid.children.length).toBe(4);
    expect(link?.textContent).toContain('Portal del Cliente');
    expect(link?.getAttribute('href')).toBe('?view=client-portal');
    expect(card.querySelector('input')).toBeNull();
    expect(card.textContent).not.toContain('Contraseña');
    expect(card.textContent).not.toContain('Ingresa una contraseña');
    expect(card.textContent).not.toContain('Usuario no encontrado');
  });

  it('aplica el color de acento configurado a la tarjeta', () => {
    mount();

    expect(document.documentElement.style.getPropertyValue('--accent-color')).toBe('#1D4ED8');
    expect(document.querySelector('.login-card').style.getPropertyValue('--accent-color')).toBe(
      '#1D4ED8'
    );
  });

  it('usa el color integrado y avisa cuando falta el color de acento', () => {
    mount({ ...MODULE_CONFIG, theme: {} });

    expect(document.documentElement.style.getPropertyValue('--accent-color')).toBe('#1D4ED8');
    expect(document.querySelector('#config-warning').textContent).toContain('color de acento');
  });
});
