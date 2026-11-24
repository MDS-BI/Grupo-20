import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_CONFIG,
  MODULE_CONFIG,
  getConfig,
  setActiveConfig,
} from '../../src/module-config.js';
import { MARKETING_STAGE_LABELS } from '../../src/utils/marketing-stages.js';
import { computeDashboardStats } from '../../src/utils/marketing-stats.js';
import { computeMarketingPerformance } from '../../src/utils/marketing-performance.js';

function sampleEntities() {
  return [
    { entity_id: 'e1', estado_comercial: 'prospecto' },
    { entity_id: 'e2', estado_comercial: 'en_proceso' },
    { entity_id: 'e3', estado_comercial: 'en_recontacto' },
    { entity_id: 'e4', estado_comercial: 'ganado' },
    { entity_id: 'e5', estado_comercial: 'ganado' },
    { entity_id: 'e6', estado_comercial: 'perdido' },
  ];
}

function sampleDocuments() {
  return [
    { id: 'd1', status: 'prospecto', importe: 100 },
    { id: 'd2', status: 'contactado', importe: 200 },
    { id: 'd3', status: 'cerrado ganado', importe: 500 },
    { id: 'd4', status: 'CERRADO GANADO', importe: 250.5 },
    { id: 'd5', canal: 'chat', respondida: true },
    { id: 'd6', canal: 'chat', status: 'respondida' },
    { id: 'd7', canal: 'chat', respuesta: 'Listo' },
    { id: 'd8', canal: 'chat', respuesta: '   ' },
    { id: 'd9', canal: 'email', respondida: true, respuesta: 'Gracias' },
    { id: 'd10', status: 'cerrado perdido', importe: 999 },
  ];
}

function deepFreeze(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

describe('Rendimiento global de Marketing (T116/T119)', () => {
  it('devuelve el contrato completo con los valores globales de prospectos e interacciones', () => {
    const result = computeMarketingPerformance({
      entities: sampleEntities(),
      documents: sampleDocuments(),
    });

    expect(Object.keys(result).sort()).toEqual([
      'answeredQueries',
      'byCampaign',
      'campaignId',
      'conversionRate',
      'hasData',
      'interactions',
      'stageConversions',
      'totalProspects',
      'wonAmount',
      'wonSales',
    ]);
    expect(result.campaignId).toBe('all');
    expect(result.hasData).toBe(true);
    expect(result.totalProspects).toBe(6);
    expect(result.interactions).toBe(10);
    expect(result.wonSales).toBe(2);
    expect(result.wonAmount).toBe(750.5);
    expect(result.answeredQueries).toBe(3);
  });

  it('calcula la conversión por etapa y la tasa de conversión con entidades ganadas', () => {
    const result = computeMarketingPerformance({
      entities: sampleEntities(),
      documents: sampleDocuments(),
    });

    expect(result.stageConversions).toEqual([
      { stage: 'prospecto', label: 'Prospecto', count: 1 },
      { stage: 'en_proceso', label: 'En proceso', count: 1 },
      { stage: 'en_recontacto', label: 'En recontacto', count: 1 },
      { stage: 'ganado', label: 'Cliente ganado', count: 2 },
      { stage: 'perdido', label: 'Perdido', count: 1 },
    ]);
    expect(result.conversionRate).toBeCloseTo((2 / 6) * 100);
  });

  it('cuenta solo consultas de chat respondidas y suma el importe de cerrado ganado', () => {
    const result = computeMarketingPerformance({
      entities: sampleEntities(),
      documents: sampleDocuments(),
    });

    expect(result.answeredQueries).toBe(3);
    expect(result.wonSales).toBe(2);
    expect(result.wonAmount).toBe(750.5);
  });

  it('reutiliza computeDashboardStats para los valores globales compartidos', () => {
    const entities = sampleEntities();
    const documents = sampleDocuments();
    const dashboard = computeDashboardStats({ entities, documents, config: getConfig() });
    const result = computeMarketingPerformance({ entities, documents, campaignId: null });

    expect(result.totalProspects).toBe(dashboard.entityCount);
    expect(result.interactions).toBe(dashboard.documentCount);
    expect(result.wonSales).toBe(dashboard.wonDocuments);
    expect(result.campaignId).toBe('all');
    expect(computeMarketingPerformance({ entities, documents, campaignId: 'all' })).toEqual(result);
  });

  it('devuelve ceros con explicación cuando no hay registros', () => {
    const result = computeMarketingPerformance();

    expect(result).toMatchObject({
      campaignId: 'all',
      hasData: false,
      totalProspects: 0,
      conversionRate: 0,
      interactions: 0,
      answeredQueries: 0,
      wonSales: 0,
      wonAmount: 0,
    });
    expect(result.stageConversions.every((step) => step.count === 0)).toBe(true);
    expect(result.byCampaign).toEqual([
      {
        id: 'none',
        name: 'Sin campaña',
        totalProspects: 0,
        interactions: 0,
        wonSales: 0,
        hasData: false,
      },
    ]);
  });

  it('no muta las entradas ni escribe en localStorage', () => {
    const args = deepFreeze({
      entities: sampleEntities(),
      documents: sampleDocuments(),
      campaigns: [],
    });
    const before = JSON.stringify(args);
    const setItem = vi.spyOn(localStorage, 'setItem');

    computeMarketingPerformance(args);

    expect(JSON.stringify(args)).toBe(before);
    expect(setItem).not.toHaveBeenCalled();
    setItem.mockRestore();
  });
});

describe('Terminología de conversión y estado de documento (T169)', () => {
  beforeEach(() => setActiveConfig(MODULE_CONFIG));
  afterEach(() => setActiveConfig(DEFAULT_CONFIG));

  it('usa ganado como valor interno y Cliente ganado como etiqueta visible', () => {
    expect(MARKETING_STAGE_LABELS.ganado).toBe('Cliente ganado');
    expect(
      MODULE_CONFIG.fieldRules.entity.estado_comercial.options.find(
        (option) => option.value === 'ganado'
      ).label
    ).toBe('Cliente ganado');
    expect(MODULE_CONFIG.statusLifecycle.states).toContain('cerrado ganado');
    expect(MODULE_CONFIG.statusLifecycle.states).not.toContain('ganado');
  });

  it('computa ventas solo desde el estado de documento cerrado ganado', () => {
    const result = computeMarketingPerformance({
      entities: [{ entity_id: 'e1', estado_comercial: 'ganado' }],
      documents: [
        { id: 'd1', status: 'cerrado ganado', importe: 100 },
        { id: 'd2', status: 'ganado', importe: 999 },
      ],
    });

    expect(result.wonSales).toBe(1);
    expect(result.wonAmount).toBe(100);
    expect(result.stageConversions.find((step) => step.stage === 'ganado')).toEqual({
      stage: 'ganado',
      label: 'Cliente ganado',
      count: 1,
    });
    expect(result.conversionRate).toBe(100);
  });

  it('no cuenta una entidad ganada como venta cerrada en el panel', () => {
    const dashboard = computeDashboardStats({
      entities: [{ entity_id: 'e1', estado_comercial: 'ganado' }],
      documents: [{ id: 'd1', status: 'ganado', importe: 999 }],
      config: MODULE_CONFIG,
    });

    expect(dashboard.entityCount).toBe(1);
    expect(dashboard.wonDocuments).toBe(0);
    expect(dashboard.wonAmount).toBe(0);
  });
});
