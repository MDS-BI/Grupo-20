// Único punto de adaptación del módulo base (Historia de Usuario 5).
//
// Un módulo personalizado reemplaza MODULE_CONFIG por un objeto con su
// propio moduleName, labels, customFields, statusLifecycle y theme, sin
// tocar ningún otro archivo del código central. Dejar MODULE_CONFIG en
// `null` ejecuta el módulo base sin adaptación (FR-024).
import { LOCAL_TODAY, isValidISODate } from './utils/entity-date.js';
import { hasFormat } from './utils/field-formats.js';

//
// PERFIL ACTIVO: CRM Comercial (sesión 2026-11-16)
export const MODULE_CONFIG = {
  moduleName: 'CRM Comercial',
  labels: {
    entity: 'Cliente',
    entityPlural: 'Clientes',
    document: 'Interacción',
    documentPlural: 'Interacciones',
    dashboard: 'Panel',
    manage: 'Gestión',
    search: 'Buscar',
    summary: 'Resumen',
  },
  customFields: {
    entity: [
      { key: 'rubro', type: 'text', label: 'Rubro' },
      { key: 'ejecutivo_asignado', type: 'text', label: 'Ejecutivo Asignado' },
      { key: 'canal_contacto', type: 'select', label: 'Canal de Contacto', options: ['llamada', 'correo', 'reunion', 'whatsapp'] },
      { key: 'rut', type: 'text', label: 'RUT' },
      { key: 'contacto_telefono', type: 'text', label: 'Teléfono' },
      { key: 'contacto_correo', type: 'text', label: 'Correo electrónico' },
      { key: 'contacto_lugar', type: 'text', label: 'Lugar/Enlace de reunión' },
      { key: 'contacto_whatsapp', type: 'text', label: 'WhatsApp' },
    ],
    document: [{ key: 'importe', type: 'number', label: 'Importe (USD)' }],
  },
  statusLifecycle: {
    states: ['prospecto', 'contactado', 'en negociacion', 'cerrado ganado', 'cerrado perdido', 'pendiente'],
    transitions: {},
  },
  theme: {
    accentColor: '#0f766e',
  },
  entityDate: {
    label: 'Fecha de nacimiento',
    min: '1910-01-01',
    max: LOCAL_TODAY,
    required: true,
  },
  fieldRules: {
    entity: {
      name: { order: 1 },
      code: { generated: { strategy: 'prefixSequence', prefix: 'CLI-', pad: 3 }, unique: true, hidden: true, searchable: false },
      category: { hidden: true, searchable: false },
      description: { hidden: true, searchable: false },
      rut: {
        label: 'RUT',
        required: true,
        format: 'cl-rut',
        unique: true,
        normalize: 'cl-rut',
        order: 2,
        placeholder: 'Ej: 11.111.111-1',
      },
      targetDate: { order: 3 },
      canal_contacto: {
        label: 'Canal de Contacto',
        required: true,
        order: 4,
        options: [
          { value: 'llamada', label: 'Llamada' },
          { value: 'correo', label: 'Correo' },
          { value: 'reunion', label: 'Reunión' },
          { value: 'whatsapp', label: 'WhatsApp' },
        ],
      },
      contacto_telefono: {
        label: 'Teléfono',
        when: { key: 'canal_contacto', equals: 'llamada' },
        required: true,
        format: 'phone',
        group: 'contactDetail',
        order: 4,
        placeholder: 'Ej: +56 9 1234 5678',
      },
      contacto_correo: {
        label: 'Correo electrónico',
        when: { key: 'canal_contacto', equals: 'correo' },
        required: true,
        format: 'email',
        group: 'contactDetail',
        order: 4,
        placeholder: 'Ej: nombre@ejemplo.cl',
      },
      contacto_lugar: {
        label: 'Lugar/Enlace de reunión',
        when: { key: 'canal_contacto', equals: 'reunion' },
        required: true,
        format: 'nonEmpty',
        group: 'contactDetail',
        order: 4,
        placeholder: 'Ej: Sala 2 o enlace',
      },
      contacto_whatsapp: {
        label: 'WhatsApp',
        when: { key: 'canal_contacto', equals: 'whatsapp' },
        required: true,
        format: 'phone',
        group: 'contactDetail',
        order: 4,
        placeholder: 'Ej: +56 9 1234 5678',
      },
      rubro: {
        label: 'Tipo de actividad',
        type: 'select',
        order: 5,
        options: [
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
        ],
      },
      ejecutivo_asignado: { order: 6 },
    },
    document: {},
  },
  detailPolicy: {
    entity: { blockWhenInvalid: true, offerEditAction: true },
    document: {},
  },
};

export const RESERVED_ENTITY_KEYS = [
  'id', 'entity_id', 'name', 'code', 'category', 'description', 'targetDate', 'createdAt', 'updatedAt',
];
export const RESERVED_DOCUMENT_KEYS = [
  'id', 'entity_id', 'startDate', 'endDate', 'notes', 'status', 'createdAt', 'updatedAt',
];

const VALID_FIELD_TYPES = ['text', 'number', 'date', 'select', 'boolean'];
const HEX_COLOR_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export const FIELD_TYPES = VALID_FIELD_TYPES;
export const BASE_FIELDS = {
  entity: RESERVED_ENTITY_KEYS,
  document: RESERVED_DOCUMENT_KEYS,
};

export const DEFAULT_CONFIG = {
  moduleName: 'Módulo Base ERP',
  labels: {
    entity: 'Entidad',
    entityPlural: 'Entidades',
    document: 'Documento',
    documentPlural: 'Documentos',
    dashboard: 'Panel',
    manage: 'Gestión',
    search: 'Buscar',
    summary: 'Resumen',
  },
  customFields: { entity: [], document: [] },
  statusLifecycle: null,
  theme: { accentColor: null },
  entityDate: null,
  fieldRules: { entity: {}, document: {} },
  detailPolicy: { entity: {}, document: {} },
};

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isValidRuleOption(option) {
  if (typeof option === 'string') return option.length > 0;
  return (
    isPlainObject(option) &&
    typeof option.value === 'string' &&
    option.value.length > 0 &&
    typeof option.label === 'string' &&
    option.label.length > 0
  );
}

function normalizeRule(rule) {
  const normalized = { ...rule };
  if (isPlainObject(rule.when)) normalized.when = { ...rule.when };
  if (isPlainObject(rule.generated)) normalized.generated = { ...rule.generated };
  if (Array.isArray(rule.options)) {
    normalized.options = rule.options.map((option) => (isPlainObject(option) ? { ...option } : option));
  }
  return normalized;
}

function isValidEntityDateRule(rule) {
  if (!isPlainObject(rule)) return false;
  if (rule.label !== undefined && (typeof rule.label !== 'string' || !rule.label.trim())) return false;
  if (rule.min !== undefined && !isValidISODate(rule.min)) return false;
  if (rule.max !== undefined && rule.max !== LOCAL_TODAY && !isValidISODate(rule.max)) return false;
  if (rule.required !== undefined && typeof rule.required !== 'boolean') return false;
  return true;
}

function normalizeEntityDateRule(rule) {
  return isPlainObject(rule) ? { ...rule } : null;
}

function normalizeRuleMap(map) {
  if (!isPlainObject(map)) return {};
  const normalized = {};
  for (const [key, rule] of Object.entries(map)) {
    if (!isPlainObject(rule)) continue;
    normalized[key] = normalizeRule(rule);
  }
  return normalized;
}

function normalizeFieldRules(raw) {
  if (!isPlainObject(raw)) return { entity: {}, document: {} };
  const global = {};
  for (const [key, rule] of Object.entries(raw)) {
    if (key === 'entity' || key === 'document') continue;
    if (isPlainObject(rule)) global[key] = normalizeRule(rule);
  }
  return {
    ...global,
    entity: normalizeRuleMap(raw.entity),
    document: normalizeRuleMap(raw.document),
  };
}

function normalizeDetailPolicy(raw) {
  if (!isPlainObject(raw)) return { entity: {}, document: {} };
  return {
    entity: isPlainObject(raw.entity) ? { ...raw.entity } : {},
    document: isPlainObject(raw.document) ? { ...raw.document } : {},
  };
}

function validateFieldRules(raw, errors) {
  if (!isPlainObject(raw)) {
    errors.push('fieldRules debe ser un objeto.');
    return;
  }
  const maps = [];
  for (const [key, value] of Object.entries(raw)) {
    if (key !== 'entity' && key !== 'document' && isPlainObject(value)) maps.push([key, value]);
  }
  maps.push(['entity', raw.entity], ['document', raw.document]);
  for (const [scope, map] of maps) {
    if (map === undefined) continue;
    if (!isPlainObject(map)) {
      errors.push(`fieldRules.${scope} debe ser un objeto.`);
      continue;
    }
    for (const [key, rule] of Object.entries(map)) {
      const path = scope === 'entity' || scope === 'document' ? `fieldRules.${scope}.${key}` : `fieldRules.${key}`;
      if (!isPlainObject(rule)) {
        errors.push(`${path} debe ser un objeto.`);
        continue;
      }
      if (rule.format !== undefined && !hasFormat(rule.format)) {
        errors.push(`${path} declara un formato desconocido: "${rule.format}".`);
      }
      if (rule.when !== undefined && (!isPlainObject(rule.when) || !rule.when.key || rule.when.equals === undefined)) {
        errors.push(`${path}.when debe declarar "key" y "equals".`);
      }
      if (rule.generated !== undefined && !isPlainObject(rule.generated)) {
        errors.push(`${path}.generated debe ser un objeto.`);
      }
      if (rule.group !== undefined && typeof rule.group !== 'string') {
        errors.push(`${path}.group debe ser una cadena.`);
      }
      if (rule.label !== undefined && typeof rule.label !== 'string') {
        errors.push(`${path}.label debe ser una cadena.`);
      }
      if (rule.placeholder !== undefined && typeof rule.placeholder !== 'string') {
        errors.push(`${path}.placeholder debe ser una cadena.`);
      }
      if (rule.order !== undefined && (typeof rule.order !== 'number' || !Number.isFinite(rule.order))) {
        errors.push(`${path}.order debe ser un número finito.`);
      }
      if (rule.options !== undefined && (!Array.isArray(rule.options) || !rule.options.every(isValidRuleOption))) {
        errors.push(`${path}.options debe ser una lista de cadenas o de objetos con "value" y "label".`);
      }
      for (const flag of ['required', 'hidden', 'searchable', 'unique']) {
        if (rule[flag] !== undefined && typeof rule[flag] !== 'boolean') {
          errors.push(`${path}.${flag} debe ser booleano.`);
        }
      }
    }
  }
}

function validateDetailPolicy(raw, errors) {
  if (!isPlainObject(raw)) {
    errors.push('detailPolicy debe ser un objeto.');
    return;
  }
  for (const kind of ['entity', 'document']) {
    const policy = raw[kind];
    if (policy === undefined) continue;
    if (!isPlainObject(policy)) {
      errors.push(`detailPolicy.${kind} debe ser un objeto.`);
      continue;
    }
    for (const flag of ['blockWhenInvalid', 'offerEditAction']) {
      if (policy[flag] !== undefined && typeof policy[flag] !== 'boolean') {
        errors.push(`detailPolicy.${kind}.${flag} debe ser booleano.`);
      }
    }
  }
}

/**
 * Returns a list of human-readable problems with a raw module config.
 * An empty/absent config (null/undefined) is not an error — it just means
 * "use the defaults" (FR-024). A non-empty array means the config must not
 * be trusted and the caller should fall back to DEFAULT_CONFIG (FR-025).
 */
export function validateConfig(raw) {
  const errors = [];
  if (!isPlainObject(raw)) return errors;

  if (raw.moduleName !== undefined && (typeof raw.moduleName !== 'string' || !raw.moduleName.trim())) {
    errors.push('moduleName debe ser una cadena no vacía.');
  }
  if (raw.labels !== undefined && !isPlainObject(raw.labels)) {
    errors.push('labels debe ser un objeto.');
  }

  for (const kind of ['entity', 'document']) {
    const defs = raw.customFields?.[kind];
    if (defs === undefined) continue;
    if (!Array.isArray(defs)) {
      errors.push(`customFields.${kind} debe ser un arreglo.`);
      continue;
    }
    const reserved = kind === 'entity' ? RESERVED_ENTITY_KEYS : RESERVED_DOCUMENT_KEYS;
    const seen = new Set();
    for (const def of defs) {
      if (!isPlainObject(def) || !def.key) {
        errors.push(`Cada campo personalizado de ${kind} necesita una clave ("key").`);
        continue;
      }
      if (reserved.includes(def.key)) {
        errors.push(`El campo personalizado "${def.key}" choca con un nombre de campo base de ${kind}.`);
      }
      if (seen.has(def.key)) {
        errors.push(`El campo personalizado "${def.key}" está declarado más de una vez.`);
      }
      seen.add(def.key);
      if (def.type && !VALID_FIELD_TYPES.includes(def.type)) {
        errors.push(`El campo personalizado "${def.key}" declara un tipo desconocido: "${def.type}".`);
      }
    }
  }

  if (raw.entityDate !== undefined && raw.entityDate !== null && !isValidEntityDateRule(raw.entityDate)) {
    errors.push('entityDate debe declarar una etiqueta, min ISO y max ISO o "localToday" válidos.');
  }

  if (raw.fieldRules !== undefined) validateFieldRules(raw.fieldRules, errors);
  if (raw.detailPolicy !== undefined) validateDetailPolicy(raw.detailPolicy, errors);

  if (raw.statusLifecycle !== undefined && raw.statusLifecycle !== null) {
    const lifecycle = raw.statusLifecycle;
    if (!isPlainObject(lifecycle) || !Array.isArray(lifecycle.states) || lifecycle.states.length === 0) {
      errors.push('statusLifecycle debe declarar un arreglo "states" no vacío.');
    } else {
      if (lifecycle.pendingStates !== undefined) {
        if (!Array.isArray(lifecycle.pendingStates)) {
          errors.push('statusLifecycle.pendingStates debe ser un arreglo.');
        } else {
          for (const state of lifecycle.pendingStates) {
            if (!lifecycle.states.includes(state)) {
              errors.push(`statusLifecycle.pendingStates referencia un estado desconocido: "${state}".`);
            }
          }
        }
      }
      const transitions = lifecycle.transitions || {};
      for (const [from, tos] of Object.entries(transitions)) {
        if (!lifecycle.states.includes(from)) {
          errors.push(`statusLifecycle.transitions referencia un estado desconocido: "${from}".`);
        }
        for (const to of tos) {
          if (!lifecycle.states.includes(to)) {
            errors.push(`statusLifecycle.transitions.${from} referencia un estado desconocido: "${to}".`);
          }
        }
      }
    }
  }

  return errors;
}

/** FR-038: un accentColor inválido retrocede en silencio, sin invalidar el resto de la configuración. */
export function sanitizeAccentColor(accentColor) {
  return accentColor && HEX_COLOR_RE.test(accentColor) ? accentColor : null;
}

/**
 * Loads and validates a module config, falling back to DEFAULT_CONFIG with
 * a visible warning when it is absent, invalid or conflicting (FR-023..FR-025).
 */
export function loadModuleConfig(rawConfig = MODULE_CONFIG) {
  if (!rawConfig) {
    return { config: DEFAULT_CONFIG, warning: null };
  }
  const errors = validateConfig(rawConfig);
  if (errors.length) {
    return {
      config: DEFAULT_CONFIG,
      warning: `Configuración del módulo inválida; se usan los valores predeterminados. Detalle: ${errors.join(' ')}`,
    };
  }
  const config = {
    moduleName: rawConfig.moduleName || DEFAULT_CONFIG.moduleName,
    labels: { ...DEFAULT_CONFIG.labels, ...(rawConfig.labels || {}) },
    customFields: {
      entity: rawConfig.customFields?.entity || [],
      document: rawConfig.customFields?.document || [],
    },
    statusLifecycle: rawConfig.statusLifecycle || null,
    theme: {
      ...DEFAULT_CONFIG.theme,
      ...(rawConfig.theme || {}),
      accentColor: sanitizeAccentColor(rawConfig.theme?.accentColor),
    },
    entityDate: normalizeEntityDateRule(rawConfig.entityDate),
    fieldRules: normalizeFieldRules(rawConfig.fieldRules),
    detailPolicy: normalizeDetailPolicy(rawConfig.detailPolicy),
  };
  return { config, warning: null };
}

export function getLabel(config, key) {
  return (config?.labels && config.labels[key]) || DEFAULT_CONFIG.labels[key] || key;
}

function normalizeCustomFields(rawCustomFields) {
  if (Array.isArray(rawCustomFields)) {
    const grouped = { entity: [], document: [] };
    for (const def of rawCustomFields) {
      const kind = def?.target === 'document' ? 'document' : 'entity';
      grouped[kind].push(def);
    }
    return grouped;
  }
  if (isPlainObject(rawCustomFields)) {
    return {
      entity: Array.isArray(rawCustomFields.entity) ? rawCustomFields.entity : [],
      document: Array.isArray(rawCustomFields.document) ? rawCustomFields.document : [],
    };
  }
  return { entity: [], document: [] };
}

/**
 * Normalizes either the object-shaped config used internally or the compact
 * test/module shape with `customFields: [{ target, key, ... }]`.
 * Returns `{ config, errors }`; invalid configs fall back to DEFAULT_CONFIG.
 */
export function normalizeConfig(rawConfig) {
  if (rawConfig === null || rawConfig === undefined) {
    return { config: DEFAULT_CONFIG, errors: [] };
  }
  if (!isPlainObject(rawConfig)) {
    return { config: DEFAULT_CONFIG, errors: ['La configuración debe ser un objeto.'] };
  }

  const candidate = {
    moduleName: rawConfig.moduleName === undefined ? DEFAULT_CONFIG.moduleName : rawConfig.moduleName,
    labels: isPlainObject(rawConfig.labels) ? rawConfig.labels : rawConfig.labels === undefined ? {} : rawConfig.labels,
    customFields: normalizeCustomFields(rawConfig.customFields),
    statusLifecycle: rawConfig.statusLifecycle ?? null,
    theme: isPlainObject(rawConfig.theme) ? rawConfig.theme : rawConfig.theme === undefined ? {} : rawConfig.theme,
    entityDate: rawConfig.entityDate ?? null,
    fieldRules: rawConfig.fieldRules ?? {},
    detailPolicy: rawConfig.detailPolicy ?? {},
  };
  const errors = validateConfig(candidate);
  if (errors.length) {
    return { config: DEFAULT_CONFIG, errors };
  }

  return {
    config: {
      moduleName: candidate.moduleName || DEFAULT_CONFIG.moduleName,
      labels: { ...DEFAULT_CONFIG.labels, ...candidate.labels },
      customFields: candidate.customFields,
      statusLifecycle: candidate.statusLifecycle,
      theme: {
        ...DEFAULT_CONFIG.theme,
        ...candidate.theme,
        accentColor: sanitizeAccentColor(candidate.theme.accentColor),
      },
      entityDate: normalizeEntityDateRule(candidate.entityDate),
      fieldRules: normalizeFieldRules(candidate.fieldRules),
      detailPolicy: normalizeDetailPolicy(candidate.detailPolicy),
    },
    errors: [],
  };
}

let activeConfig = DEFAULT_CONFIG;

export function setActiveConfig(rawConfig) {
  if (rawConfig && typeof rawConfig === 'object' && rawConfig.config && Array.isArray(rawConfig.errors)) {
    activeConfig = rawConfig.errors.length ? DEFAULT_CONFIG : rawConfig.config;
    return activeConfig;
  }
  activeConfig = normalizeConfig(rawConfig).config;
  return activeConfig;
}

export function getConfig() {
  return activeConfig;
}

const LABEL_ALIASES = {
  entities: 'entityPlural',
  documents: 'documentPlural',
};

export function labelFor(key) {
  return getLabel(getConfig(), LABEL_ALIASES[key] || key);
}
