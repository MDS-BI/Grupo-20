import { describe, expect, it, vi } from 'vitest';
import { computeDashboardStats, computeMarketingStats } from '../../src/utils/marketing-stats.js';

const CONFIG = {
  labels: {
    entity: 'Cliente',
    entityPlural: 'Clientes',
    document: 'Interacción',
    documentPlural: 'Interacciones',
  },
  statusLifecycle: {
    states: ['prospecto', 'contactado', 'en negociacion', 'cerrado ganado', 'cerrado perdido', 'pendiente'],
  },
};

const STAT_KEYS = [
  'conversionRate',
  'documentCount',
  'documentLabel',
  'documentPlural',
  'documents',
  'entities',
  'entityCount',
  'entityLabel',
  'entityPlural',
  'funnel',
  'pipelineTotal',
  'wonDocuments',
];

function sampleData() {
  return {
    entities: [{ id: 'e1' }, { id: 'e2' }, { id: 'e3' }],
    documents: [
      { id: 'd1', status: 'prospecto', importe: 100 },
      { id: 'd2', status: 'contactado', importe: 200 },
      { id: 'd3', status: 'en negociacion', importe: 300 },
      { id: 'd4', status: 'cerrado ganado' },
      { id: 'd5', status: 'CERRADO GANADO' },
      { id: 'd6', status: 'pendiente' },
    ],
    config: CONFIG,
  };
}

describe('Estadísticas compartidas del panel y Marketing (T084/T087)', () => {
  it('devuelve exactamente el contrato de tarjetas, embudo y etiquetas', () => {
    const args = sampleData();
    const stats = computeDashboardStats(args);
    expect(Object.keys(stats).sort()).toEqual(STAT_KEYS);
    expect(stats.entityCount).toBe(3);
    expect(stats.documentCount).toBe(6);
    expect(stats.wonDocuments).toBe(2);
    expect(stats.conversionRate).toBeCloseTo((2 / 3) * 100);
    expect(stats.pipelineTotal).toBe(600);
    expect(stats.entityLabel).toBe('Cliente');
    expect(stats.entityPlural).toBe('Clientes');
    expect(stats.documentLabel).toBe('Interacción');
    expect(stats.documentPlural).toBe('Interacciones');
    expect(stats.funnel).toEqual([
      { status: 'prospecto', label: 'Prospecto', count: 1 },
      { status: 'contactado', label: 'Contactado', count: 1 },
      { status: 'en negociacion', label: 'En negociacion', count: 1 },
      { status: 'cerrado ganado', label: 'Cerrado ganado', count: 2 },
      { status: 'cerrado perdido', label: 'Cerrado perdido', count: 0 },
      { status: 'pendiente', label: 'Pendiente', count: 1 },
    ]);
  });

  it('comparte la misma implementación entre el panel y Marketing sin mutar ni persistir', () => {
    const args = sampleData();
    const setItem = vi.spyOn(localStorage, 'setItem');
    const dashboard = computeDashboardStats(args);
    const marketing = computeMarketingStats(args);
    expect(marketing).toEqual(dashboard);
    expect(marketing.documents).toBe(args.documents);
    expect(marketing.entities).toBe(args.entities);
    expect(args.documents).toHaveLength(6);
    expect(setItem).not.toHaveBeenCalled();
    setItem.mockRestore();
  });

  it('cuenta cada documento una sola vez en el embudo', () => {
    const stats = computeDashboardStats(sampleData());
    expect(stats.funnel.reduce((sum, step) => sum + step.count, 0)).toBe(stats.documentCount);
  });

  it('devuelve ceros y el embudo en cero sin registros', () => {
    const stats = computeDashboardStats({ config: CONFIG });
    expect(stats.entityCount).toBe(0);
    expect(stats.documentCount).toBe(0);
    expect(stats.wonDocuments).toBe(0);
    expect(stats.conversionRate).toBe(0);
    expect(stats.pipelineTotal).toBe(0);
    expect(stats.funnel.every((step) => step.count === 0)).toBe(true);
    expect(stats.documents).toEqual([]);
    expect(stats.entities).toEqual([]);
  });

  it('usa los estados de respaldo cuando la configuración no declara ciclo de vida', () => {
    const stats = computeMarketingStats({ config: null });
    expect(stats.funnel.map((step) => step.status)).toEqual([
      'prospecto',
      'contactado',
      'en negociacion',
      'cerrado ganado',
      'cerrado perdido',
      'pendiente',
    ]);
  });
});
