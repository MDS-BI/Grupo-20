import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createUser, listUsers, logout } from '../../src/auth.js';
import { seedAuth, signIn } from '../helpers/auth-session.js';
import { DEFAULT_CONFIG, MODULE_CONFIG, setActiveConfig } from '../../src/module-config.js';
import {
  addDocument,
  addEntity,
  deleteDocument,
  deleteEntity,
  loadDocuments,
  loadEntities,
  saveDocuments,
  saveEntities,
  savePermissionMatrix,
  savePermissions,
  setPermissions,
  setStorageAuthEnforced,
  updateDocument,
  updateEntity,
  updatePermissionMatrix,
} from '../../src/storage.js';
import { formatRut } from '../../src/utils/field-formats.js';
import { MESSAGES } from '../../src/utils/messages.js';

const DENIAL_MESSAGE = MESSAGES.permissionDenied;

function storageSnapshot() {
  return {
    entities: localStorage.getItem('erp_entities'),
    documents: localStorage.getItem('erp_documents'),
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

beforeEach(async () => {
  setActiveConfig(MODULE_CONFIG);
  seedAuth();
  await signIn('gerente');
  saveEntities([victimEntity()]);
  saveDocuments([victimDocument()]);
  const visitor = createUser({ username: 'visitante', rank: 'visitor' });
  await signIn(visitor.username);
  setStorageAuthEnforced(true);
});

afterEach(() => {
  setStorageAuthEnforced(false);
  logout();
  setActiveConfig(DEFAULT_CONFIG);
  localStorage.clear();
});

describe('Llamadas directas a storage con sesión íntegra sin permisos', () => {
  it('resuelve el visitante desde erp_users y conserva su sesión vigente', async () => {
    const visitor = listUsers().find((user) => user.usernameKey === 'visitante');
    const signedIn = await signIn('visitante');

    expect(signedIn.rank).toBe('visitor');
    expect(localStorage.getItem('erp_session')).toBeTruthy();
    expect(visitor.active).toBe(true);
  });

  it.each([
    ['addEntity', () => addEntity({ name: 'Intrusa', code: 'INT-1' })],
    ['updateEntity', () => updateEntity('ent-victima', { name: 'Manipulada' })],
    ['deleteEntity', () => deleteEntity('ent-victima')],
    ['addDocument', () => addDocument({ entity_id: 'CLI-VICTIMA' })],
    ['updateDocument', () => updateDocument('doc-victima', { notes: 'Manipulado' })],
    ['deleteDocument', () => deleteDocument('doc-victima')],
    ['saveEntities', () => saveEntities([victimEntity()])],
    ['saveDocuments', () => saveDocuments([victimDocument()])],
    ['savePermissions', () => savePermissions()],
    ['savePermissionMatrix', () => savePermissionMatrix()],
    ['updatePermissionMatrix', () => updatePermissionMatrix()],
    ['setPermissions', () => setPermissions()],
  ])('%s deniega la escritura sin mutar almacenamiento', (name, operation) => {
    const before = storageSnapshot();

    expect(operation, name).toThrow(DENIAL_MESSAGE);
    expect(storageSnapshot(), name).toEqual(before);
  });

  it('niega la matriz a N4 aunque tenga sesión y permisos de gestión', async () => {
    await signIn('gerente');

    expect(() => savePermissions()).toThrow(DENIAL_MESSAGE);
    expect(() => savePermissionMatrix()).toThrow(DENIAL_MESSAGE);
    expect(() => updatePermissionMatrix()).toThrow(DENIAL_MESSAGE);
    expect(() => setPermissions()).toThrow(DENIAL_MESSAGE);
  });

  it('permite a N4 las mismas operaciones cuando la matriz sí autoriza', async () => {
    await signIn('gerente');

    const entity = addEntity({
      name: 'Autorizada',
      code: 'AUT-1',
      targetDate: '1980-05-05',
      rut: formatRut(13000130),
      canal_contacto: 'llamada',
      contacto_telefono: '+56 9 1234 5678',
    });
    expect(updateEntity(entity.id, { name: 'Autorizada dos' })).toMatchObject({
      name: 'Autorizada dos',
    });
    const document = addDocument({ entity_id: entity.entity_id, notes: 'Seguimiento' });
    expect(updateDocument(document.id, { notes: 'Actualizado' })).toMatchObject({
      notes: 'Actualizado',
    });
    expect(deleteDocument(document.id)).toBeUndefined();
    expect(deleteEntity(entity.id)).toMatchObject({ deletedDocumentCount: 0 });
    expect(loadEntities().some((item) => item.id === entity.id)).toBe(false);
    expect(loadDocuments().some((item) => item.id === document.id)).toBe(false);
  });
});
