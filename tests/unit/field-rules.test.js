import { describe, expect, it } from 'vitest';
import {
  getReadinessErrors,
  isConditionActive,
  isFieldPotentiallySearchable,
  isFieldSearchable,
  isFieldVisible,
  resolveFieldRules,
} from '../../src/utils/field-rules.js';
import { DEFAULT_CONFIG } from '../../src/module-config.js';

const CLIENT_CONFIG = {
  fieldRules: {
    rut: { label: 'RUT', required: true, format: 'cl-rut', unique: true, normalize: 'cl-rut' },
    entity: {
      code: { generated: { strategy: 'prefixSequence', prefix: 'CLI-', pad: 3 }, unique: true, hidden: true, searchable: false },
      category: { hidden: true, searchable: false },
      description: { hidden: true, searchable: false },
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
  entityDate: { label: 'Fecha de nacimiento', min: '1910-01-01', max: 'localToday', required: true },
};

describe('Reglas declarativas de campo (T028)', () => {
  it('resuelve reglas globales heredadas y permite el override por tipo de registro', () => {
    const rules = resolveFieldRules(CLIENT_CONFIG, 'entity');
    expect(rules.rut).toMatchObject({ required: true, format: 'cl-rut', unique: true, normalize: 'cl-rut' });
    expect(rules.code.hidden).toBe(true);
    expect(resolveFieldRules(DEFAULT_CONFIG, 'entity')).toEqual({});
  });

  it('respeta visibilidad, búsqueda y condiciones activas', () => {
    const rules = resolveFieldRules(CLIENT_CONFIG, 'entity');
    expect(isConditionActive(rules.contacto_telefono, { canal_contacto: 'llamada' })).toBe(true);
    expect(isConditionActive(rules.contacto_telefono, { canal_contacto: 'correo' })).toBe(false);
    expect(isFieldVisible(rules, 'code', {})).toBe(false);
    expect(isFieldVisible(rules, 'category', {})).toBe(false);
    expect(isFieldVisible(rules, 'contacto_telefono', { canal_contacto: 'llamada' })).toBe(true);
    expect(isFieldVisible(rules, 'contacto_telefono', { canal_contacto: 'correo' })).toBe(false);
    expect(isFieldSearchable(rules, 'name', {})).toBe(true);
    expect(isFieldSearchable(rules, 'code', {})).toBe(false);
    expect(isFieldSearchable(rules, 'category', {})).toBe(false);
    expect(isFieldPotentiallySearchable(rules, 'contacto_telefono')).toBe(true);
    expect(isFieldPotentiallySearchable(rules, 'contacto_correo')).toBe(true);
    expect(isFieldPotentiallySearchable(rules, 'code')).toBe(false);
  });

  it('detecta campos pendientes de clientes heredados sin bloquear fechas históricas', () => {
    const errors = getReadinessErrors(
      { name: 'Legacy', targetDate: '1900-05-05', rut: 'no-valido' },
      CLIENT_CONFIG,
    );
    expect(errors.targetDate).toBeUndefined();
    expect(errors.rut).toBeTruthy();
    expect(errors.canal_contacto).toBeTruthy();

    const complete = getReadinessErrors(
      {
        name: 'Legacy',
        targetDate: '1900-05-05',
        rut: '12.345.678-5',
        canal_contacto: 'llamada',
        contacto_telefono: '+56 9 1234 5678',
      },
      CLIENT_CONFIG,
    );
    expect(complete).toEqual({});
  });
});
