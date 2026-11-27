import { describe, expect, it } from 'vitest';
import { computeSearchResults } from '../../src/utils/search.js';

const CONFIG = {
  fieldRules: {
    entity: {
      code: { hidden: true, searchable: false },
      secreto: { hidden: true, searchable: false },
    },
  },
};

function buildEntities() {
  return Array.from({ length: 500 }, (_, index) => ({
    entity_id: `ent-${index + 1}`,
    name: `Cliente ${String(index + 1).padStart(4, '0')}`,
    code: `CLI-${index + 1}`,
    secreto: `Secreto ${index + 1}`,
  }));
}

function buildDocuments(entities) {
  return entities.map((entity, index) => ({
    id: `doc-${index + 1}`,
    entity_id: entity.entity_id,
    notes: `Interacción ${index + 1}`,
    status: 'pendiente',
  }));
}

describe('Búsqueda en una sola pasada con 500 registros', () => {
  it('excluye campos ocultos y encuentra entidades por documento vinculado', () => {
    const entities = buildEntities();
    const documents = buildDocuments(entities);

    const byName = computeSearchResults('cliente 0450', { entities, documents, config: CONFIG });
    expect(byName.entities).toEqual([entities[449]]);

    const byHiddenField = computeSearchResults('CLI-0450', {
      entities,
      documents,
      config: CONFIG,
    });
    expect(byHiddenField.entities).toEqual([]);

    const byDocument = computeSearchResults('interacción 450', {
      entities,
      documents,
      config: CONFIG,
    });
    expect(byDocument.entities).toEqual([entities[449]]);
    expect(byDocument.documents).toEqual([documents[449]]);
  });

  it('normaliza acentos y mayúsculas sin perder coincidencias', () => {
    const entities = [{ entity_id: 'ent-1', name: 'Comercial Andina' }];
    const results = computeSearchResults('COMERCIAL ANDINA', { entities, config: CONFIG });
    expect(results.entities).toEqual(entities);
  });
});
