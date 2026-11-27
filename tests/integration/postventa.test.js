import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initApp } from '../../src/app.js';
import { renderPostventaHtml } from '../../src/components/postventa.js';
import { addEntity, createTicketDocument } from '../../src/storage.js';
import { isTicket } from '../../src/utils/postventa.js';

let app;

function mount() {
  document.body.innerHTML = '<div id="app"></div>';
  app = initApp(document.getElementById('app'), { rawConfig: null });
  return app;
}

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(window, 'open').mockImplementation(() => null);
});

afterEach(() => {
  app?.destroy();
  app = null;
  vi.restoreAllMocks();
});

describe('Postventa integrada (T220)', () => {
  it('mantiene tres tarjetas y sustituye la tabla por el panel en línea', () => {
    mount();
    app.navigate('postventa');
    expect(document.querySelectorAll('.postventa-cards .stat-card')).toHaveLength(3);
    const cards = document.querySelector('.postventa-cards');
    const table = document.querySelector('.client-management-table');
    expect(table).toBeTruthy();

    document.querySelector('[data-action="ticket-form"]').click();
    expect(document.querySelector('.postventa-view #ticket-form')).toBeTruthy();
    expect(document.querySelector('.client-management-table')).toBeNull();
    expect(document.querySelector('.postventa-cards')).toBe(cards);
    expect(window.location.search).toBe('?view=postventa');
    expect(window.open).not.toHaveBeenCalled();
  });

  it('no preselecciona prioridad y condiciona la nota a Resuelto', () => {
    mount();
    app.navigate('postventa');
    document.querySelector('[data-action="ticket-form"]').click();
    const priority = document.getElementById('ticket-prioridad');
    expect(priority.querySelector('option:checked').value).toBe('');
    const note = document.getElementById('ticket-nota').closest('.form-field');
    expect(note.dataset.whenKey).toBe('status');
    expect(note.dataset.whenEquals).toBe('Resuelto');
  });

  it('usa ticket: true como discriminador en la tabla y en las tarjetas', () => {
    const entity = addEntity({ name: 'Con ticket', code: 'PV-1' });
    const ticket = {
      id: 't-1',
      ticket: true,
      entity_id: entity.entity_id,
      status: 'Abierto',
      asunto: 'Falla',
    };
    const plain = { id: 'd-1', entity_id: entity.entity_id, status: 'Abierto', notes: 'No ticket' };
    const html = renderPostventaHtml(null, { tickets: [ticket, plain], clients: [entity] });
    expect(isTicket(ticket)).toBe(true);
    expect(html).toContain('Falla');
    expect(html).not.toContain('No ticket');
    expect(html.match(/class="stat-card"/g)).toHaveLength(3);
    expect(html).toContain('class="stat-value">1</span>');
    expect(createTicketDocument).toBeTypeOf('function');
  });
});
