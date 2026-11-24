import { describe, expect, it, vi } from 'vitest';
import { computeMarketingPerformance } from '../../src/utils/marketing-performance.js';

const CAMPAIGNS = [
  { id: 'camp-a', name: 'Reactivación A' },
  { id: 'camp-b', name: 'Captación B' },
  { id: 'camp-c', name: 'Sin registros' },
];

function sampleEntities() {
  return [
    { entity_id: 'e1', estado_comercial: 'prospecto', campaña: 'camp-a' },
    { entity_id: 'e2', estado_comercial: 'ganado', campaignId: 'camp-a' },
    { entity_id: 'e3', estado_comercial: 'en_proceso', campaña: 'camp-b' },
    { entity_id: 'e4', estado_comercial: 'ganado' },
    { entity_id: 'e5', estado_comercial: 'perdido', campaña: '' },
  ];
}

function sampleDocuments() {
  return [
    { id: 'd1', campaña: 'camp-a', status: 'cerrado ganado', importe: 100 },
    { id: 'd2', campaignId: 'camp-a', status: 'contactado', canal: 'chat', respondida: true },
    { id: 'd3', campaña: 'camp-b', status: 'cerrado ganado', importe: 250 },
    { id: 'd4', status: 'cerrado ganado', importe: 75 },
    { id: 'd5', campaignId: '', canal: 'chat', respuesta: 'Hola' },
  ];
}

function args() {
  return { entities: sampleEntities(), documents: sampleDocuments(), campaigns: CAMPAIGNS };
}

describe('Atribución por campaña del rendimiento de Marketing (T117/T119)', () => {
  it('filtra entidades e interacciones por campaña y campaignId', () => {
    const result = computeMarketingPerformance({ ...args(), campaignId: 'camp-a' });

    expect(result.campaignId).toBe('camp-a');
    expect(result.hasData).toBe(true);
    expect(result.totalProspects).toBe(2);
    expect(result.interactions).toBe(2);
    expect(result.stageConversions).toEqual([
      { stage: 'prospecto', label: 'Prospecto', count: 1 },
      { stage: 'en_proceso', label: 'En proceso', count: 0 },
      { stage: 'en_recontacto', label: 'En recontacto', count: 0 },
      { stage: 'ganado', label: 'Cliente ganado', count: 1 },
      { stage: 'perdido', label: 'Perdido', count: 0 },
    ]);
    expect(result.conversionRate).toBe(50);
    expect(result.answeredQueries).toBe(1);
    expect(result.wonSales).toBe(1);
    expect(result.wonAmount).toBe(100);
  });

  it('agrupa los registros sin campaña asignada', () => {
    const result = computeMarketingPerformance({ ...args(), campaignId: 'none' });

    expect(result.campaignId).toBe('none');
    expect(result.hasData).toBe(true);
    expect(result.totalProspects).toBe(2);
    expect(result.interactions).toBe(2);
    expect(result.wonSales).toBe(1);
    expect(result.wonAmount).toBe(75);
    expect(result.answeredQueries).toBe(1);
  });

  it('muestra ceros con hasData en false para una campaña sin registros', () => {
    const result = computeMarketingPerformance({ ...args(), campaignId: 'camp-c' });

    expect(result.campaignId).toBe('camp-c');
    expect(result).toMatchObject({
      hasData: false,
      totalProspects: 0,
      conversionRate: 0,
      interactions: 0,
      answeredQueries: 0,
      wonSales: 0,
      wonAmount: 0,
    });
    expect(result.stageConversions.every((step) => step.count === 0)).toBe(true);
  });

  it('incluye siempre todas las campañas y el grupo Sin campaña en byCampaign', () => {
    const result = computeMarketingPerformance(args());

    expect(result.byCampaign).toEqual([
      {
        id: 'camp-a',
        name: 'Reactivación A',
        totalProspects: 2,
        interactions: 2,
        wonSales: 1,
        hasData: true,
      },
      {
        id: 'camp-b',
        name: 'Captación B',
        totalProspects: 1,
        interactions: 1,
        wonSales: 1,
        hasData: true,
      },
      {
        id: 'camp-c',
        name: 'Sin registros',
        totalProspects: 0,
        interactions: 0,
        wonSales: 0,
        hasData: false,
      },
      {
        id: 'none',
        name: 'Sin campaña',
        totalProspects: 2,
        interactions: 2,
        wonSales: 1,
        hasData: true,
      },
    ]);
    expect(Object.keys(result.byCampaign[2]).sort()).toEqual([
      'hasData',
      'id',
      'interactions',
      'name',
      'totalProspects',
      'wonSales',
    ]);
  });

  it('trata null, all y cadena vacía como vista global', () => {
    const values = args();
    const all = computeMarketingPerformance({ ...values, campaignId: 'all' });
    const none = computeMarketingPerformance({ ...values, campaignId: null });
    const empty = computeMarketingPerformance({ ...values, campaignId: '' });

    expect(none).toEqual(all);
    expect(empty).toEqual(all);
    expect(all.totalProspects).toBe(5);
    expect(all.interactions).toBe(5);
  });

  it('no muta las entradas ni persiste al atribuir campañas', () => {
    const values = args();
    const input = Object.freeze({
      entities: Object.freeze(values.entities.map((entity) => Object.freeze({ ...entity }))),
      documents: Object.freeze(values.documents.map((document) => Object.freeze({ ...document }))),
      campaigns: Object.freeze(CAMPAIGNS.map((campaign) => Object.freeze({ ...campaign }))),
      campaignId: 'camp-a',
    });
    const before = JSON.stringify(input);
    const setItem = vi.spyOn(localStorage, 'setItem');

    computeMarketingPerformance(input);

    expect(JSON.stringify(input)).toBe(before);
    expect(setItem).not.toHaveBeenCalled();
    setItem.mockRestore();
  });
});
