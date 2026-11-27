import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import {
  setActiveConfig,
  DEFAULT_CONFIG,
  MODULE_CONFIG,
  loadModuleConfig,
} from '../../src/module-config.js';
import { localTodayISO } from '../../src/utils/entity-date.js';
import {
  DEMO_PASSWORD,
  createUser,
  deactivateUser,
  listUsers,
  logout,
  updateUser,
} from '../../src/auth.js';
import { seedAuth, signIn } from '../helpers/auth-session.js';
import * as permissions from '../../src/auth/permissions.js';
import {
  addEntity,
  updateEntity,
  updateEntityStage,
  deleteEntity,
  archiveEntity,
  restoreEntity,
  EntityHasRecordsError,
  isArchivedEntity,
  deleteDocumentsForEntity,
  loadEntities,
  addDocument,
  updateDocument,
  deleteDocument,
  loadDocuments,
  saveEntities,
  saveDocuments,
  saveMarketingConfig,
  loadMarketingConfig,
  getEntityDocuments,
  searchEntities,
  computeSummary,
  isValidTransition,
  ValidationError,
} from '../../src/storage.js';

afterEach(() => {
  setActiveConfig(DEFAULT_CONFIG);
});

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
    expect(() => addEntity({ name: 'A', code: 'A1', targetDate: 'not-a-date' })).toThrow(
      ValidationError
    );
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

  it('archiva una entidad conservando sus documentos y permite restaurarla', () => {
    const entity = addEntity({ name: 'Acme', code: 'AC-1' });
    addDocument({ entity_id: entity.entity_id });
    addDocument({ entity_id: entity.entity_id });

    const archived = archiveEntity(entity.id);
    expect(isArchivedEntity(archived)).toBe(true);
    expect(archived.archivedAt).toBeTruthy();
    expect(loadEntities()).toHaveLength(1);
    expect(loadDocuments()).toHaveLength(2);
    expect(archiveEntity(entity.id).archivedAt).toBe(archived.archivedAt);

    const restored = restoreEntity(entity.id);
    expect(isArchivedEntity(restored)).toBe(false);
    expect(restored.archivedAt).toBeUndefined();
    expect(loadDocuments()).toHaveLength(2);
  });

  it('impide la eliminación definitiva cuando hay registros vinculados', () => {
    const entity = addEntity({ name: 'Acme', code: 'AC-1' });
    addDocument({ entity_id: entity.entity_id });

    expect(() => deleteEntity(entity.id)).toThrow(EntityHasRecordsError);
    expect(loadEntities()).toHaveLength(1);
    expect(loadDocuments()).toHaveLength(1);
  });

  it('elimina definitivamente una entidad sin registros vinculados sin tocar otros documentos', () => {
    const entity = addEntity({ name: 'Acme', code: 'AC-1' });
    const other = addEntity({ name: 'Otra', code: 'AC-2' });
    addDocument({ entity_id: other.entity_id, notes: 'Historial conservado' });

    expect(deleteEntity(entity.id)).toMatchObject({ deletedDocumentCount: 0 });
    expect(loadEntities()).toHaveLength(1);
    expect(loadDocuments()).toHaveLength(1);
    expect(loadDocuments()[0].entity_id).toBe(other.entity_id);
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
      addDocument({ entity_id: entity.entity_id, startDate: '2026-05-10', endDate: '2026-05-01' })
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
      { customFieldDefs: [{ key: 'vip', label: 'VIP', type: 'text' }] }
    );
    addDocument(
      { entity_id: entity.entity_id, interactionType: 'llamada' },
      { customFieldDefs: [{ key: 'interactionType', label: 'Tipo', type: 'text' }] }
    );
    expect(searchEntities('vip', { customFieldKeys: [] })).toHaveLength(0);
    expect(searchEntities('true', { customFieldKeys: ['vip'] })).toHaveLength(1);
    expect(searchEntities('llamada', { customFieldKeys: ['interactionType'] })).toHaveLength(1);
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
    expect(() => addEntity({ name: 'Acme', code: 'AC-1' }, { customFieldDefs: defs })).toThrow(
      ValidationError
    );
  });

  it('persiste y conserva valores de campos retirados de la configuración', () => {
    const entity = addEntity(
      { name: 'Acme', code: 'AC-1', creditLimit: 1000 },
      { customFieldDefs: defs }
    );
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
    const doc = addDocument(
      { entity_id: entity.entity_id, status: 'pendiente' },
      { statusLifecycle: lifecycle }
    );
    expect(() =>
      updateDocument(doc.id, { status: 'completado' }, { statusLifecycle: lifecycle })
    ).toThrow(ValidationError);
    const updated = updateDocument(
      doc.id,
      { status: 'en_progreso' },
      { statusLifecycle: lifecycle }
    );
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
    addDocument({ entity_id: entity.entity_id, status: 'Pendiente ' });
    addDocument({ entity_id: entity.entity_id, status: 'completado' });

    const summary = computeSummary({ entities: loadEntities(), documents: loadDocuments() });
    expect(summary.totalEntities).toBe(1);
    expect(summary.totalDocuments).toBe(3);
    expect(summary.totalPending).toBe(2);
    expect(summary.pendingByEntity).toEqual([{ entityId: entity.entity_id, entity, count: 2 }]);
  });

  it('actualiza el indicador de pendientes cuando un seguimiento se completa', () => {
    const entity = addEntity({ name: 'Acme', code: 'AC-1' });
    const doc = addDocument({ entity_id: entity.entity_id, status: 'pendiente' });
    updateDocument(doc.id, { status: 'completado' });
    const summary = computeSummary({ entities: loadEntities(), documents: loadDocuments() });
    expect(summary.totalPending).toBe(0);
  });

  it('usa el estado pendiente declarado en el ciclo de vida sin distinguir mayúsculas', () => {
    const entity = addEntity({ name: 'Acme', code: 'AC-2' });
    addDocument({ entity_id: entity.entity_id, status: 'Pendiente' });
    const summary = computeSummary({
      entities: loadEntities(),
      documents: loadDocuments(),
      statusLifecycle: { states: ['Pendiente', 'Completado'] },
    });
    expect(summary.totalPending).toBe(1);
  });

  it('cuenta solo los estados marcados como pendingStates cuando se declaran', () => {
    const entity = addEntity({ name: 'Acme', code: 'AC-3' });
    addDocument({ entity_id: entity.entity_id, status: 'pendiente' });
    addDocument({ entity_id: entity.entity_id, status: 'en_revision' });
    addDocument({ entity_id: entity.entity_id, status: 'cerrado' });
    const lifecycle = {
      states: ['pendiente', 'en_revision', 'cerrado'],
      pendingStates: ['en_revision'],
    };
    const summary = computeSummary({
      entities: loadEntities(),
      documents: loadDocuments(),
      statusLifecycle: lifecycle,
    });
    expect(summary.totalPending).toBe(1);
    expect(summary.pendingByEntity[0].count).toBe(1);

    const fallback = computeSummary({
      entities: loadEntities(),
      documents: loadDocuments(),
      statusLifecycle: { states: lifecycle.states },
    });
    expect(fallback.totalPending).toBe(1);
  });

  it('computa totales y pendientes derivados sin persistirlos (T123/T124)', () => {
    const entity = addEntity({ name: 'Acme', code: 'AC-4' });
    addDocument({ entity_id: entity.entity_id, status: 'pendiente' });
    addDocument({ entity_id: entity.entity_id, status: 'en_revision' });
    const lifecycle = {
      states: ['pendiente', 'en_revision', 'cerrado'],
      pendingStates: ['en_revision'],
    };
    const summary = computeSummary({
      entities: loadEntities(),
      documents: loadDocuments(),
      statusLifecycle: lifecycle,
    });
    expect(summary).toEqual({
      totalEntities: 1,
      totalDocuments: 2,
      totalPending: 1,
      pendingByEntity: [{ entityId: entity.entity_id, entity, count: 1 }],
    });
    const stored = `${localStorage.getItem('erp_entities')}${localStorage.getItem('erp_documents')}`;
    expect(stored).not.toContain('"totalPending"');
    expect(stored).not.toContain('"pendingByEntity"');
  });
});

const CLIENT_PROFILE = {
  moduleName: 'CRM Comercial',
  entityDate: {
    label: 'Fecha de nacimiento',
    min: '1910-01-01',
    max: 'localToday',
    required: true,
  },
  customFields: {
    entity: [
      { key: 'rubro', label: 'Rubro', type: 'text' },
      {
        key: 'canal_contacto',
        label: 'Canal de Contacto',
        type: 'select',
        options: ['llamada', 'correo', 'reunion', 'whatsapp'],
      },
      { key: 'rut', label: 'RUT', type: 'text' },
      { key: 'contacto_telefono', label: 'Teléfono', type: 'text' },
      { key: 'contacto_correo', label: 'Correo electrónico', type: 'text' },
    ],
    document: [],
  },
  fieldRules: {
    entity: {
      code: {
        generated: { strategy: 'prefixSequence', prefix: 'CLI-', pad: 3 },
        unique: true,
        hidden: true,
        searchable: false,
      },
      category: { hidden: true, searchable: false },
      description: { hidden: true, searchable: false },
      rut: { label: 'RUT', required: true, format: 'cl-rut', unique: true, normalize: 'cl-rut' },
      canal_contacto: { label: 'Canal de Contacto', required: true },
      contacto_telefono: {
        label: 'Teléfono',
        when: { key: 'canal_contacto', equals: 'llamada' },
        required: true,
        format: 'phone',
        group: 'contactDetail',
      },
      contacto_correo: {
        label: 'Correo electrónico',
        when: { key: 'canal_contacto', equals: 'correo' },
        required: true,
        format: 'email',
        group: 'contactDetail',
      },
    },
    document: {},
  },
  detailPolicy: { entity: { blockWhenInvalid: true, offerEditAction: true } },
};

describe('Reglas de campo del perfil de clientes (T032)', () => {
  beforeEach(() => {
    setActiveConfig(CLIENT_PROFILE);
  });

  afterEach(() => {
    setActiveConfig(DEFAULT_CONFIG);
  });

  function validClient(overrides = {}) {
    return {
      name: 'Cliente Uno',
      targetDate: '1980-05-05',
      rut: '12.345.678-5',
      canal_contacto: 'llamada',
      contacto_telefono: '+56 9 1234 5678',
      ...overrides,
    };
  }

  it('genera un código único oculto y no buscable', () => {
    const first = addEntity(validClient());
    const second = addEntity(validClient({ name: 'Cliente Dos', rut: '12.345.679-3' }));
    expect(first.code).toMatch(/^CLI-\d{3,}$/);
    expect(second.code).not.toBe(first.code);
    expect(
      searchEntities(first.code.toLowerCase(), {
        customFieldKeys: ['rubro', 'rut', 'contacto_telefono'],
      })
    ).toHaveLength(0);
  });

  it('rechaza RUT inválido, RUT duplicado y fecha de nacimiento ausente', () => {
    expect(() => addEntity(validClient({ rut: '12.345.678-6' }))).toThrow(ValidationError);
    addEntity(validClient());
    expect(() => addEntity(validClient({ name: 'Otro', rut: ' 12345678-5 ' }))).toThrow(
      ValidationError
    );
    expect(() => addEntity(validClient({ rut: '12.345.679-3', targetDate: '' }))).toThrow(
      ValidationError
    );
  });

  it('rechaza el mismo RUT escrito con puntos y sin puntos (T057)', () => {
    addEntity(validClient());
    expect(() => addEntity(validClient({ name: 'Otro', rut: '12345678-5' }))).toThrow(
      ValidationError
    );
  });

  it('valida solo el campo del canal activo y descarta los demás al guardar', () => {
    const created = addEntity(validClient({ contacto_correo: 'ana@example.com' }));
    expect(created.contacto_telefono).toBe('+56 9 1234 5678');
    expect(created.contacto_correo).toBeUndefined();

    expect(() => addEntity(validClient({ rut: '12.345.679-3', contacto_telefono: 'abc' }))).toThrow(
      ValidationError
    );
    expect(() =>
      addEntity(
        validClient({
          rut: '12.345.679-3',
          canal_contacto: 'correo',
          contacto_telefono: '+56 9 1234 5678',
        })
      )
    ).toThrow(ValidationError);

    const byEmail = addEntity({
      name: 'Cliente Correo',
      targetDate: '1990-01-01',
      rut: '12.345.679-3',
      canal_contacto: 'correo',
      contacto_correo: 'ana@example.com',
      contacto_telefono: '+56 9 1234 5678',
    });
    expect(byEmail.contacto_correo).toBe('ana@example.com');
    expect(byEmail.contacto_telefono).toBeUndefined();

    const switched = updateEntity(created.id, {
      canal_contacto: 'correo',
      contacto_correo: 'ana@example.com',
    });
    expect(switched.canal_contacto).toBe('correo');
    expect(switched.contacto_correo).toBe('ana@example.com');
    expect(switched.contacto_telefono).toBeUndefined();
  });

  it('excluye categoría y descripción de la búsqueda sin borrarlas', () => {
    const entity = addEntity(
      validClient({
        category: 'CategoriaSecreta',
        description: 'DescripcionSecreta',
      })
    );
    expect(entity.category).toBe('CategoriaSecreta');
    const options = { customFieldKeys: ['rubro', 'rut', 'canal_contacto', 'contacto_telefono'] };
    expect(searchEntities('CategoriaSecreta', options)).toHaveLength(0);
    expect(searchEntities('DescripcionSecreta', options)).toHaveLength(0);
    expect(searchEntities('Cliente Uno', options)).toHaveLength(1);
  });
});

describe('Fecha de nacimiento del perfil de clientes (FR-047 a FR-050)', () => {
  const clientConfig = {
    moduleName: 'CRM Comercial',
    entityDate: { label: 'Fecha de nacimiento', min: '1910-01-01', max: 'localToday' },
  };

  it('acepta los límites inclusive y rechaza fechas fuera de rango o imposibles', () => {
    setActiveConfig(clientConfig);
    expect(addEntity({ name: 'Min', code: 'MIN', targetDate: '1910-01-01' }).targetDate).toBe(
      '1910-01-01'
    );
    expect(addEntity({ name: 'Hoy', code: 'HOY', targetDate: localTodayISO() }).targetDate).toBe(
      localTodayISO()
    );
    expect(() => addEntity({ name: 'Old', code: 'OLD', targetDate: '1909-12-31' })).toThrow(
      ValidationError
    );
    expect(() => addEntity({ name: 'Future', code: 'FUT', targetDate: '2999-01-01' })).toThrow(
      ValidationError
    );
    expect(() => addEntity({ name: 'Leap', code: 'LEAP', targetDate: '1910-02-29' })).toThrow(
      ValidationError
    );
    expect(() => addEntity({ name: 'Feb', code: 'FEB', targetDate: '2026-02-30' })).toThrow(
      ValidationError
    );
  });

  it('usa la etiqueta configurada en el mensaje de error', () => {
    setActiveConfig(clientConfig);
    try {
      addEntity({ name: 'Bad', code: 'BAD', targetDate: '1900-01-01' });
    } catch (err) {
      expect(err.errors.targetDate).toContain('Fecha de nacimiento');
    }
  });

  it('conserva un valor histórico pero exige corregirlo antes de guardar una edición', () => {
    setActiveConfig(DEFAULT_CONFIG);
    const legacy = addEntity({ name: 'Legacy', code: 'LEG', targetDate: '1900-05-05' });
    expect(loadEntities().find((e) => e.id === legacy.id).targetDate).toBe('1900-05-05');

    setActiveConfig(clientConfig);
    expect(() => updateEntity(legacy.id, { name: 'Legacy Corregido' })).toThrow(ValidationError);
    const corrected = updateEntity(legacy.id, { name: 'Legacy', targetDate: '1980-05-05' });
    expect(corrected.targetDate).toBe('1980-05-05');
  });
});

describe('Persistencia de Marketing (T077)', () => {
  const { config: marketingConfig } = loadModuleConfig({
    ...MODULE_CONFIG,
    entityDate: null,
    fieldRules: { entity: {}, document: {} },
  });

  it('conserva el estado comercial y los datos de consentimiento en la entidad', () => {
    setActiveConfig(marketingConfig);
    const entity = addEntity(
      {
        name: 'Prospecto Web',
        code: 'MKT-1',
        estado_comercial: 'prospecto',
        consentimiento: true,
        consentimiento_fecha: '2026-11-23T12:00:00.000Z',
        consentimiento_version: '2026-11-23',
      },
      { customFieldDefs: marketingConfig.customFields.entity }
    );
    const stored = loadEntities().find((e) => e.id === entity.id);
    expect(stored.estado_comercial).toBe('prospecto');
    expect(stored.consentimiento).toBe(true);
    expect(stored.consentimiento_fecha).toBe('2026-11-23T12:00:00.000Z');
    expect(stored.consentimiento_version).toBe('2026-11-23');
  });

  it('guarda documentos automáticos con su estado y la entidad asociada', () => {
    const entity = addEntity({ name: 'Base', code: 'MKT-2' });
    const doc = addDocument({
      entity_id: entity.entity_id,
      notes: 'Registro de bienvenida',
      status: 'automatico',
    });
    expect(loadDocuments().find((d) => d.id === doc.id)).toMatchObject({
      notes: 'Registro de bienvenida',
      status: 'automatico',
      entity_id: entity.entity_id,
    });
  });
});

const DENIAL_MESSAGE = 'No tienes permiso para realizar esta acción';

function storageSnapshot() {
  return {
    entities: localStorage.getItem('erp_entities'),
    documents: localStorage.getItem('erp_documents'),
    marketing: localStorage.getItem('erp_marketing_config'),
  };
}

function victimEntity(ownerId = null) {
  return {
    id: 'ent-victima',
    entity_id: 'CLI-VICTIMA',
    name: 'Víctima',
    code: 'VIC-1',
    targetDate: '1980-05-05',
    estado_comercial: 'prospecto',
    ...(ownerId ? { ownerId } : {}),
  };
}

function victimDocument(ownerId = null) {
  return {
    id: 'doc-victima',
    entity_id: 'CLI-VICTIMA',
    status: 'pendiente',
    ...(ownerId ? { ownerId } : {}),
  };
}

describe('Compatibilidad sin usuario autenticado', () => {
  it('mantiene operaciones y escrituras directas de la suite legada', () => {
    saveEntities([victimEntity()]);
    saveDocuments([victimDocument()]);

    const entity = addEntity({ name: 'Sin sesión', code: 'SS-1' });
    const document = addDocument({ entity_id: entity.entity_id, notes: 'Nota inicial' });

    expect(updateEntity(entity.id, { name: 'Sin sesión actualizada' })).toMatchObject({
      name: 'Sin sesión actualizada',
    });
    expect(updateDocument(document.id, { notes: 'Nota actualizada' })).toMatchObject({
      notes: 'Nota actualizada',
    });
    saveMarketingConfig({ ...loadMarketingConfig(), faq: [{ pregunta: 'P', respuesta: 'R' }] });
    expect(loadMarketingConfig().faq).toEqual([{ pregunta: 'P', respuesta: 'R' }]);
  });
});

describe('Autorización de escrituras con sesión vigente', () => {
  const deniedWrites = [
    ['saveEntities', () => saveEntities([{ id: 'ent-intrusa' }])],
    ['addEntity', () => addEntity({ name: 'Intrusa', code: 'INT-1' })],
    ['updateEntity', () => updateEntity('ent-victima', { name: 'Manipulada' })],
    ['updateEntityStage', () => updateEntityStage('ent-victima', 'en_proceso')],
    ['archiveEntity', () => archiveEntity('ent-victima')],
    ['restoreEntity', () => restoreEntity('ent-victima')],
    ['deleteEntity', () => deleteEntity('ent-victima')],
    ['saveDocuments', () => saveDocuments([{ id: 'doc-intruso' }])],
    ['addDocument', () => addDocument({ entity_id: 'CLI-VICTIMA' })],
    ['updateDocument', () => updateDocument('doc-victima', { notes: 'Manipulado' })],
    ['deleteDocument', () => deleteDocument('doc-victima')],
    ['deleteDocumentsForEntity', () => deleteDocumentsForEntity('CLI-VICTIMA')],
    ['saveMarketingConfig', () => saveMarketingConfig({ ...loadMarketingConfig(), faq: [] })],
  ];

  beforeEach(async () => {
    saveEntities([victimEntity()]);
    saveDocuments([victimDocument()]);
    await signIn('atencion');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    logout();
  });

  it.each(deniedWrites)('%s no escribe cuando can() es falso', (_name, operation) => {
    const before = storageSnapshot();
    vi.spyOn(permissions, 'can').mockReturnValue(false);
    const assertSpy = vi.spyOn(permissions, 'assertPermission').mockImplementation(() => {
      throw new Error(DENIAL_MESSAGE);
    });

    expect(operation).toThrow(DENIAL_MESSAGE);
    expect(assertSpy, 'La capa de datos debe pasar por assertPermission()').toHaveBeenCalled();
    expect(storageSnapshot()).toEqual(before);
  });
});

describe('Permisos aplicados a storage con sesión íntegra', () => {
  beforeEach(async () => {
    await signIn('gerente');
  });

  afterEach(() => {
    logout();
  });

  it('permite a N4 crear, editar, cambiar etapa, eliminar y escribir listas', () => {
    saveEntities([]);
    const entity = addEntity({ name: 'Autorizada', code: 'AUT-1', estado_comercial: 'prospecto' });

    expect(updateEntity(entity.id, { name: 'Autorizada dos' })).toMatchObject({
      name: 'Autorizada dos',
    });
    expect(updateEntityStage(entity.id, 'en_proceso')).toMatchObject({
      estado_comercial: 'en_proceso',
    });

    const document = addDocument({ entity_id: entity.entity_id, notes: 'Seguimiento' });
    expect(updateDocument(document.id, { notes: 'Seguimiento actualizado' })).toMatchObject({
      notes: 'Seguimiento actualizado',
    });
    saveDocuments(loadDocuments());
    saveMarketingConfig({ ...loadMarketingConfig(), faq: [] });

    expect(deleteDocumentsForEntity(entity.entity_id)).toBe(1);
    expect(isArchivedEntity(archiveEntity(entity.id))).toBe(true);
    expect(isArchivedEntity(restoreEntity(entity.id))).toBe(false);
    expect(deleteEntity(entity.id)).toMatchObject({ deletedDocumentCount: 0 });
  });

  it('aplica un cambio de rango a la siguiente mutación sin renovar la sesión', () => {
    const camila = listUsers().find((user) => user.usernameKey === 'gerente');

    updateUser(camila.id, { rank: 'n1_support' });
    expect(() => addEntity({ name: 'Denegada', code: 'DEN-1' })).toThrow(DENIAL_MESSAGE);

    updateUser(camila.id, { rank: 'n4_manager' });
    expect(() => addEntity({ name: 'Permitida', code: 'PER-1' })).not.toThrow();
  });

  it('deniega a N2 la edición de registros ajenos y la configuración de marketing', async () => {
    saveEntities([victimEntity('user-otro')]);
    saveDocuments([victimDocument('user-otro')]);
    await signIn('ventas');
    const before = storageSnapshot();

    expect(() => updateEntity('ent-victima', { name: 'Ajena' })).toThrow(DENIAL_MESSAGE);
    expect(() => updateDocument('doc-victima', { notes: 'Ajeno' })).toThrow(DENIAL_MESSAGE);
    expect(() => deleteEntity('ent-victima')).toThrow(DENIAL_MESSAGE);
    expect(() => deleteDocument('doc-victima')).toThrow(DENIAL_MESSAGE);
    expect(() => saveMarketingConfig({ ...loadMarketingConfig(), faq: [] })).toThrow(
      DENIAL_MESSAGE
    );
    expect(storageSnapshot()).toEqual(before);
  });

  it('no persiste un userId inactivo en nuevas asignaciones del equipo de ventas', async () => {
    seedAuth();
    const ana = await createUser({
      username: 'ana.munoz',
      password: DEMO_PASSWORD,
      rank: 'n2_sales',
    });
    deactivateUser(ana.id);

    const config = loadMarketingConfig();
    const proposedTeam = {
      id: 'equipo-inactivo',
      name: 'Equipo Norte',
      members: [
        { id: 'miembro-ana', name: 'Ana Muñoz', role: 'Ejecutiva', active: true, userId: ana.id },
      ],
    };
    let rejection = null;
    try {
      saveMarketingConfig({ ...config, salesTeams: [proposedTeam] });
    } catch (error) {
      rejection = error;
    }

    const storedMember = loadMarketingConfig()
      .salesTeams.find((team) => team.id === proposedTeam.id)
      ?.members?.find((member) => member.id === proposedTeam.members[0].id);
    expect(storedMember?.userId).not.toBe(ana.id);
    expect(rejection === null || Boolean(rejection.message)).toBe(true);
  });
});
