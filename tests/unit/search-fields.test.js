import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_CONFIG,
  MODULE_CONFIG,
  loadModuleConfig,
  setActiveConfig,
} from '../../src/module-config.js';
import {
  CANONICAL_SEARCH_KEYS,
  canonicalSearchKeys,
  isFieldPotentiallySearchable,
  isFieldSearchable,
  resolveFieldRules,
} from '../../src/utils/field-rules.js';
import { renderSearchBarHtml } from '../../src/components/search-bar.js';
import { searchEntities } from '../../src/storage.js';

const BASE_ENTITY = {
  id: 'e1',
  entity_id: 'ent-1',
  name: 'Comercial Andina SpA',
  code: 'CLI-001',
  category: 'Ferretería',
  description: 'Venta al por mayor',
  targetDate: '1985-07-14',
  rut: '11.111.111-1',
  canal_contacto: 'llamada',
  contacto_telefono: '+56912345678',
  rubro: 'Dependiente',
};

function searchKeysFor(config, kind = 'entity') {
  const rules = resolveFieldRules(config, kind);
  const customKeys = (config.customFields?.[kind] || [])
    .map((def) => def.key)
    .filter((key) => isFieldPotentiallySearchable(rules, key));
  return canonicalSearchKeys(kind, customKeys);
}

function search(query, config, entities = [BASE_ENTITY]) {
  return searchEntities(query, { entities, customFieldKeys: searchKeysFor(config) });
}

describe('Lista canónica de campos buscables (FR-004)', () => {
  beforeEach(() => setActiveConfig(DEFAULT_CONFIG));
  afterEach(() => setActiveConfig(DEFAULT_CONFIG));

  it('declara una única lista base para entidades y documentos', () => {
    expect(CANONICAL_SEARCH_KEYS.entity).toEqual([
      'name',
      'code',
      'category',
      'description',
      'targetDate',
    ]);
    expect(CANONICAL_SEARCH_KEYS.document).toEqual(['notes', 'status']);
    expect(canonicalSearchKeys('entity', ['rut'])).toEqual([
      ...CANONICAL_SEARCH_KEYS.entity,
      'rut',
    ]);
    expect(DEFAULT_CONFIG.searchFields).toBeUndefined();
    expect(MODULE_CONFIG.searchFields).toBeUndefined();
  });

  it('sin anulación de perfil busca por todos los campos canónicos', () => {
    const queries = {
      name: 'comercial andina',
      code: 'CLI-001',
      category: 'Ferretería',
      description: 'al por mayor',
      targetDate: '1985-07-14',
    };
    for (const query of Object.values(queries)) {
      expect(search(query, DEFAULT_CONFIG), `búsqueda por ${query}`).toHaveLength(1);
    }
  });
});

describe('Anulación de perfil de clientes (FR-020, FR-055)', () => {
  const { config } = loadModuleConfig(MODULE_CONFIG);

  beforeEach(() => setActiveConfig(config));
  afterEach(() => setActiveConfig(DEFAULT_CONFIG));

  it('deriva los campos buscables de fieldRules sin crear una lista paralela', () => {
    const rules = resolveFieldRules(config, 'entity');
    const keys = searchKeysFor(config);

    expect(keys).toContain('name');
    expect(keys).toContain('targetDate');
    expect(keys).toContain('rut');
    expect(keys).not.toContain('code');
    expect(keys).not.toContain('category');
    expect(keys).not.toContain('description');
    for (const key of ['code', 'category', 'description', 'estado_comercial']) {
      expect(rules[key]).toMatchObject({ hidden: true, searchable: false });
    }
  });

  it('busca por nombre, fecha y campos personalizados visibles', () => {
    for (const query of ['Comercial Andina', '1985-07-14', '11.111.111-1', '+56912345678']) {
      expect(search(query, config), `búsqueda por ${query}`).toHaveLength(1);
    }
  });

  it('no devuelve registros por código, categoría ni descripción ocultos', () => {
    for (const query of ['CLI-001', 'Ferretería', 'Venta al por mayor']) {
      expect(search(query, config), `búsqueda por ${query}`).toEqual([]);
    }
  });

  it('muestra en el buscador exactamente los campos declarados como buscables', () => {
    const placeholder = renderSearchBarHtml(config).match(/placeholder="([^"]+)"/)?.[1] || '';

    expect(placeholder).toContain('Nombre');
    expect(placeholder).toContain('Fecha de nacimiento');
    expect(placeholder).toContain('RUT');
    expect(placeholder).not.toContain('Código');
    expect(placeholder).not.toContain('Categoría');
    expect(placeholder).not.toContain('Descripción');
    expect(placeholder).not.toContain('Estado comercial');
  });
});

describe('Anulaciones explícitas mediante fieldRules', () => {
  afterEach(() => setActiveConfig(DEFAULT_CONFIG));

  it('respeta searchable: false y hidden: true en la misma lista canónica', () => {
    const raw = {
      customFields: {
        entity: [
          { key: 'secreto', type: 'text', label: 'Secreto' },
          { key: 'oculto', type: 'text', label: 'Oculto' },
        ],
        document: [],
      },
      fieldRules: {
        entity: { secreto: { searchable: false }, oculto: { hidden: true } },
      },
    };
    const { config } = loadModuleConfig(raw);
    setActiveConfig(config);
    const rules = resolveFieldRules(config, 'entity');

    expect(isFieldPotentiallySearchable(rules, 'secreto')).toBe(false);
    expect(isFieldPotentiallySearchable(rules, 'oculto')).toBe(false);
    expect(searchKeysFor(config)).not.toContain('secreto');
    expect(searchKeysFor(config)).not.toContain('oculto');
  });

  it('un campo condicional es potencialmente buscable solo para los valores declarados', () => {
    const raw = {
      customFields: {
        entity: [{ key: 'telefono', type: 'text', label: 'Teléfono' }],
        document: [],
      },
      fieldRules: {
        entity: { telefono: { when: { key: 'canal_contacto', equals: 'llamada' } } },
      },
    };
    const { config } = loadModuleConfig(raw);
    setActiveConfig(config);
    const rules = resolveFieldRules(config, 'entity');
    const entity = { ...BASE_ENTITY, telefono: '+56911111111' };

    expect(isFieldPotentiallySearchable(rules, 'telefono')).toBe(true);
    expect(isFieldSearchable(rules, 'telefono', { canal_contacto: 'llamada' })).toBe(true);
    expect(isFieldSearchable(rules, 'telefono', { canal_contacto: 'correo' })).toBe(false);
    expect(search('+56911111111', config, [entity])).toHaveLength(1);
    expect(search('+56911111111', config, [{ ...entity, canal_contacto: 'correo' }])).toEqual([]);
  });
});
