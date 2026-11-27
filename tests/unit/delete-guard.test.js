import { describe, expect, it } from 'vitest';
import {
  EntityHasRecordsError,
  addDocument,
  addEntity,
  archiveEntity,
  deleteEntity,
  loadDocuments,
  loadEntities,
} from '../../src/storage.js';

describe('Baja definitiva sin cascada (T103)', () => {
  it('rechaza eliminar con registros vinculados y conserva entidad y documentos', () => {
    const entity = addEntity({ name: 'Con historial', code: 'DEL-1' });
    addDocument({ entity_id: entity.entity_id, notes: 'Seguimiento' });

    expect(() => deleteEntity(entity.id)).toThrow(EntityHasRecordsError);
    expect(() => deleteEntity(entity.id)).toThrow(
      'La entidad tiene registros asociados y no se puede eliminar.'
    );
    expect(loadEntities().some((item) => item.id === entity.id)).toBe(true);
    expect(loadDocuments()).toHaveLength(1);
  });

  it('archiva sin borrar documentos y permite la baja cuando ya no hay registros', () => {
    const entity = addEntity({ name: 'Archivable', code: 'DEL-2' });
    addDocument({ entity_id: entity.entity_id, notes: 'Llamada' });
    archiveEntity(entity.id);

    expect(loadEntities().find((item) => item.id === entity.id).archivedAt).toBeTruthy();
    expect(loadDocuments()).toHaveLength(1);
  });
});
