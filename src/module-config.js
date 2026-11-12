// Único punto de adaptación del módulo base (Historia de Usuario 5).
//
// Un módulo personalizado reemplaza MODULE_CONFIG por un objeto con su
// propio moduleName, labels, customFields, statusLifecycle y theme, sin
// tocar ningún otro archivo del código central. Dejar MODULE_CONFIG en
// `null` ejecuta el módulo base sin adaptación (FR-024).
export const MODULE_CONFIG = null;

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
};

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
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

  if (raw.statusLifecycle !== undefined && raw.statusLifecycle !== null) {
    const lifecycle = raw.statusLifecycle;
    if (!isPlainObject(lifecycle) || !Array.isArray(lifecycle.states) || lifecycle.states.length === 0) {
      errors.push('statusLifecycle debe declarar un arreglo "states" no vacío.');
    } else {
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
