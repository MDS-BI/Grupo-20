import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect, beforeEach } from 'vitest';
import { initApp } from '../../src/app.js';
import { MODULE_CONFIG } from '../../src/module-config.js';
import { addEntity, addDocument, loadDocuments } from '../../src/storage.js';

let app;

function mount() {
  document.body.innerHTML = '<div id="app"></div>';
  app = initApp(document.getElementById('app'), { rawConfig: MODULE_CONFIG });
  return app;
}

function createClient() {
  return addEntity({
    name: 'Acme',
    code: 'AC-1',
    targetDate: '1980-05-05',
    rut: '11.111.111-1',
    canal_contacto: 'llamada',
    contacto_telefono: '+56912345678',
  });
}

function seedChartRecords() {
  localStorage.setItem(
    'erp_entities',
    JSON.stringify([
      {
        id: 'entity-1',
        entity_id: 'ent-1',
        name: 'Cliente real',
        code: 'AC-1',
        estado_comercial: 'cliente',
        createdAt: '2026-09-01T00:00:00.000Z',
      },
      {
        id: 'entity-2',
        entity_id: 'ent-2',
        name: 'Lead real',
        code: 'AC-2',
        estado_comercial: 'prospecto',
        campaña: 'Campaña A',
        createdAt: '2026-09-02T00:00:00.000Z',
      },
      {
        id: 'entity-3',
        entity_id: 'ent-3',
        name: 'Lead sin campaña',
        code: 'AC-3',
        estado_comercial: 'prospecto',
        createdAt: '2026-09-03T00:00:00.000Z',
      },
    ])
  );
  localStorage.setItem(
    'erp_documents',
    JSON.stringify([
      {
        id: 'sale-1',
        entity_id: 'ent-1',
        status: 'cerrado ganado',
        startDate: '2026-10-10',
        importe: 500,
        createdAt: '2026-10-10T00:00:00.000Z',
      },
      {
        id: 'ticket-1',
        entity_id: 'ent-1',
        status: 'Abierto',
        ticket: true,
        createdAt: '2026-10-11T00:00:00.000Z',
      },
      {
        id: 'ticket-2',
        entity_id: 'ent-2',
        status: 'En revisión',
        ticket: true,
        createdAt: '2026-10-12T00:00:00.000Z',
      },
      {
        id: 'prospect-1',
        entity_id: 'ent-2',
        status: 'prospecto',
        createdAt: '2026-10-13T00:00:00.000Z',
      },
    ])
  );
}

describe('Panel de inicio con tres acciones rápidas (T229/T232)', () => {
  beforeEach(() => mount());

  it('ofrece exactamente tres acciones rápidas en el orden acordado', () => {
    const quickActions = document.querySelector('.dashboard .quick-actions');
    expect(quickActions).toBeTruthy();
    const actions = [...quickActions.querySelectorAll('button')];
    expect(actions).toHaveLength(3);
    expect(
      actions.map((button) =>
        button.dataset.action === 'navigate'
          ? `navigate:${button.dataset.view}`
          : button.dataset.action
      )
    ).toEqual(['quick-manage', 'navigate:manage-document', 'quick-search']);
    expect(document.body.textContent).not.toContain('Abrir Marketing');
    expect(document.body.textContent).not.toContain('Nuevo Cliente');
    expect(document.body.textContent).not.toContain('Nueva interacción');
    expect(document.querySelector('.demo-note')).toBeNull();
    expect(actions.map((button) => button.dataset.variant)).toEqual([
      'primary',
      'secondary',
      'secondary',
    ]);
    expect(actions.map((button) => button.textContent.trim())).toEqual([
      'Gestionar clientes',
      'Gestionar interacciones',
      'Buscar registros',
    ]);
  });

  it('aplica fondo claro, tarjetas elevadas y botones de acciones jerarquizados', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/styles.css'), 'utf8');
    expect(css).toMatch(/--bg:\s*#F8FAFC/i);
    expect(css).toMatch(/--surface:\s*#FFFFFF/i);
    expect(css).toMatch(/--accent-color:\s*#1D4ED8/i);
    expect(css).toMatch(/\.stat-card[^}]*box-shadow:/);
    expect(css).toMatch(/\.quick-actions[^}]*flex-wrap:\s*nowrap/);
    expect(css).toMatch(/\[data-variant=['"]primary['"]\][^}]*var\(--accent-color\)/);
    expect(css).toMatch(/\[data-variant=['"]secondary['"]\][^}]*var\(--surface\)/);
    expect(css).toMatch(/\[data-variant=['"]secondary['"]\][^}]*border:\s*1px solid/);
  });

  it('abre cada acción en su gestión o enfoca la búsqueda', () => {
    createClient();
    app.navigate('dashboard');
    document.querySelector('[data-action="quick-manage"]').click();
    expect(document.querySelector('.manage-view')).toBeTruthy();
    expect(document.querySelector('[data-tab="entity"]').getAttribute('aria-selected')).toBe(
      'true'
    );
    expect(document.getElementById('field-name').value).toBe('');

    app.navigate('dashboard');
    document.querySelector('[data-action="navigate"][data-view="manage-document"]').click();
    expect(document.querySelector('[data-tab="document"]').getAttribute('aria-selected')).toBe(
      'true'
    );
    expect(document.getElementById('document-form')).toBeTruthy();
    expect(document.getElementById('field-notes').value).toBe('');

    app.navigate('dashboard');
    document.querySelector('[data-action="quick-search"]').click();
    expect(document.activeElement.id).toBe('search-input');
  });

  it('muestra los recuentos en cero y los actualiza tras crear registros', () => {
    expect(
      [...document.querySelectorAll('.summary-cards .stat-value')].map((el) => el.textContent)
    ).toEqual(['0', '0', '0', '0%', '$0']);

    const client = createClient();
    addDocument({ entity_id: client.entity_id, status: 'cerrado ganado', importe: 500 });
    app.navigate('dashboard');
    expect(
      [...document.querySelectorAll('.summary-cards .stat-value')].map((el) => el.textContent)
    ).toEqual(['1', '1', '1', '100%', '$0']);
  });
});

describe('Panel visual del resumen con series reales', () => {
  beforeEach(() => mount());

  it('retira las cuatro KPI de demostración y conserva las cinco tarjetas canónicas', () => {
    const panel = document.querySelector('.dashboard-analytics');
    expect(panel).toBeTruthy();
    expect(panel.querySelector('.kpi-grid')).toBeNull();

    for (const label of [
      'Ingresos totales del mes',
      'Clientes activos',
      'Campañas activas',
      'Conversión promedio',
      'Tickets abiertos',
    ]) {
      expect(panel.textContent).not.toContain(label);
    }
    expect(
      [...document.querySelectorAll('.summary-cards .stat-label')].map((el) => el.textContent)
    ).toEqual([
      'Clientes',
      'Interacciones',
      'Cerrado ganado',
      'Tasa de conversión',
      'Pipeline (USD)',
    ]);
  });

  it('muestra cuatro tarjetas con título en la cuadrícula responsiva exacta', () => {
    const cards = [...document.querySelectorAll('.dashboard-analytics .chart-grid .chart-card')];
    expect(cards.map((card) => card.querySelector('h3').textContent)).toEqual([
      'Ventas por mes',
      'Tickets de soporte',
      'Leads generados por campaña',
      'Embudo comercial por estado',
    ]);

    const css = readFileSync(resolve(process.cwd(), 'src/styles.css'), 'utf8');
    expect(css).toMatch(
      /\.chart-grid\s*\{[^}]*grid-template-columns:\s*repeat\(auto-fit,\s*minmax\(320px,\s*1fr\)\)/
    );
    expect(css).not.toMatch(
      /@media \(max-width: 720px\) \{[\s\S]*?\.chart-grid[^}]*grid-template-columns:\s*1fr/
    );
  });

  it('muestra el mensaje exacto para cada serie vacía', () => {
    const cards = [...document.querySelectorAll('.dashboard-analytics .chart-card')];
    expect(cards).toHaveLength(4);
    for (const card of cards) {
      expect(card.textContent).toContain('No hay registros para esta serie.');
    }
    expect(document.body.textContent).not.toContain('Datos de demostración');
  });

  it('alimenta las series con registros almacenados y recalcula tras mutar', () => {
    seedChartRecords();
    app.navigate('dashboard');
    let canvases = [...document.querySelectorAll('.dashboard-analytics canvas[data-chart]')];
    expect(canvases.map((canvas) => canvas.dataset.chart)).toEqual(['sales', 'tickets', 'leads']);
    expect(canvases[0].getAttribute('aria-label')).toContain('2026-10: $500, 1 negocios');
    expect(canvases[1].getAttribute('aria-label')).toContain('Abierto: 1');
    expect(canvases[1].getAttribute('aria-label')).toContain('En revisión: 1');
    expect(canvases[2].getAttribute('aria-label')).toContain('Campaña A: 1 leads');
    expect(canvases[2].getAttribute('aria-label')).toContain('Sin campaña: 1 leads');
    expect(document.body.textContent).not.toContain('$184,500');

    const documents = loadDocuments();
    documents.push({
      id: 'sale-2',
      entity_id: 'ent-1',
      status: 'cerrado ganado',
      startDate: '2026-11-05',
      importe: 250,
      createdAt: '2026-11-05T00:00:00.000Z',
    });
    localStorage.setItem('erp_documents', JSON.stringify(documents));
    app.navigate('dashboard');
    canvases = [...document.querySelectorAll('.dashboard-analytics canvas[data-chart]')];
    expect(canvases[0].getAttribute('aria-label')).toContain('2026-11: $250, 1 negocios');
  });

  it('sanitiza los textos derivados de registros en las etiquetas accesibles', () => {
    localStorage.setItem(
      'erp_entities',
      JSON.stringify([
        {
          id: 'entity-1',
          entity_id: 'ent-1',
          name: 'Lead <img src=x onerror=alert(1)>',
          estado_comercial: 'prospecto',
          campaña: 'Campaña <script>alert(1)</script>',
        },
      ])
    );
    app.navigate('dashboard');

    const panel = document.querySelector('.dashboard-analytics');
    expect(panel.querySelector('img')).toBeNull();
    expect(panel.querySelector('script')).toBeNull();
    const leads = panel.querySelector('canvas[data-chart="leads"]');
    expect(leads.getAttribute('aria-label')).toContain(
      'Campaña <script>alert(1)</script>: 1 leads'
    );
  });

  it('comparte solo el embudo con Marketing desde la misma fuente', () => {
    seedChartRecords();
    app.navigate('marketing');
    const cards = [...document.querySelectorAll('.marketing-view .chart-grid .chart-card')];
    expect(cards.map((card) => card.querySelector('h3').textContent)).toEqual([
      'Embudo comercial por estado',
    ]);
    expect(document.querySelectorAll('.marketing-view .kpi-card')).toHaveLength(0);
    expect(document.querySelectorAll('.marketing-view canvas[data-chart]')).toHaveLength(0);
  });
});
