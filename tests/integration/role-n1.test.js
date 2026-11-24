import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initApp } from '../../src/app.js';
import { logout } from '../../src/auth.js';
import { signIn, seedAuth } from '../helpers/auth-session.js';
import {
  addDocument,
  deleteEntity,
  loadDocuments,
  loadEntities,
  loadMarketingConfig,
  saveEntities,
  saveDocuments,
  updateEntity,
  updateDocument,
} from '../../src/storage.js';
import { MESSAGES } from '../../src/utils/messages.js';
import { formatRut } from '../../src/utils/field-formats.js';
import { localTodayISO } from '../../src/utils/entity-date.js';

let app;
let baseEntity;

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

function submit(selector) {
  const form = document.querySelector(selector);
  expect(form, `No se encontró ${selector}`).toBeTruthy();
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}

function noticeText() {
  return document.querySelector('#route-notice')?.textContent || document.body.textContent;
}

function selectDocumentEntity(entity) {
  const selector = document.querySelector('#document-entity-select');
  selector.value = entity.entity_id;
  selector.dispatchEvent(new Event('change', { bubbles: true }));
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

describe('Permisos de Nivel 1 - Atención al cliente', () => {
  beforeEach(async () => {
    seedAuth();
    baseEntity = {
      id: 'ent-n1-base',
      entity_id: 'CLI-N1-001',
      name: 'Comercial Andina SpA',
      code: 'N1-1',
      targetDate: '1980-05-05',
      rut: formatRut(14000001),
      canal_contacto: 'llamada',
      contacto_telefono: '+56 9 1234 5678',
      ejecutivo_asignado: 'user-pedro-soto',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    saveEntities([baseEntity]);
    saveDocuments([]);
    await signIn('sofia.torres');
    setSearch('');
  });

  afterEach(() => {
    app?.destroy();
    app = null;
    setSearch('');
  });

  it('puede buscar y ver la ficha y el historial de cualquier cliente', async () => {
    addDocument({
      entity_id: baseEntity.entity_id,
      type: 'Llamada',
      notes: 'Historial previo',
      status: 'pendiente',
      startDate: localTodayISO(),
    });
    mount();

    app.navigate('search');
    const input = document.querySelector('#search-input');
    input.value = 'Comercial Andina SpA';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    click('#search-results [data-action="view-entity"]');

    expect(document.querySelector('#entity-detail-title').textContent).toBe('Comercial Andina SpA');
    expect(document.querySelector('.entity-detail').textContent).toContain('Historial previo');
  });

  it('puede registrar interacciones Llamada y Correo en cualquier cliente', async () => {
    mount();
    app.navigate('manage-document');
    selectDocumentEntity(baseEntity);

    const first = document.querySelector('#document-form');
    first.querySelector('[name="type"]').value = 'Llamada';
    first.querySelector('[name="notes"]').value = 'Llamada de soporte';
    submit('#document-form');

    const second = document.querySelector('#document-form');
    second.querySelector('[name="type"]').value = 'Correo';
    second.querySelector('[name="notes"]').value = 'Correo de soporte';
    submit('#document-form');

    const docs = loadDocuments();
    expect(docs.some((doc) => doc.type === 'Llamada' && doc.notes === 'Llamada de soporte')).toBe(
      true
    );
    expect(docs.some((doc) => doc.type === 'Correo' && doc.notes === 'Correo de soporte')).toBe(
      true
    );
  });

  it('puede seguir una consulta de chat sin respuesta', async () => {
    const faqQuestion = loadMarketingConfig().faq?.[0]?.pregunta || '¿Dónde veo mis interacciones?';
    logout();
    setSearch('?view=capture');
    mount();
    fillCapture('Consulta pública N1', formatRut(14000200));

    await vi.waitFor(() => expect(document.querySelector('#capture-confirmation')).toBeTruthy());
    const chat = document.querySelector('#chat-form');
    chat.querySelector('[name="mensaje"]').value = faqQuestion;
    chat.querySelector('[name="consentimiento"]').checked = true;
    submit('#chat-form');

    await vi.waitFor(() => expect(document.querySelector('.chat-response')).toBeTruthy());
    expect(loadDocuments().some((doc) => doc.respuesta)).toBe(true);

    await signIn('sofia.torres');
    app.navigate('search');
    const input = document.querySelector('#search-input');
    input.value = 'Consulta pública N1';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    click('#search-results [data-action="view-entity"]');

    expect(app.getState().role).toBe('n1_support');
    expect(document.querySelector('.entity-detail').textContent).toContain(faqQuestion);
  });

  it('no puede registrar una interacción Reunión', async () => {
    mount();
    app.navigate('manage-document');
    selectDocumentEntity(baseEntity);

    const form = document.querySelector('#document-form');
    form.querySelector('[name="type"]').value = 'Reunión';
    form.querySelector('[name="notes"]').value = 'Reunión no permitida';
    submit('#document-form');

    expect(noticeText()).toContain(MESSAGES.permissionDenied);
    expect(loadDocuments().some((doc) => doc.notes === 'Reunión no permitida')).toBe(false);
  });

  it('no puede cambiar estados de interacciones', async () => {
    const doc = addDocument({
      entity_id: baseEntity.entity_id,
      type: 'Correo',
      notes: 'Correo N1',
      status: 'pendiente',
      startDate: localTodayISO(),
    });
    mount();
    app.navigate('manage-document');
    selectDocumentEntity(baseEntity);
    click(`[data-action="edit-document"][data-id="${doc.id}"]`);

    const form = document.querySelector('#document-form');
    form.querySelector('[name="status"]').value = 'cerrado ganado';
    submit('#document-form');

    expect(noticeText()).toContain(MESSAGES.permissionDenied);
    expect(loadDocuments().find((item) => item.id === doc.id).status).toBe('pendiente');
  });

  it('no ofrece controles para eliminar clientes', async () => {
    mount();
    app.navigate('search');

    expect(
      document.querySelector(`[data-action="delete-entity"][data-id="${baseEntity.id}"]`),
      'N1 no debe ver el botón de eliminar cliente'
    ).toBeNull();
  });

  it('la capa de datos rechaza eliminar y editar clientes con el mensaje exacto', async () => {
    mount();

    expect(() => deleteEntity(baseEntity.id)).toThrow(MESSAGES.permissionDenied);
    expect(() => updateEntity(baseEntity.id, { name: 'Modificado por soporte' })).toThrow(
      MESSAGES.permissionDenied
    );
    expect(loadEntities().find((entity) => entity.id === baseEntity.id).name).toBe(
      'Comercial Andina SpA'
    );
  });

  it('no puede abrir Resumen, Marketing ni Equipo de ventas y logros', async () => {
    mount();

    app.navigate('summary');
    expect(noticeText()).toBe(MESSAGES.accessDenied);
    expect(document.querySelector('.commercial-summary')).toBeNull();

    app.navigate('marketing');
    expect(noticeText()).toBe(MESSAGES.accessDenied);
    expect(document.querySelector('.marketing-view')).toBeNull();
    expect(document.querySelector('.team-totals')).toBeNull();
    expect(document.querySelector('#team-form')).toBeNull();
  });

  it('la capa de datos rechaza escritura directa con el mensaje exacto', async () => {
    mount();
    const originalEntities = localStorage.getItem('erp_entities');
    const originalDocuments = localStorage.getItem('erp_documents');

    expect(() => saveEntities([])).toThrow(MESSAGES.permissionDenied);
    expect(() => saveDocuments([])).toThrow(MESSAGES.permissionDenied);
    expect(() => updateDocument('doc-inexistente', { status: 'cerrado ganado' })).toThrow(
      MESSAGES.permissionDenied
    );
    expect(localStorage.getItem('erp_entities')).toBe(originalEntities);
    expect(localStorage.getItem('erp_documents')).toBe(originalDocuments);
  });
});
