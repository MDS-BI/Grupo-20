import { describe, it, expect, beforeEach } from 'vitest';
import { MODULE_CONFIG, setActiveConfig } from '../../src/module-config.js';
import { localTodayISO } from '../../src/utils/entity-date.js';
import { addEntity, loadEntities, loadDocuments } from '../../src/storage.js';
import {
  SEED_COUNT,
  SEED_MARKER,
  buildSeedClients,
  seedClients,
  clearSeedData,
  rutDigit,
  formatRut,
  isValidRut,
} from '../../src/seed.js';

const store = new Map();
globalThis.localStorage = {
  getItem: (key) => (store.has(key) ? store.get(key) : null),
  setItem: (key, value) => store.set(key, String(value)),
  removeItem: (key) => store.delete(key),
  clear: () => store.clear(),
};

beforeEach(() => {
  store.clear();
  setActiveConfig(MODULE_CONFIG);
});

describe('utilidad de simulación CRM', () => {
  it('calcula y valida el dígito verificador de RUT chileno', () => {
    expect(rutDigit('12345678')).toBe('5');
    expect(formatRut(12345678)).toBe('12.345.678-5');
    expect(isValidRut('12.345.678-5')).toBe(true);
    expect(isValidRut('12.345.678-6')).toBe(false);
    expect(isValidRut('no-es-un-rut')).toBe(false);
  });

  it('genera 57 clientes deterministas con datos comerciales consistentes', () => {
    const clients = buildSeedClients();
    expect(clients).toHaveLength(SEED_COUNT);
    expect(new Set(clients.map((c) => c.code)).size).toBe(SEED_COUNT);
    expect(clients.map((c) => c.code)).toEqual(
      Array.from({ length: SEED_COUNT }, (_, i) => `CLI-${String(i + 1).padStart(3, '0')}`)
    );
    expect(new Set(clients.map((c) => c.rut)).size).toBe(SEED_COUNT);
    for (const client of clients) {
      expect(isValidRut(client.rut)).toBe(true);
      expect(['Activo', 'Prospecto', 'Corporativo', 'PyME', 'VIP']).toContain(client.category);
      expect(client.pedidos).toBeUndefined();
      expect(client.targetDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(client.targetDate >= '1910-01-01').toBe(true);
      expect(client.targetDate <= localTodayISO()).toBe(true);
      expect([
        'Dependiente',
        'Independiente Formal',
        'Independiente Informal',
        'Jubilado',
        'Dueño/a de casa',
        'Estudiante',
        'FFAA',
        'Rentista',
        'Jubilado - FFAA',
        'Cesante',
      ]).toContain(client.rubro);
      expect(client.ejecutivo_asignado).toBeTruthy();
      expect(['llamada', 'correo', 'reunion', 'whatsapp']).toContain(client.canal_contacto);
      const contactFields = {
        llamada: 'contacto_telefono',
        correo: 'contacto_correo',
        reunion: 'contacto_lugar',
        whatsapp: 'contacto_whatsapp',
      };
      expect(client[contactFields[client.canal_contacto]]).toBeTruthy();
      expect(client._interactions.length).toBeGreaterThan(0);
    }
  });

  it('siembra clientes e interacciones vinculados y es idempotente', () => {
    const first = seedClients();
    expect(first.clientsCreated).toBe(SEED_COUNT);
    expect(first.clientsSkipped).toBe(0);
    expect(first.interactionsCreated).toBeGreaterThan(SEED_COUNT);
    expect(first.errors).toEqual([]);

    const entities = loadEntities();
    const documents = loadDocuments();
    expect(entities).toHaveLength(SEED_COUNT);
    for (const entity of entities) {
      expect(entity.description).toContain(SEED_MARKER);
      expect(isValidRut(entity.rut)).toBe(true);
      expect(entity.pedidos).toBeUndefined();
    }
    for (const doc of documents) {
      expect(entities.some((e) => e.entity_id === doc.entity_id)).toBe(true);
      expect(doc.notes).toContain(SEED_MARKER);
      expect(MODULE_CONFIG.statusLifecycle.states).toContain(doc.status);
      expect(doc.endDate >= doc.startDate).toBe(true);
    }

    const second = seedClients();
    expect(second.clientsCreated).toBe(0);
    expect(second.clientsSkipped).toBe(SEED_COUNT);
    expect(second.interactionsCreated).toBe(0);
    expect(loadEntities()).toHaveLength(SEED_COUNT);
    expect(loadDocuments()).toHaveLength(documents.length);
  });

  it('respeta la unicidad de code aunque exista una variación en mayúsculas o espacios', () => {
    addEntity({
      name: 'Cliente real',
      code: ' cli-001 ',
      targetDate: '1980-01-01',
      rut: '12.345.678-5',
      canal_contacto: 'llamada',
      contacto_telefono: '+56 9 1234 5678',
    });
    const result = seedClients();
    expect(result.clientsSkipped).toBe(1);
    expect(result.clientsCreated).toBe(SEED_COUNT - 1);
    const codes = loadEntities().map((e) => e.code.trim().toLowerCase().replace(/\s+/g, ''));
    expect(new Set(codes).size).toBe(loadEntities().length);
  });

  it('limpia solo los datos simulados y conserva registros ajenos', () => {
    const real = addEntity({
      name: 'Cliente real',
      code: 'REAL-1',
      targetDate: '1980-01-01',
      rut: '12.345.678-5',
      canal_contacto: 'llamada',
      contacto_telefono: '+56 9 1234 5678',
    });
    seedClients();
    const cleanup = clearSeedData();
    expect(cleanup.entitiesRemoved).toBe(SEED_COUNT);
    expect(cleanup.documentsRemoved).toBeGreaterThan(SEED_COUNT);
    expect(loadEntities()).toEqual([real]);
    expect(loadDocuments()).toEqual([]);
    expect(clearSeedData().entitiesRemoved).toBe(0);
  });
});
