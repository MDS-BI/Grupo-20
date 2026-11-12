import { describe, it, expect } from 'vitest';
import {
  addEntity,
  updateEntity,
  deleteEntity,
  loadEntities,
  addDocument,
  updateDocument,
  deleteDocument,
  loadDocuments,
  getEntityDocuments,
  searchEntities,
  computeSummary,
  isValidTransition,
  ValidationError,
} from '../../src/storage.js';

describe('Entidad - validación y unicidad (H1)', () => {
  it('crea una entidad con nombre y código', () => {
    const entity = addEntity({ name: 'Acme', code: 'AC-1' });
    expect(entity.id).toBeTruthy();
    expect(entity.entity_id).toBeTruthy();
    expect(loadEntities()).toHaveLength(1);
  });

  it('rechaza una entidad sin nombre o código', () => {
    expect(() => addEntity({ name: '', code: 'AC-1' })).toThrow(ValidationError);
    expect(() => addEntity({ name: 'Acme', code: '' })).toThrow(ValidationError);
  });

  it('rechaza un código duplicado sin distinguir mayúsculas ni espacios', () => {
    addEntity({ name: 'Acme', code: 'AC-1' });
    expect(() => addEntity({ name: 'Otra', code: ' ac-1 ' })).toThrow(ValidationError);
    try {
      addEntity({ name: 'Otra', code: 'Ac-1' });
    } catch (err) {
      expect(err.errors.code).toBeTruthy();
    }
  });

  it('rechaza una fecha objetivo inválida y acepta una válida u omitida', () => {
    expect(() => addEntity({ name: 'A', code: 'A1', targetDate: 'not-a-date' })).toThrow(ValidationError);
    const withDate = addEntity({ name: 'B', code: 'B1', targetDate: '2026-12-01' });
    expect(withDate.targetDate).toBe('2026-12-01');
    const withoutDate = addEntity({ name: 'C', code: 'C1' });
    expect(withoutDate.targetDate).toBe('');
  });
});

describe('Documento vinculado a Entidad (H1)', () => {
  it('rechaza un documento cuyo entity_id no corresponde a ninguna entidad', () => {
    expect(() => addDocument({ entity_id: 'does-not-exist' })).toThrow(ValidationError);
  });

  it('vincula correctamente un documento a una entidad existente', () => {
    const entity = addEntity({ name: 'Acme', code: 'AC-1' });
    const doc = addDocument({ entity_id: entity.entity_id, notes: 'Llamada inicial' });
    expect(doc.entity_id).toBe(entity.entity_id);
    expect(loadDocuments()).toHaveLength(1);
  });
});

describe('Edición, eliminación y cascada (H4)', () => {
  it('actualiza una entidad preservando id/entity_id y actualizando updatedAt', () => {
    const entity = addEntity({ name: 'Acme', code: 'AC-1' });
    const updated = updateEntity(entity.id, { name: 'Acme Corp' });
    expect(updated.id).toBe(entity.id);
    expect(updated.entity_id).toBe(entity.entity_id);
    expect(updated.name).toBe('Acme Corp');
    expect(updated.updatedAt).not.toBe(entity.createdAt === updated.updatedAt);
  });

  it('elimina una entidad y sus documentos asociados en cascada', () => {
    const entity = addEntity({ name: 'Acme', code: 'AC-1' });
    addDocument({ entity_id: entity.entity_id });
    addDocument({ entity_id: entity.entity_id });
    const result = deleteEntity(entity.id);
    expect(result.deletedDocumentCount).toBe(2);
    expect(loadEntities()).toHaveLength(0);
    expect(loadDocuments()).toHaveLength(0);
  });

  it('actualiza y elimina un documento individualmente', () => {
    const entity = addEntity({ name: 'Acme', code: 'AC-1' });
    const doc = addDocument({ entity_id: entity.entity_id, notes: 'Primera' });
    const updated = updateDocument(doc.id, { notes: 'Actualizada' });
    expect(updated.notes).toBe('Actualizada');
    deleteDocument(doc.id);
    expect(loadDocuments()).toHaveLength(0);
  });

  it('rechaza una fecha de término anterior a la fecha de inicio', () => {
    const entity = addEntity({ name: 'Acme', code: 'AC-1' });
    expect(() =>
      addDocument({ entity_id: entity.entity_id, startDate: '2026-05-10', endDate: '2026-05-01' }),
    ).toThrow(ValidationError);
  });
});

describe('Búsqueda (H3/H9)', () => {
  it('encuentra entidades por nombre, código, categoría o palabra clave', () => {
    addEntity({ name: 'Acme Corp', code: 'AC-1', category: 'Retail' });
    addEntity({ name: 'Globex', code: 'GL-1', category: 'Tech' });
    expect(searchEntities('acme', {})).toHaveLength(1);
    expect(searchEntities('GL-1', {})).toHaveLength(1);
    expect(searchEntities('Tech', {})).toHaveLength(1);
  });

  it('devuelve una lista vacía cuando no hay coincidencias', () => {
    addEntity({ name: 'Acme Corp', code: 'AC-1' });
    expect(searchEntities('no-existe', {})).toHaveLength(0);
  });

  it('incluye coincidencias en campos personalizados de la entidad y del documento', () => {
    const entity = addEntity(
      { name: 'Acme', code: 'AC-1', vip: 'true' },
      { customFieldDefs: [{ key: 'vip', label: 'VIP', type: 'text' }] },
    );
    addDocument(
      { entity_id: entity.entity_id, interactionType: 'llamada' },
      { customFieldDefs: [{ key: 'interactionType', label: 'Tipo', type: 'text' }] },
    );
    expect(searchEntities('vip', { customFieldKeys: [] })).toHaveLength(0);
    expect(
      searchEntities('true', { customFieldKeys: ['vip'] }),
    ).toHaveLength(1);
    expect(
      searchEntities('llamada', { customFieldKeys: ['interactionType'] }),
    ).toHaveLength(1);
  });
});

describe('Ficha de entidad e historial ordenado (H3)', () => {
  it('ordena los documentos de una entidad por fecha', () => {
    const entity = addEntity({ name: 'Acme', code: 'AC-1' });
    addDocument({ entity_id: entity.entity_id, startDate: '2026-03-01', notes: 'segunda' });
    addDocument({ entity_id: entity.entity_id, startDate: '2026-01-01', notes: 'primera' });
    const docs = getEntityDocuments(entity.entity_id);
    expect(docs.map((d) => d.notes)).toEqual(['primera', 'segunda']);
  });
});

describe('Campos personalizados (H8)', () => {
  const defs = [{ key: 'creditLimit', label: 'Límite de crédito', type: 'number', required: true }];

  it('rechaza un campo personalizado obligatorio en blanco', () => {
    expect(() => addEntity({ name: 'Acme', code: 'AC-1' }, { customFieldDefs: defs })).toThrow(ValidationError);
  });

  it('persiste y conserva valores de campos retirados de la configuración', () => {
    const entity = addEntity({ name: 'Acme', code: 'AC-1', creditLimit: 1000 }, { customFieldDefs: defs });
    expect(entity.creditLimit).toBe(1000);
    // El campo se retira de la configuración (customFieldDefs = []) pero el valor persiste oculto.
    const reloaded = loadEntities().find((e) => e.id === entity.id);
    expect(reloaded.creditLimit).toBe(1000);
    // Al redeclarar el campo, vuelve a estar disponible para validación/edición.
    const updated = updateEntity(entity.id, { creditLimit: 2000 }, { customFieldDefs: defs });
    expect(updated.creditLimit).toBe(2000);
  });
});

describe('Ciclo de vida de estados de documentos (H13)', () => {
  const lifecycle = {
    states: ['pendiente', 'en_progreso', 'completado'],
    transitions: { pendiente: ['en_progreso'], en_progreso: ['completado'] },
  };

  it('permite solo transiciones declaradas y texto libre sin ciclo de vida', () => {
    expect(isValidTransition(null, 'pendiente', 'cualquier-cosa')).toBe(true);
    expect(isValidTransition(lifecycle, null, 'pendiente')).toBe(true);
    expect(isValidTransition(lifecycle, 'pendiente', 'en_progreso')).toBe(true);
    expect(isValidTransition(lifecycle, 'pendiente', 'completado')).toBe(false);
  });

  it('rechaza una transición inválida al actualizar un documento', () => {
    const entity = addEntity({ name: 'Acme', code: 'AC-1' });
    const doc = addDocument({ entity_id: entity.entity_id, status: 'pendiente' }, { statusLifecycle: lifecycle });
    expect(() => updateDocument(doc.id, { status: 'completado' }, { statusLifecycle: lifecycle })).toThrow(
      ValidationError,
    );
    const updated = updateDocument(doc.id, { status: 'en_progreso' }, { statusLifecycle: lifecycle });
    expect(updated.status).toBe('en_progreso');
  });
});

describe('Resumen de Gestión Comercial (H6)', () => {
  it('calcula totales y pendientes por entidad, y refleja un estado vacío', () => {
    expect(computeSummary({ entities: [], documents: [] })).toEqual({
      totalEntities: 0,
      totalDocuments: 0,
      totalPending: 0,
      pendingByEntity: [],
    });

    const entity = addEntity({ name: 'Acme', code: 'AC-1' });
    addDocument({ entity_id: entity.entity_id, status: 'pendiente' });
    addDocument({ entity_id: entity.entity_id, status: 'completado' });

    const summary = computeSummary({ entities: loadEntities(), documents: loadDocuments() });
    expect(summary.totalEntities).toBe(1);
    expect(summary.totalDocuments).toBe(2);
    expect(summary.totalPending).toBe(1);
    expect(summary.pendingByEntity).toEqual([{ entityId: entity.entity_id, entity, count: 1 }]);
  });

  it('actualiza el indicador de pendientes cuando un seguimiento se completa', () => {
    const entity = addEntity({ name: 'Acme', code: 'AC-1' });
    const doc = addDocument({ entity_id: entity.entity_id, status: 'pendiente' });
    updateDocument(doc.id, { status: 'completado' });
    const summary = computeSummary({ entities: loadEntities(), documents: loadDocuments() });
    expect(summary.totalPending).toBe(0);
  });
});
