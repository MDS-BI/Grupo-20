import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initApp } from '../../src/app.js';
import { logout } from '../../src/auth.js';
import { signIn } from '../helpers/auth-session.js';

let app = null;

function setSearch(search = '') {
  window.history.replaceState({}, '', `${window.location.pathname}${search}`);
}

function mount() {
  document.body.innerHTML = '<div id="app"></div>';
  app = initApp(document.getElementById('app'), { rawConfig: null, enableAuth: true });
  return app;
}

beforeEach(async () => {
  setSearch('');
  await signIn('atencion');
});

afterEach(() => {
  vi.restoreAllMocks();
  app?.destroy();
  app = null;
  setSearch('');
  logout();
  localStorage.clear();
});

describe('Formulario de ticket en pestaña nueva (T211)', () => {
  it('abre ?view=ticket-form en una pestaña nueva sin desplegar el formulario en Postventa', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    setSearch('?view=postventa');
    mount();

    const button = document.querySelector('[data-action="ticket-form"]');
    expect(button).toBeTruthy();
    button.click();

    expect(openSpy).toHaveBeenCalledWith(
      `${window.location.pathname}?view=ticket-form`,
      '_blank',
      'noopener'
    );
    expect(document.querySelector('#ticket-form')).toBeNull();
    expect(app.getState().view).toBe('postventa');
    expect(app.getState().ticketFormOpen).toBe(false);
  });

  it('renderiza ?view=ticket-form como vista independiente con el formulario completo', () => {
    setSearch('?view=ticket-form');
    mount();

    expect(app.getState().view).toBe('ticket-form');
    expect(window.location.search).toBe('?view=ticket-form');
    expect(document.querySelector('.sidebar')).toBeNull();

    const form = document.querySelector('#ticket-form');
    expect(form).toBeTruthy();
    expect([...form.querySelectorAll('[name]')].map((field) => field.name)).toEqual([
      'entity_id',
      'asunto',
      'categoria',
      'prioridad',
      'status',
      'nota_resolucion',
    ]);
    expect(document.querySelector('#ticket-client-search')).toBeTruthy();
    expect(document.querySelector('#ticket-prioridad').value).toBe('');
    expect(
      [...document.querySelectorAll('#ticket-prioridad option')].map((option) => option.value)
    ).toEqual(['', 'baja', 'media', 'alta']);
  });
});
