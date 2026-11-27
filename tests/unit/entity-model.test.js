import { describe, expect, it } from 'vitest';
import { getEntityFieldDefs } from '../../src/components/entity-form.js';
import { getReadinessErrors } from '../../src/utils/field-rules.js';
import { MESSAGES } from '../../src/utils/messages.js';

const CONFIG = {
  labels: { entity: 'Cliente' },
  customFields: {
    entity: [
      { key: 'rut', label: 'RUT', type: 'text' },
      { key: 'contacto_telefono', label: 'Teléfono', type: 'text' },
    ],
  },
  statusLifecycle: null,
  fieldRules: {
    entity: {
      code: { hidden: true },
      category: { hidden: true },
      rut: { required: true, order: 2 },
    },
  },
};

describe('Modelo de entidad (US1/US4)', () => {
  it('omite campos ocultos y mantiene el RUT obligatorio', () => {
    const defs = getEntityFieldDefs(CONFIG, {});
    const keys = defs.map((def) => def.key);
    expect(keys).not.toContain('code');
    expect(keys).not.toContain('category');
    expect(keys).toContain('name');
    expect(keys).toContain('rut');
    expect(defs.find((def) => def.key === 'rut').required).toBe(true);
  });

  it('aplica reglas de preparación a los datos persistentes', () => {
    expect(getReadinessErrors({}, CONFIG).rut).toBe(MESSAGES.required);
    expect(getReadinessErrors({ rut: '11.111.111-1' }, CONFIG).rut).toBeUndefined();
  });
});
