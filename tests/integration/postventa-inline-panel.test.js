import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initApp } from '../../src/app.js';
import { logout } from '../../src/auth.js';
import { addEntity, setStorageAuthEnforced } from '../../src/storage.js';
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
  const button = document.querySelector('[data-action="ticket-form"]');
  expect(button).toBeTruthy();
  button.click();
  expect(document.querySelector('#ticket-form')).toBeTruthy();
}

beforeEach(async () => {
  setStorageAuthEnforced(false);
  setSearch('?view=postventa');
  await signIn('gerente');
  addEntity({ name: 'Cliente del panel', code: 'PV-PANEL' });
  logout();
  await signIn('atencion');
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

describe('Panel en línea de Nuevo Ticket (T237)', () => {
  it('abre el formulario en Postventa sin nueva pestaña ni cambio de ruta', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    mount();
    expect(document.querySelector('.client-management-table')).toBeTruthy();

    openPanel();

    expect(openSpy).not.toHaveBeenCalled();
    expect(app.getState().view).toBe('postventa');
    expect(app.getState().ticketFormOpen).toBe(true);
    expect(window.location.search).toBe('?view=postventa');
    expect(document.querySelector('.client-management-table')).toBeNull();
    expect(document.querySelector('.postventa-view')).toBeTruthy();
    expect(document.querySelector('.postventa-view #ticket-form')).toBeTruthy();
    expect(document.querySelector('.postventa-cards')).toBeTruthy();

    document.querySelector('[data-action="cancel-ticket-form"]').click();
    expect(document.querySelector('#ticket-form')).toBeNull();
    expect(document.querySelector('.client-management-table')).toBeTruthy();
    expect(document.querySelector('[data-action="ticket-form"]').textContent).toContain(
      'Nuevo Ticket'
    );
  });

  it('muestra los campos contratados, categorías, prioridades y pistas grises', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/styles.css'), 'utf8');
    expect(css).toMatch(/\.field-hint\s*\{[^}]*color:\s*var\(--text-muted\)/);

    mount();
    openPanel();

    const form = document.querySelector('#ticket-form');
    expect(form.classList.contains('client-form-section')).toBe(true);
    expect([...form.querySelectorAll('.form-field [name]')].map((field) => field.name)).toEqual([
      'entity_id',
      'asunto',
      'categoria',
      'prioridad',
      'status',
      'nota_resolucion',
    ]);
    expect(
      [...document.querySelectorAll('#ticket-categoria option')].map((option) => option.textContent)
    ).toEqual(['-- Selecciona --', 'Soporte técnico', 'Facturación', 'Garantía', 'Consulta']);
    expect(
      [...document.querySelectorAll('#ticket-prioridad option')].map((option) => option.value)
    ).toEqual(['', 'baja', 'media', 'alta']);
    expect(document.querySelector('#ticket-prioridad').value).toBe('');
    expect(form.querySelectorAll('.form-field .field-hint')).toHaveLength(6);
    expect(document.querySelector('#ticket-client-search')).toBeTruthy();
  });
});
