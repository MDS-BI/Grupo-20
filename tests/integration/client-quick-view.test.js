import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { initApp } from '../../src/app.js';
import { renderClientQuickViewHtml } from '../../src/components/client-quick-view.js';
import { MODULE_CONFIG } from '../../src/module-config.js';
import { addEntity } from '../../src/storage.js';

const CONFIG = {
  customFields: {
    entity: [
      { key: 'contacto_telefono', label: 'Teléfono', type: 'text' },
      { key: 'estado_comercial', label: 'Estado comercial', type: 'text' },
    ],
  },
};

const ENTITY = {
  id: '1',
  entity_id: 'e-1',
  name: 'Cliente <Rápido>',
  targetDate: '1980-01-01',
  contacto_telefono: '+56912345678',
  estado_comercial: 'ganado',
};

const DOCUMENTS = [
  {
    id: 'd-1',
    entity_id: 'e-1',
    status: 'cerrado ganado',
    importe: 120.5,
    startDate: '2026-08-10',
    notes: 'Compra',
  },
  {
    id: 'd-2',
    entity_id: 'e-1',
    status: 'pendiente',
    startDate: '2026-01-01',
    notes: 'Seguimiento',
  },
  { id: 't-1', entity_id: 'e-1', ticket: true, status: 'Abierto', asunto: 'Falla' },
];

let app;

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  app?.destroy();
  app = null;
});

describe('Consulta rápida del cliente (T025)', () => {
  it('renderiza solo lectura con compras USD, fechas, historial y tickets permitidos', () => {
    const html = renderClientQuickViewHtml(ENTITY, DOCUMENTS, CONFIG, {
      tickets: [{ id: 't-1', entity_id: 'e-1', label: 'Ticket abierto', asunto: 'Falla' }],
    });
    expect(html).not.toMatch(/<(input|form|select|textarea)\b/);
    expect(html.match(/<button\b/g)).toHaveLength(2);
    expect(html).toContain('data-action="close-quick-view"');
    expect(html).toContain('>Cerrar</button>');
    expect(html).toContain('data-action="view-entity-full" data-entity-id="e-1"');
    expect(html).toContain('>Ver ficha completa</button>');
    expect(html).toContain('+56912345678');
    expect(html).toContain('$120.50');
    expect(html).toContain('2026-08-10');
    expect(html).toMatch(/2026-01-01[\s\S]*2026-08-10/);
    expect(html).toContain('Ticket abierto');
    expect(html).toContain('&lt;Rápido&gt;');
  });

  it('abre la misma ventana desde Buscar y desde Clientes', () => {
    addEntity({ name: 'Cliente Vinculado', code: 'QV-1' });
    document.body.innerHTML = '<div id="app"></div>';
    app = initApp(document.getElementById('app'), { rawConfig: MODULE_CONFIG });

    app.navigate('search');
    document.querySelector('[data-action="open-client-quick-view"]').click();
    expect(document.querySelector('#client-quick-view')).toBeTruthy();
    document.querySelector('[data-action="close-quick-view"]').click();
    expect(document.querySelector('#client-quick-view')).toBeNull();

    app.navigate('manage-entity');
    document.querySelector('[data-action="open-client-quick-view"]').click();
    expect(document.querySelector('#client-quick-view')).toBeTruthy();
    document.querySelector('[data-action="view-entity-full"]').click();
    expect(document.querySelector('#entity-detail')).toBeTruthy();
  });
});
