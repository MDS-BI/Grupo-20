import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LOST_REASON_OPTIONS } from '../../src/utils/lost-reason.js';
import { setActiveConfig } from '../../src/module-config.js';
import { addDocument, addEntity, loadDocuments } from '../../src/storage.js';
import { computeDashboardStats } from '../../src/utils/marketing-stats.js';
import { computeSalesTeamMetrics } from '../../src/utils/sales-team-metrics.js';

const CONFIG = {
  documentRules: {
    lostReason: {
      status: 'cerrado perdido',
      entityStateField: 'estado_comercial',
      entityState: 'prospecto',
      customField: 'motivo_perdida',
      options: LOST_REASON_OPTIONS,
    },
  },
  customFields: {
    entity: [{ key: 'estado_comercial', label: 'Estado comercial', type: 'text' }],
    document: [{ key: 'motivo_perdida', label: 'Motivo de pérdida', type: 'text' }],
  },
  statusLifecycle: { states: ['pendiente', 'cerrado ganado', 'cerrado perdido'], transitions: {} },
};

beforeEach(() => {
  localStorage.clear();
  setActiveConfig(CONFIG);
});

afterEach(() => {
  setActiveConfig(null);
});

describe('Cierre perdido en almacenamiento (T146/T149)', () => {
  it('rechaza el cambio sin motivo en un prospecto y lo conserva al corregirlo', () => {
    const entity = addEntity({ name: 'Prospecto', code: 'LR-1', estado_comercial: 'prospecto' });
    expect(() => addDocument({ entity_id: entity.entity_id, status: 'cerrado perdido' })).toThrow();
    expect(loadDocuments()).toHaveLength(0);

    const created = addDocument({
      entity_id: entity.entity_id,
      status: 'cerrado perdido',
      motivo_perdida: 'Precio alto',
    });
    expect(created.motivo_perdida).toBe('Precio alto');
  });

  it('no exige motivo a un cliente convertido y no altera ventas ni pendientes', () => {
    const entity = addEntity({ name: 'Convertido', code: 'LR-2', estado_comercial: 'ganado' });
    const created = addDocument({ entity_id: entity.entity_id, status: 'cerrado perdido' });
    expect(created.status).toBe('cerrado perdido');

    const stats = computeDashboardStats({
      entities: [entity],
      documents: [created],
      config: CONFIG,
    });
    const metrics = computeSalesTeamMetrics({
      teams: [{ id: 't1', members: [{ userId: 'u1', name: 'Vendedor' }] }],
      entities: [entity],
      documents: [created],
    });
    expect(stats.pipelineTotal).toBe(0);
    expect(metrics.totals.realMonthly).toBe(0);
    expect(stats.funnel.some((item) => item.status === 'cerrado perdido' && item.count === 1)).toBe(
      true
    );
  });
});
