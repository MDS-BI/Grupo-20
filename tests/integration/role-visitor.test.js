import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initApp } from '../../src/app.js';
import { seedAuth } from '../helpers/auth-session.js';
import {
  addDocument,
  addEntity,
  loadEntities,
  saveDocuments,
  saveEntities,
} from '../../src/storage.js';
import { loadMarketingConfig } from '../../src/storage.js';
import { MESSAGES } from '../../src/utils/messages.js';
import { formatRut } from '../../src/utils/field-formats.js';

let app;

function setSearch(search = '') {
  window.history.replaceState({}, '', `${window.location.pathname}${search}`);
}

function mount() {
  document.body.innerHTML = '<div id="app"></div>';
  app = initApp(document.getElementById('app'));
  return app;
}

function fillCapture(name, rut) {
  const form = document.querySelector('#capture-form');
  form.querySelector('[name="name"]').value = name;
  form.querySelector('[name="rut"]').value = rut;
  form.querySelector('[name="targetDate"]').value = '1980-05-05';
  const canal = form.querySelector('[name="canal_contacto"]');
  canal.value = 'llamada';
  canal.dispatchEvent(new Event('change', { bubbles: true }));
  const fresh = document.querySelector('#capture-form');
  fresh.querySelector('[name="contacto_telefono"]').value = '+56 9 1234 5678';
  fresh.querySelector('[name="consentimiento"]').checked = true;
  fresh.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}

describe('Visitante sin sesión', () => {
  beforeEach(() => {
    seedAuth();
    setSearch('');
  });

  afterEach(() => {
    app?.destroy();
    app = null;
    setSearch('');
  });

  it('la URL raíz sin ?view= redirige a login y no muestra marco ERP', () => {
    mount();

    expect(document.querySelector('.login-view')).toBeTruthy();
    expect(window.location.search).toBe('');
    expect(document.querySelector('.sidebar')).toBeNull();
    expect(document.querySelector('.topbar')).toBeNull();
    expect(document.querySelector('#view-root')).toBeNull();
    expect(document.querySelector('#capture-form')).toBeNull();
    expect(document.querySelector('.quick-actions')).toBeNull();
  });

  it('puede abrir el formulario público ?view=capture sin marco ERP', () => {
    setSearch('?view=capture');
    mount();

    expect(document.querySelector('#capture-form')).toBeTruthy();
    expect(window.location.search).toBe('?view=capture');
    expect(document.querySelector('.sidebar')).toBeNull();
    expect(document.querySelector('.topbar')).toBeNull();
    expect(document.querySelector('.user-meta')).toBeNull();
    expect(document.querySelector('[data-action="navigate"]')).toBeNull();
  });

  it('puede registrar un prospecto con consentimiento desde el formulario público', async () => {
    setSearch('?view=capture');
    mount();
    fillCapture('Visita pública 2026-11-23', formatRut(15000100));

    await vi.waitFor(() => expect(document.querySelector('#capture-confirmation')).toBeTruthy());
    expect(document.querySelector('#capture-confirmation').textContent).toBe(
      'Prospecto registrado correctamente.'
    );
    expect(loadEntities().some((entity) => entity.name === 'Visita pública 2026-11-23')).toBe(true);
  });

  it('puede dejar una consulta en el chat público tras capturar el prospecto', async () => {
    setSearch('?view=capture');
    mount();
    fillCapture('Visita con chat 2026-11-23', formatRut(15000200));
    await vi.waitFor(() => expect(document.querySelector('#capture-confirmation')).toBeTruthy());

    const question = loadMarketingConfig().faq?.[0]?.pregunta || '¿Dónde veo mis interacciones?';
    const chat = document.querySelector('#chat-form');
    expect(chat, 'El chat público debe estar disponible tras la captura').toBeTruthy();
    chat.querySelector('[name="mensaje"]').value = question;
    chat.querySelector('[name="consentimiento"]').checked = true;
    chat.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    await vi.waitFor(() => expect(document.querySelector('.chat-response')).toBeTruthy());
    expect(document.body.textContent).not.toContain(MESSAGES.permissionDenied);
  });

  it('?view=dashboard, ?view=search, ?view=summary y ?view=marketing redirigen a login', () => {
    for (const view of ['dashboard', 'search', 'summary', 'marketing']) {
      setSearch(`?view=${view}`);
      mount();

      expect(
        document.querySelector('.login-view'),
        `?view=${view} debe mostrar login`
      ).toBeTruthy();
      expect(document.querySelector('#view-root')).toBeNull();
      expect(document.querySelector('.sidebar')).toBeNull();
      expect(document.querySelector('[data-action="navigate"]')).toBeNull();
      expect(window.location.search).toBe(view === 'dashboard' ? '' : `?view=${view}`);

      app.destroy();
    }
  });

  it('no expone controles internos de entidades, resumen, marketing, equipo ni usuarios', () => {
    setSearch('?view=capture');
    mount();

    const html = document.getElementById('app').innerHTML;
    expect(html).not.toContain('Resumen');
    expect(html).not.toContain('Marketing');
    expect(html).not.toContain('Equipo de ventas');
    expect(html).not.toContain('Gestionar usuarios');
    expect(document.querySelector('#entity-form')).toBeNull();
    expect(document.querySelector('#document-form')).toBeNull();
    expect(document.querySelector('#team-form')).toBeNull();
    expect(document.querySelector('.commercial-summary')).toBeNull();
    expect(document.querySelector('.users-admin-view')).toBeNull();
  });

  it('la capa de datos rechaza lectura/escritura interna con el mensaje exacto', () => {
    mount();

    expect(() => saveEntities([])).toThrow(MESSAGES.permissionDenied);
    expect(() => saveDocuments([])).toThrow(MESSAGES.permissionDenied);
    expect(() =>
      addEntity({
        name: 'Cliente visitante',
        targetDate: '1980-05-05',
        rut: formatRut(15000300),
        canal_contacto: 'llamada',
        contacto_telefono: '+56 9 1234 5678',
      })
    ).toThrow(MESSAGES.permissionDenied);
    expect(() =>
      addDocument({ entity_id: 'CLI-INEXISTENTE', notes: 'Documento visitante' })
    ).toThrow(MESSAGES.permissionDenied);
  });
});
