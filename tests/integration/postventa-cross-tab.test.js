import { afterEach, describe, expect, it } from 'vitest';
import { initApp } from '../../src/app.js';
import { addEntity, createTicketDocument } from '../../src/storage.js';

let app = null;

function setSearch(search = '') {
  window.history.replaceState({}, '', `${window.location.pathname}${search}`);
}

function mount() {
  document.body.innerHTML = '<div id="app"></div>';
  app = initApp(document.getElementById('app'), { rawConfig: null });
  return app;
}

function cardValues() {
  return [...document.querySelectorAll('.postventa-cards .stat-value')].map(
    (element) => element.textContent
  );
}

function tableText() {
  return document.querySelector('.client-management-table').textContent;
}

afterEach(() => {
  app?.destroy();
  app = null;
  setSearch('');
  localStorage.clear();
});

describe('Sincronización de Postventa entre pestañas (T213)', () => {
  it('recalcula tabla y tarjetas con storage de documentos o clave nula, pero no con otras claves', () => {
    const entity = addEntity({ name: 'Cliente sincronizado', code: 'PV-SYNC' });
    setSearch('?view=postventa');
    mount();

    expect(tableText()).toContain('No hay tickets registrados.');
    expect(cardValues()).toEqual(['0', '0', '0']);

    createTicketDocument({
      entity_id: entity.entity_id,
      asunto: 'Ticket externo',
      categoria: 'garantia',
      prioridad: 'media',
      status: 'Abierto',
    });
    window.dispatchEvent(new StorageEvent('storage', { key: 'erp_usuarios' }));

    expect(tableText()).toContain('No hay tickets registrados.');
    expect(cardValues()).toEqual(['0', '0', '0']);

    window.dispatchEvent(new StorageEvent('storage', { key: 'erp_documents' }));

    expect(tableText()).toContain('Ticket externo');
    expect(cardValues()).toEqual(['1', '0', '0']);

    createTicketDocument({
      entity_id: entity.entity_id,
      asunto: 'Ticket en proceso externo',
      categoria: 'consulta',
      prioridad: 'baja',
      status: 'En revisión',
    });
    window.dispatchEvent(new StorageEvent('storage', { key: 'erp_entities' }));

    expect(tableText()).toContain('Ticket en proceso externo');
    expect(cardValues()).toEqual(['1', '1', '0']);

    createTicketDocument({
      entity_id: entity.entity_id,
      asunto: 'Ticket resuelto externo',
      categoria: 'consulta',
      prioridad: 'alta',
      status: 'Resuelto',
      nota_resolucion: 'Resuelto en otra pestaña',
    });
    window.dispatchEvent(new StorageEvent('storage', { key: null }));

    expect(tableText()).toContain('Ticket resuelto externo');
    expect(cardValues()).toEqual(['1', '1', '1']);
  });
});
