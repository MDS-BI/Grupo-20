import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initApp } from '../../src/app.js';
import { logout } from '../../src/auth.js';
import { addEntity, loadDocuments, setStorageAuthEnforced } from '../../src/storage.js';
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

function openPanel() {
  document.querySelector('[data-action="ticket-form"]').click();
  expect(document.querySelector('#ticket-form')).toBeTruthy();
}

function changeAsunto(value) {
  const field = document.querySelector('#ticket-form [name="asunto"]');
  field.value = value;
  field.dispatchEvent(new Event('input', { bubbles: true }));
  field.dispatchEvent(new Event('change', { bubbles: true }));
}

function cancel() {
  document.querySelector('[data-action="cancel-ticket-form"]').click();
}

function hasTicketDraftKey() {
  return Object.keys(localStorage).some((key) => key.toLowerCase().includes('ticket'));
}

beforeEach(async () => {
  setStorageAuthEnforced(false);
  setSearch('?view=postventa');
  await signIn('gerente');
  addEntity({ name: 'Cliente cancelación', code: 'PV-CANCEL' });
  logout();
  await signIn('atencion');
  mount();
  openPanel();
});

afterEach(() => {
  setStorageAuthEnforced(false);
  vi.restoreAllMocks();
  app?.destroy();
  app = null;
  setSearch('');
  logout();
  localStorage.clear();
});

describe('Cancelación del panel en línea de ticket (T240)', () => {
  it('cierra sin confirmar cuando no hay cambios', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    cancel();

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(document.querySelector('#ticket-form')).toBeNull();
    expect(document.querySelector('.client-management-table')).toBeTruthy();
    expect(loadDocuments()).toHaveLength(0);
    expect(hasTicketDraftKey()).toBe(false);
  });

  it('conserva el formulario al rechazar el descarte', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    changeAsunto('Cambio sin guardar');

    cancel();

    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(document.querySelector('#ticket-form')).toBeTruthy();
    expect(document.querySelector('[name="asunto"]').value).toBe('Cambio sin guardar');
    expect(loadDocuments()).toHaveLength(0);
  });

  it('cierra sin crear ticket al aceptar el descarte', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    changeAsunto('Cambio descartado');

    cancel();

    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(document.querySelector('#ticket-form')).toBeNull();
    expect(document.querySelector('.client-management-table')).toBeTruthy();
    expect(loadDocuments()).toHaveLength(0);
    expect(hasTicketDraftKey()).toBe(false);
  });
});
