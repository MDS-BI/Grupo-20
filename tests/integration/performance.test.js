import { describe, it, expect } from 'vitest';
import {
  addEntity,
  addDocument,
  searchEntities,
  computeSummary,
  loadEntities,
  loadDocuments,
} from '../../src/storage.js';
import { renderEntityListHtml } from '../../src/components/entity-list.js';
import { getConfig } from '../../src/module-config.js';

describe('Rendimiento con 500 registros (FR-032, SC-004, T126)', () => {
  it('mantiene la búsqueda y el renderizado de listas correctos y rápidos con 500 entidades y 500 documentos', () => {
    for (let i = 0; i < 500; i += 1) {
      const entity = addEntity({ name: `Entidad ${i}`, code: `E-${i}` });
      addDocument({
        entity_id: entity.entity_id,
        status: i % 3 === 0 ? 'pendiente' : 'completado',
      });
    }

    const entities = loadEntities();
    const documents = loadDocuments();
    const config = getConfig();

    const searchStart = performance.now();
    const uniqueResults = searchEntities('Entidad 499', { entities, documents });
    const partialResults = searchEntities('Entidad 42', { entities, documents });
    const summary = computeSummary({ entities, documents });
    const searchElapsed = performance.now() - searchStart;

    expect(uniqueResults).toHaveLength(1);
    expect(uniqueResults[0].name).toBe('Entidad 499');
    expect(partialResults.map((e) => e.name)).toEqual([
      'Entidad 42',
      'Entidad 420',
      'Entidad 421',
      'Entidad 422',
      'Entidad 423',
      'Entidad 424',
      'Entidad 425',
      'Entidad 426',
      'Entidad 427',
      'Entidad 428',
      'Entidad 429',
    ]);
    expect(summary.totalEntities).toBe(500);
    expect(summary.totalDocuments).toBe(500);
    expect(summary.totalPending).toBe(167);
    expect(searchElapsed).toBeLessThan(500);

    const renderStart = performance.now();
    const listHtml = renderEntityListHtml(entities, config);
    const filteredHtml = renderEntityListHtml(partialResults, config);
    const renderElapsed = performance.now() - renderStart;

    expect(listHtml.match(/class="list-item entity-item"/g)).toHaveLength(500);
    expect(listHtml).toContain('Entidad 0');
    expect(listHtml).toContain('Entidad 499');
    expect(listHtml).toContain('data-entity-id="');
    expect(filteredHtml.match(/class="list-item entity-item"/g)).toHaveLength(11);
    expect(filteredHtml).toContain('Entidad 42');
    expect(filteredHtml).toContain('Entidad 429');
    expect(filteredHtml).not.toContain('Entidad 499');
    expect(renderElapsed).toBeLessThan(500);
  });
});
