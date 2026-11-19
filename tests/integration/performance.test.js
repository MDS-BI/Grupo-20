import { describe, it, expect } from 'vitest';
import { addEntity, addDocument, searchEntities, computeSummary, loadEntities, loadDocuments } from '../../src/storage.js';

describe('Rendimiento con 500 registros (FR-032, SC-004)', () => {
  it('mantiene la búsqueda y el resumen rápidos con 500 entidades y documentos', () => {
    for (let i = 0; i < 500; i += 1) {
      const entity = addEntity({ name: `Entidad ${i}`, code: `E-${i}` });
      addDocument({ entity_id: entity.entity_id, status: i % 3 === 0 ? 'pendiente' : 'completado' });
    }

    const start = performance.now();
    const results = searchEntities('Entidad 42', { entities: loadEntities(), documents: loadDocuments() });
    const summary = computeSummary({ entities: loadEntities(), documents: loadDocuments() });
    const elapsed = performance.now() - start;

    expect(results.length).toBeGreaterThan(0);
    expect(summary.totalEntities).toBe(500);
    expect(summary.totalDocuments).toBe(500);
    expect(elapsed).toBeLessThan(500);
  });
});
