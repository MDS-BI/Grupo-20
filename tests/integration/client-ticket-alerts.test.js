import { describe, expect, it } from 'vitest';
import {
  renderClientManagementTableHtml,
  renderEntityListHtml,
} from '../../src/components/entity-list.js';

const CONFIG = { fieldRules: { entity: { code: { hidden: false } } } };
const ENTITY = { id: '1', entity_id: 'e-1', name: 'Acme', code: 'AC-1', targetDate: '1980-01-01' };
const META = {
  'e-1': {
    alertClass: ['open', 'review'],
    alertLabel: ['Ticket abierto', 'Ticket en revisión'],
    canOpenTicket: true,
  },
};

describe('Alertas de tickets en la tabla de clientes (T221)', () => {
  it('muestra ambas alertas con sus clases y el botón de apertura', () => {
    const html = renderClientManagementTableHtml([ENTITY], CONFIG, { ticketMeta: META });
    expect(html).toContain('ticket-alert ticket-alert--open');
    expect(html).toContain('Ticket abierto');
    expect(html).toContain('ticket-alert ticket-alert--review');
    expect(html).toContain('Ticket en revisión');
    expect(html).toContain('data-action="open-ticket" data-entity-id="e-1"');
    expect(html).toContain('>Abrir Ticket</button>');
  });

  it('oculta la columna Código cuando la regla la declara oculta', () => {
    const html = renderClientManagementTableHtml([ENTITY], {
      fieldRules: { entity: { code: { hidden: true } } },
    });
    expect(html).not.toContain('<th scope="col">Código</th>');
    expect(html).not.toContain('>AC-1</td>');
  });

  it('conserva la consulta rápida en modo solo lectura', () => {
    const html = renderEntityListHtml([ENTITY], CONFIG, { readOnly: true, ticketMeta: META });
    expect(html).toContain('data-action="open-client-quick-view" data-entity-id="e-1"');
    expect(html).toContain('data-action="view-entity"');
    expect(html).not.toContain('data-action="edit-entity"');
    expect(html).not.toContain('data-action="archive-entity"');
    expect(html).not.toContain('data-action="delete-entity"');
  });
});
