import { describe, expect, it } from 'vitest';
import { MODULE_CONFIG, loadModuleConfig } from '../../src/module-config.js';
import {
  getReadinessErrors,
  isConditionActive,
  isFieldVisible,
  resolveFieldRules,
} from '../../src/utils/field-rules.js';
import { isValidRut } from '../../src/utils/field-formats.js';
import { buildSeedClients, SEED_COUNT } from '../../src/seed.js';

const { config } = loadModuleConfig(MODULE_CONFIG);
const rules = resolveFieldRules(config, 'entity');
const customKeys = config.customFields.entity.map((def) => def.key);

describe('Declaración de campos del perfil de clientes (T035)', () => {
  it('exige fecha de nacimiento, RUT y canal de contacto', () => {
    expect(config.entityDate).toMatchObject({
      label: 'Fecha de nacimiento',
      min: '1910-01-01',
      max: 'localToday',
    });
    expect(config.entityDate.required).toBe(true);
    expect(rules.rut).toMatchObject({
      required: true,
      format: 'cl-rut',
      unique: true,
      normalize: 'cl-rut',
    });
    expect(rules.canal_contacto).toMatchObject({ required: true });
    const errors = getReadinessErrors({ name: 'Sin datos' }, config);
    expect(errors.targetDate).toBeTruthy();
    expect(errors.rut).toBeTruthy();
    expect(errors.canal_contacto).toBeTruthy();
  });

  it('retira pedidos y oculta los campos generados y heredados', () => {
    expect(customKeys).not.toContain('pedidos');
    expect(rules.code).toMatchObject({
      generated: { strategy: 'prefixSequence', prefix: 'CLI-', pad: 3 },
      unique: true,
      hidden: true,
      searchable: false,
    });
    expect(rules.category).toMatchObject({ hidden: true, searchable: false });
    expect(rules.description).toMatchObject({ hidden: true, searchable: false });
    expect(isFieldVisible(rules, 'code', {})).toBe(false);
    expect(isFieldVisible(rules, 'category', {})).toBe(false);
  });

  it('declara los cuatro canales con su casilla condicional', () => {
    const channels = {
      llamada: { key: 'contacto_telefono', format: 'phone' },
      correo: { key: 'contacto_correo', format: 'email' },
      reunion: { key: 'contacto_lugar', format: 'nonEmpty' },
      whatsapp: { key: 'contacto_whatsapp', format: 'phone' },
    };
    for (const [channel, expected] of Object.entries(channels)) {
      const rule = rules[expected.key];
      expect(customKeys).toContain(expected.key);
      expect(rule).toMatchObject({
        required: true,
        format: expected.format,
        group: 'contactDetail',
      });
      expect(isConditionActive(rule, { canal_contacto: channel })).toBe(true);
      expect(isConditionActive(rule, { canal_contacto: 'otro' })).toBe(false);
    }
  });

  it('declara los metadatos de presentación del formulario (T061)', () => {
    const channelOptions = [
      { value: 'llamada', label: 'Llamada' },
      { value: 'correo', label: 'Correo' },
      { value: 'reunion', label: 'Reunión' },
      { value: 'whatsapp', label: 'WhatsApp' },
    ];
    const activityOptions = [
      'Dependiente',
      'Independiente formal',
      'Independiente informal',
      'Jubilado',
      'Dueño/a de casa',
      'Estudiante',
      'FFAA',
      'Rentista',
      'Jubilado - FFAA',
      'Cesante',
    ];
    const placeholders = {
      contacto_telefono: 'Ej: +56 9 1234 5678',
      contacto_correo: 'Ej: nombre@ejemplo.cl',
      contacto_lugar: 'Ej: Sala 2 o enlace',
      contacto_whatsapp: 'Ej: +56 9 1234 5678',
    };

    expect(rules.name.order).toBe(1);
    expect(rules.rut).toMatchObject({ order: 2, placeholder: 'Ej: 11.111.111-1' });
    expect(rules.targetDate.order).toBe(3);
    expect(rules.canal_contacto).toMatchObject({ order: 4 });
    expect(rules.canal_contacto.options).toEqual(channelOptions);
    for (const [key, placeholder] of Object.entries(placeholders)) {
      expect(rules[key]).toMatchObject({ order: 4, placeholder });
    }
    expect(rules.rubro).toMatchObject({ label: 'Tipo de actividad', type: 'select', order: 5 });
    expect(rules.rubro.options).toEqual(activityOptions);
    expect(rules.ejecutivo_asignado.order).toBe(6);
  });

  it('genera datos de ejemplo coherentes con el perfil', () => {
    const clients = buildSeedClients(SEED_COUNT, config);
    expect(clients).toHaveLength(SEED_COUNT);
    expect(new Set(clients.map((client) => client.rut)).size).toBe(SEED_COUNT);
    for (const client of clients) {
      expect(isValidRut(client.rut)).toBe(true);
      expect(client.pedidos).toBeUndefined();
      expect(client.targetDate <= new Date().toISOString().slice(0, 10)).toBe(true);
      const contactKey = Object.keys(rules).find(
        (key) => rules[key].group === 'contactDetail' && isConditionActive(rules[key], client)
      );
      expect(contactKey).toBeTruthy();
      expect(client[contactKey]).toBeTruthy();
    }
  });
});
