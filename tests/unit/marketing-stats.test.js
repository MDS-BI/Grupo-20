import { describe, expect, it } from 'vitest';
import { computeMarketingStats, categoryForStage } from '../../src/utils/marketing-stats.js';

const entity = (estado_comercial) => ({ estado_comercial });

describe('Estadísticas de Marketing (T091)', () => {
  it('calcula contadores, tasas, embudo y categorías desde las entidades', () => {
    const entities = [
      entity('prospecto'),
      entity('prospecto'),
      entity('en_proceso'),
      entity('en_recontacto'),
      entity('ganado'),
      entity('perdido'),
    ];
    const stats = computeMarketingStats({ entities });
    expect(stats.leadsAnalyzed).toBe(6);
    expect(stats.openOpportunities).toBe(2);
    expect(stats.wonClients).toBe(1);
    expect(stats.lossRate).toBeCloseTo(100 / 6);
    expect(stats.conversionRate).toBeCloseTo(100 / 6);
    expect(stats.funnel.map((step) => step.count)).toEqual([2, 1, 1, 1, 1]);
    expect(stats.funnel[0].rate).toBeCloseTo(200 / 6);
    expect(stats.funnel[1].stepRate).toBe(50);
    expect(stats.categories.reduce((sum, category) => sum + category.count, 0)).toBe(6);
  });

  it('devuelve ceros y las cinco categorías cuando no hay leads', () => {
    const stats = computeMarketingStats({ entities: [] });
    expect(stats.leadsAnalyzed).toBe(0);
    expect(stats.lossRate).toBe(0);
    expect(stats.conversionRate).toBe(0);
    expect(stats.categories).toHaveLength(5);
    expect(stats.categories.every((category) => category.count === 0)).toBe(true);
  });

  it('clasifica cada etapa en una sola categoría y «prospecto» como sin resultado', () => {
    expect(categoryForStage('prospecto').label).toBe('Sin resultados definitivos');
    expect(categoryForStage('ganado').label).toBe('Clientes ganados');
    expect(categoryForStage('perdido').label).toBe('Perdidos');
  });
});
