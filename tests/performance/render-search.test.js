import { describe, expect, it } from 'vitest';
import { MODULE_CONFIG } from '../../src/module-config.js';
import { CANONICAL_SEARCH_KEYS } from '../../src/utils/field-rules.js';
import { computeSummary, searchEntities } from '../../src/storage.js';
import { renderEntityListHtml } from '../../src/components/entity-list.js';
import { renderDocumentListHtml } from '../../src/components/document-list.js';
import { computeDashboardStats } from '../../src/utils/marketing-stats.js';
import { computeMarketingPerformance } from '../../src/utils/marketing-performance.js';

const ENTITY_COUNT = 500;
const DOCUMENT_COUNT = 500;
const SAMPLE_COUNT = 20;
const P95_DESKTOP_MS = 200;
const P95_LOW_END_MS = 500;
const JSDOM_MARGIN = 10;
const DESKTOP_BUDGET_MS = P95_DESKTOP_MS * JSDOM_MARGIN;
const LOW_END_BUDGET_MS = P95_LOW_END_MS * JSDOM_MARGIN;
const STAGES = ['prospecto', 'en_proceso', 'en_recontacto', 'ganado', 'perdido'];

function buildEntities() {
  return Array.from({ length: ENTITY_COUNT }, (_, index) => {
    const number = String(index + 1).padStart(4, '0');
    return {
      id: `e-${number}`,
      entity_id: `ent-${number}`,
      name: `Cliente ${number}`,
      code: `CLI-${number}`,
      category: 'Prueba de carga',
      description: 'Registro sintético',
      targetDate: '1990-01-01',
      estado_comercial: STAGES[index % STAGES.length],
      campaña: `c-${index % 20}`,
      ownerId: 'user-camila-ramirez',
      createdAt: '2026-11-01T00:00:00.000Z',
    };
  });
}

function buildDocuments(entities) {
  return Array.from({ length: DOCUMENT_COUNT }, (_, index) => {
    const number = String(index + 1).padStart(4, '0');
    const isChat = index % 3 === 0;
    return {
      id: `d-${number}`,
      entity_id: entities[index].entity_id,
      startDate: '2026-11-01',
      notes: `Interacción ${number}`,
      status: index % 5 === 0 ? 'cerrado ganado' : 'pendiente',
      importe: (index % 100) + 1,
      campaignId: `c-${index % 20}`,
      canal: isChat ? 'chat' : 'email',
      respondida: isChat,
      respuesta: isChat ? 'Listo' : '',
      createdAt: '2026-11-01T00:00:00.000Z',
    };
  });
}

function p95(values) {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.max(0, Math.ceil((95 / 100) * sorted.length) - 1)];
}

function measure(callback) {
  const startedAt = performance.now();
  const result = callback();
  return { duration: performance.now() - startedAt, result };
}

describe('FR-032 / SC-004: 500 entidades y 500 documentos', () => {
  it('declara los objetivos y el margen explícito del entorno jsdom', () => {
    expect(P95_DESKTOP_MS).toBe(200);
    expect(P95_LOW_END_MS).toBe(500);
    expect(DESKTOP_BUDGET_MS).toBe(2000);
    expect(LOW_END_BUDGET_MS).toBe(5000);
    expect(LOW_END_BUDGET_MS).toBeGreaterThan(DESKTOP_BUDGET_MS);
  });

  it('mantiene búsqueda y render por debajo del presupuesto con 20 muestras', () => {
    const entities = buildEntities();
    const documents = buildDocuments(entities);
    const samples = { search: [], renderEntities: [], renderDocuments: [], dashboard: [] };

    expect(entities).toHaveLength(ENTITY_COUNT);
    expect(documents).toHaveLength(DOCUMENT_COUNT);

    for (let index = 0; index < SAMPLE_COUNT; index += 1) {
      const target = `Cliente ${String(index + 1).padStart(4, '0')}`;
      samples.search.push(
        measure(() =>
          searchEntities(target, {
            entities,
            customFieldKeys: CANONICAL_SEARCH_KEYS.entity,
          })
        ).duration
      );
      samples.renderEntities.push(
        measure(() => renderEntityListHtml(entities, MODULE_CONFIG)).duration
      );
      samples.renderDocuments.push(
        measure(() => renderDocumentListHtml(documents, MODULE_CONFIG)).duration
      );
      samples.dashboard.push(
        measure(() => computeDashboardStats({ entities, documents, config: MODULE_CONFIG }))
          .duration
      );
    }

    for (const [operation, durations] of Object.entries(samples)) {
      const measuredP95 = p95(durations);
      expect(durations).toHaveLength(SAMPLE_COUNT);
      expect(measuredP95, `p95 de ${operation}`).toBeLessThanOrEqual(DESKTOP_BUDGET_MS);
      expect(measuredP95, `p95 de ${operation} en equipo low-end`).toBeLessThanOrEqual(
        LOW_END_BUDGET_MS
      );
    }
  });

  it('calcula derivados y resumen completos sin perder registros', () => {
    const entities = buildEntities();
    const documents = buildDocuments(entities);
    const campaigns = Array.from({ length: 20 }, (_, index) => ({
      id: `c-${index}`,
      name: `Campaña ${index}`,
    }));
    const samples = { performance: [], summary: [] };
    let performanceResult;
    let summaryResult;

    for (let index = 0; index < SAMPLE_COUNT; index += 1) {
      const performanceSample = measure(() =>
        computeMarketingPerformance({ entities, documents, campaigns, campaignId: 'all' })
      );
      const summarySample = measure(() =>
        computeSummary({
          entities,
          documents,
          statusLifecycle: MODULE_CONFIG.statusLifecycle,
        })
      );
      samples.performance.push(performanceSample.duration);
      samples.summary.push(summarySample.duration);
      performanceResult = performanceSample.result;
      summaryResult = summarySample.result;
    }

    expect(performanceResult.totalProspects).toBe(ENTITY_COUNT);
    expect(performanceResult.interactions).toBe(DOCUMENT_COUNT);
    expect(performanceResult.byCampaign).toHaveLength(campaigns.length + 1);
    expect(performanceResult.wonSales).toBe(100);
    expect(summaryResult.totalEntities).toBe(ENTITY_COUNT);
    expect(summaryResult.totalDocuments).toBe(DOCUMENT_COUNT);
    for (const [operation, durations] of Object.entries(samples)) {
      expect(p95(durations), `p95 de ${operation}`).toBeLessThanOrEqual(LOW_END_BUDGET_MS);
    }
  });
});
