import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import { computeDashboardChartData } from '../../src/utils/dashboard-chart-data.js';
import { computeDashboardStats } from '../../src/utils/marketing-stats.js';
import { MODULE_CONFIG } from '../../src/module-config.js';

function activeEntity(overrides = {}) {
  return {
    entity_id: 'ent-1',
    name: 'Cliente activo',
    estado_comercial: 'cliente',
    ...overrides,
  };
}

function documentRecord(overrides = {}) {
  return {
    id: 'doc-1',
    entity_id: 'ent-1',
    status: 'prospecto',
    ...overrides,
  };
}

describe('computeDashboardChartData (T267)', () => {
  it('deriva las series exclusivamente de registros almacenados', () => {
    const entities = [
      activeEntity({ entity_id: 'ent-1', estado_comercial: 'cliente' }),
      activeEntity({ entity_id: 'ent-2', estado_comercial: 'prospecto', campaña: 'Campaña A' }),
      activeEntity({ entity_id: 'ent-3', estado_comercial: 'prospecto' }),
      activeEntity({ entity_id: 'ent-4', estado_comercial: 'prospecto', archivedAt: '2026-01-02' }),
    ];
    const documents = [
      documentRecord({
        id: 'sale-1',
        entity_id: 'ent-1',
        status: 'Cerrado Ganado',
        startDate: '2026-10-15',
        importe: 500,
      }),
      documentRecord({
        id: 'sale-2',
        entity_id: 'ent-1',
        status: 'cerrado ganado',
        startDate: '2026-10-20',
        importe: 250,
      }),
      documentRecord({
        id: 'sale-3',
        entity_id: 'ent-2',
        status: 'cerrado ganado',
        startDate: '2026-11-02',
        importe: 100,
      }),
      documentRecord({
        id: 'sale-archived',
        entity_id: 'ent-4',
        status: 'cerrado ganado',
        startDate: '2026-11-03',
        importe: 9999,
      }),
      documentRecord({ id: 'ticket-1', status: 'Abierto', ticket: true }),
      documentRecord({ id: 'ticket-2', status: 'en revision', ticket: true }),
      documentRecord({ id: 'ticket-3', status: 'Resuelto', ticket: true }),
      documentRecord({ id: 'ticket-4', status: 'Abierto', ticket: true }),
      documentRecord({ id: 'ticket-dup', status: 'Abierto', ticket: true }),
      documentRecord({ id: 'ticket-dup', status: 'Abierto', ticket: true }),
      documentRecord({
        id: 'ticket-archived',
        entity_id: 'ent-4',
        status: 'Abierto',
        ticket: true,
      }),
      documentRecord({ id: 'not-ticket', status: 'Abierto' }),
    ];

    const data = computeDashboardChartData({ entities, documents, config: MODULE_CONFIG });

    expect(data.salesByMonth).toEqual([
      { mes: '2026-10', ingresos: 750, negocios: 2 },
      { mes: '2026-11', ingresos: 100, negocios: 1 },
    ]);
    expect(data.ticketsByStatus).toEqual([
      { estado: 'Abierto', total: 3 },
      { estado: 'En revisión', total: 1 },
      { estado: 'Resuelto', total: 1 },
    ]);
    expect(data.leadsByCampaign).toEqual([
      { campana: 'Campaña A', leads: 1 },
      { campana: 'Sin campaña', leads: 1 },
    ]);
  });

  it('reutiliza el embudo de computeDashboardStats sin registros archivados', () => {
    const entities = [
      activeEntity({ entity_id: 'ent-1' }),
      activeEntity({ entity_id: 'ent-2', archivedAt: '2026-01-02' }),
    ];
    const documents = [
      documentRecord({ id: 'doc-1', entity_id: 'ent-1', status: 'prospecto' }),
      documentRecord({ id: 'doc-2', entity_id: 'ent-2', status: 'cerrado ganado' }),
    ];
    const expected = computeDashboardStats({
      entities: [entities[0]],
      documents: [documents[0]],
      config: MODULE_CONFIG,
    }).funnel;

    const data = computeDashboardChartData({ entities, documents, config: MODULE_CONFIG });

    expect(data.funnel).toEqual(expected);
    expect(data.funnel.find((step) => step.status === 'cerrado ganado').count).toBe(0);
  });

  it('no importa mockData.js ni muta las entradas', () => {
    const entities = [
      activeEntity({ entity_id: 'ent-1', estado_comercial: 'prospecto', campaña: 'Campaña A' }),
    ];
    const documents = [
      documentRecord({
        id: 'sale-1',
        entity_id: 'ent-1',
        status: 'cerrado ganado',
        startDate: '2026-10-15',
        importe: 500,
      }),
      documentRecord({ id: 'ticket-1', status: 'Abierto', ticket: true }),
    ];
    const entitiesBefore = JSON.parse(JSON.stringify(entities));
    const documentsBefore = JSON.parse(JSON.stringify(documents));

    computeDashboardChartData({ entities, documents, config: MODULE_CONFIG });

    expect(entities).toEqual(entitiesBefore);
    expect(documents).toEqual(documentsBefore);
    const source = readFileSync(
      resolve(process.cwd(), 'src/utils/dashboard-chart-data.js'),
      'utf8'
    );
    expect(source).not.toContain('mockData.js');
  });

  it('devuelve series vacías cuando no hay registros válidos', () => {
    const data = computeDashboardChartData({ entities: [], documents: [], config: MODULE_CONFIG });

    expect(data.salesByMonth).toEqual([]);
    expect(data.ticketsByStatus).toEqual([]);
    expect(data.leadsByCampaign).toEqual([]);
    expect(data.funnel.every((step) => step.count === 0)).toBe(true);
  });
});
