import { afterEach, describe, expect, it } from 'vitest';
import { initApp } from '../../src/app.js';
import { logout } from '../../src/auth.js';
import { DEFAULT_CONFIG, setActiveConfig } from '../../src/module-config.js';
import { signIn } from '../helpers/auth-session.js';
import {
  addEntity,
  createTicketDocument,
  deleteDocumentsForEntity,
  loadDocuments,
  setStorageAuthEnforced,
} from '../../src/storage.js';

let app = null;

function setSearch(search = '') {
  window.history.replaceState({}, '', `${window.location.pathname}${search}`);
}

function mount() {
  document.body.innerHTML = '<div id="app"></div>';
  app = initApp(document.getElementById('app'), { rawConfig: null });
  return app;
}

function setField(name, value) {
  const field = document.querySelector(`#ticket-form [name="${name}"]`);
  expect(field, `No se encontró ${name}`).toBeTruthy();
  field.value = value;
}

function submitTicket() {
  document
    .getElementById('ticket-form')
    .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}

afterEach(() => {
  setStorageAuthEnforced(false);
  logout();
  app?.destroy();
  app = null;
  setSearch('');
  localStorage.clear();
});

describe('Tickets en la ficha del cliente (T200)', () => {
  it('muestra los campos del ticket y sanea el texto persistido', () => {
    setActiveConfig(DEFAULT_CONFIG);
    const entity = addEntity({ name: 'Cliente con Ticket', code: 'PV-DET' });
    createTicketDocument({
      entity_id: entity.entity_id,
      asunto: '<script>alert(1)</script>',
      categoria: 'facturacion',
      prioridad: 'alta',
      status: 'Resuelto',
      nota_resolucion: '<b>Atendido</b>',
    });

    mount();
    app.navigate('search');
    document.querySelector('[data-action="view-entity"]').click();

    const section = document.querySelector('.entity-detail-postventa');
    expect(section).toBeTruthy();
    expect(section.textContent).toContain('Asunto');
    expect(section.textContent).toContain('Categoría');
    expect(section.textContent).toContain('Prioridad');
    expect(section.textContent).toContain('Estado');
    expect(section.textContent).toContain('Nota de resolución');
    expect(section.innerHTML).not.toContain('<script>');
    expect(section.innerHTML).not.toContain('<b>Atendido</b>');
    expect(JSON.parse(localStorage.getItem('erp_documents'))[0].asunto).toBe(
      '&lt;script&gt;alert(1)&lt;/script&gt;'
    );
  });

  it('rechaza sin prioridad o con Resuelto sin nota y crea el ticket desde ?view=ticket-form', async () => {
    setActiveConfig(DEFAULT_CONFIG);
    await signIn('gerente');
    setStorageAuthEnforced(true);
    const entity = addEntity({ name: 'Cliente Validación', code: 'PV-VAL' });
    logout();
    await signIn('atencion');

    setSearch('?view=postventa');
    document.body.innerHTML = '<div id="app"></div>';
    app = initApp(document.getElementById('app'), { rawConfig: null, enableAuth: true });
    expect(app.getState().view).toBe('postventa');
    document.querySelector('[data-action="ticket-form"]').click();
    expect(app.getState().ticketFormOpen).toBe(true);

    setField('entity_id', entity.entity_id);
    setField('asunto', '<script>alert(1)</script>');
    setField('categoria', 'consulta');
    submitTicket();
    expect(document.querySelector('#ticket-form-error').textContent).toBe(
      'Completa los campos obligatorios.'
    );
    expect(loadDocuments()).toHaveLength(0);

    setField('prioridad', 'media');
    setField('status', 'Resuelto');
    setField('nota_resolucion', '');
    submitTicket();
    expect(document.querySelector('#ticket-form-error').textContent).toBe(
      'Completa los campos obligatorios.'
    );
    expect(loadDocuments()).toHaveLength(0);

    setField('nota_resolucion', 'Nota final');
    submitTicket();
    expect(loadDocuments()).toHaveLength(1);
    expect(loadDocuments()[0].status).toBe('Resuelto');
    expect(app.getState().view).toBe('postventa');
    expect(window.location.search).toBe('?view=postventa');

    app.navigate('search');
    document.querySelector('[data-action="view-entity"]').click();
    const section = document.querySelector('.entity-detail-postventa');
    expect(section.textContent).toContain('Asunto');
    expect(section.textContent).toContain('Categoría');
    expect(section.textContent).toContain('Prioridad');
    expect(section.textContent).toContain('Estado');
    expect(section.textContent).toContain('Nota de resolución');
    expect(section.innerHTML).not.toContain('<script>');
  });

  it('elimina los tickets al eliminar los documentos del cliente', () => {
    setActiveConfig(DEFAULT_CONFIG);
    const entity = addEntity({ name: 'Cliente Cascada', code: 'PV-CAS' });
    createTicketDocument({
      entity_id: entity.entity_id,
      asunto: 'Ticket en cascada',
      categoria: 'garantia',
      prioridad: 'baja',
      status: 'Abierto',
    });
    expect(loadDocuments()).toHaveLength(1);

    deleteDocumentsForEntity(entity.entity_id);
    expect(loadDocuments()).toHaveLength(0);
  });
});
