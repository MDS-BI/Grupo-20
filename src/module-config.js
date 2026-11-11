const BASE_ENTITY_FIELDS = [
  'id', 'entity_id', 'name', 'code', 'taxId', 'email', 'phone', 'address',
  'category', 'description', 'targetDate', 'creditLimit', 'paymentTerms',
  'createdAt', 'updatedAt'
];

const BASE_DOCUMENT_FIELDS = [
  'id', 'entity_id', 'series', 'folio', 'startDate', 'endDate', 'quantity',
  'subtotal', 'discount', 'taxAmount', 'totalAmount', 'currency',
  'paymentTerms', 'notes', 'status', 'createdAt', 'updatedAt'
];

export const BASE_FIELDS = {
  entity: BASE_ENTITY_FIELDS,
  document: BASE_DOCUMENT_FIELDS
};

export const FIELD_TYPES = ['text', 'number', 'date', 'select'];

const DEFAULT_LABELS = {
  entity: 'Entidad',
  entities: 'Entidades',
  document: 'Documento',
  documents: 'Documentos'
};

export const DEFAULT_CONFIG = Object.freeze({
  moduleName: 'Módulo Base ERP',
  labels: Object.freeze({ ...DEFAULT_LABELS }),
  customFields: Object.freeze([]),
  statusLifecycle: null,
  theme: Object.freeze({ accentColor: '#2563eb' })
});

export const userConfig = null;

const HEX_COLOR = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function defaultConfig() {
  return clone(DEFAULT_CONFIG);
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function baseFieldSet(target) {
  return new Set([...(BASE_FIELDS.entity || []), ...(BASE_FIELDS.document || [])]);
}

function normalizeLabels(raw, errors) {
  const labels = { ...DEFAULT_LABELS };
  if (raw === undefined || raw === null) return labels;
  if (!isPlainObject(raw)) {
    errors.push('labels debe ser un objeto de mapeos de términos.');
    return labels;
  }
  for (const key of Object.keys(DEFAULT_LABELS)) {
    if (raw[key] !== undefined) {
      if (nonEmptyString(raw[key])) {
        labels[key] = raw[key].trim();
      } else {
        errors.push(`labels.${key} debe ser un texto no vacío; se usa el valor predeterminado.`);
      }
    }
  }
  return labels;
}

function normalizeCustomFields(raw, errors) {
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw)) {
    errors.push('customFields debe ser una lista de definiciones de campo.');
    return [];
  }

  const fields = [];
  const seen = new Set();
  const baseFields = baseFieldSet();

  raw.forEach((field, index) => {
    const prefix = `customFields[${index}]`;
    if (!isPlainObject(field)) {
      errors.push(`${prefix} debe ser un objeto.`);
      return;
    }

    const target = field.target;
    if (target !== 'entity' && target !== 'document') {
      errors.push(`${prefix}.target debe ser "entity" o "document".`);
      return;
    }

    if (!nonEmptyString(field.key)) {
      errors.push(`${prefix}.key debe ser un texto no vacío.`);
      return;
    }
    const key = field.key.trim();

    if (baseFields.has(key)) {
      errors.push(`${prefix}.key "${key}" choca con un campo base.`);
      return;
    }

    if (!FIELD_TYPES.includes(field.type)) {
      errors.push(`${prefix}.type "${field.type}" no es un tipo de campo válido.`);
      return;
    }

    if (!nonEmptyString(field.label)) {
      errors.push(`${prefix}.label debe ser un texto no vacío.`);
      return;
    }

    const dedupeKey = `${target}:${key}`;
    if (seen.has(dedupeKey)) {
      errors.push(`${prefix}.key "${key}" está declarado más de una vez para ${target}.`);
      return;
    }

    let options;
    if (field.type === 'select') {
      if (!Array.isArray(field.options) || field.options.length === 0) {
        errors.push(`${prefix}.options es obligatorio para campos de selección.`);
        return;
      }
      if (!field.options.every(option => typeof option === 'string' && option.trim().length > 0)) {
        errors.push(`${prefix}.options debe contener textos no vacíos.`);
        return;
      }
      options = field.options.map(option => option.trim());
    }

    seen.add(dedupeKey);
    const normalized = {
      target,
      key,
      label: field.label.trim(),
      type: field.type,
      required: field.required === true
    };
    if (options) normalized.options = options;
    fields.push(normalized);
  });

  return fields;
}

function normalizeLifecycle(raw, errors) {
  if (raw === undefined || raw === null) return null;
  if (!isPlainObject(raw)) {
    errors.push('statusLifecycle debe ser un objeto o null.');
    return null;
  }

  const statuses = raw.statuses;
  if (!Array.isArray(statuses) || statuses.length === 0) {
    errors.push('statusLifecycle.statuses debe ser una lista no vacía.');
    return null;
  }
  if (!statuses.every(status => typeof status === 'string' && status.trim().length > 0)) {
    errors.push('statusLifecycle.statuses debe contener textos no vacíos.');
    return null;
  }

  const statusSet = new Set(statuses.map(status => status.trim()));
  if (statusSet.size !== statuses.length) {
    errors.push('statusLifecycle.statuses no puede contener estados duplicados.');
    return null;
  }

  const transitions = raw.transitions;
  if (transitions !== undefined && !isPlainObject(transitions)) {
    errors.push('statusLifecycle.transitions debe ser un objeto.');
    return null;
  }

  const normalizedTransitions = {};
  for (const status of statusSet) {
    normalizedTransitions[status] = [];
  }

  if (isPlainObject(transitions)) {
    for (const [from, targets] of Object.entries(transitions)) {
      if (!statusSet.has(from)) {
        errors.push(`statusLifecycle.transitions referencia el estado desconocido "${from}".`);
        continue;
      }
      if (!Array.isArray(targets)) {
        errors.push(`statusLifecycle.transitions.${from} debe ser una lista de estados.`);
        continue;
      }
      for (const target of targets) {
        if (!statusSet.has(target)) {
          errors.push(`statusLifecycle.transitions.${from} referencia el estado desconocido "${target}".`);
          continue;
        }
        normalizedTransitions[from].push(target);
      }
    }
  }

  return {
    statuses: [...statusSet],
    transitions: normalizedTransitions
  };
}

function normalizeTheme(raw, errors) {
  const theme = { accentColor: DEFAULT_CONFIG.theme.accentColor };
  if (raw === undefined || raw === null) return theme;
  if (!isPlainObject(raw)) {
    errors.push('theme debe ser un objeto de configuración de marca.');
    return theme;
  }
  if (raw.accentColor !== undefined) {
    if (typeof raw.accentColor === 'string' && HEX_COLOR.test(raw.accentColor.trim())) {
      theme.accentColor = raw.accentColor.trim();
    } else {
      errors.push('theme.accentColor debe ser un color hexadecimal válido (por ejemplo #0f62fe).');
    }
  }
  return theme;
}

export function normalizeConfig(raw) {
  if (raw === undefined || raw === null) {
    return { config: defaultConfig(), errors: [] };
  }

  const errors = [];
  if (!isPlainObject(raw)) {
    return {
      config: defaultConfig(),
      errors: ['La configuración del módulo debe ser un objeto.']
    };
  }

  const config = defaultConfig();

  if (raw.moduleName !== undefined) {
    if (nonEmptyString(raw.moduleName)) {
      config.moduleName = raw.moduleName.trim();
    } else {
      errors.push('moduleName debe ser un texto no vacío; se usa el nombre predeterminado.');
    }
  }

  config.labels = normalizeLabels(raw.labels, errors);
  config.customFields = normalizeCustomFields(raw.customFields, errors);
  config.statusLifecycle = normalizeLifecycle(raw.statusLifecycle, errors);
  config.theme = normalizeTheme(raw.theme, errors);

  return { config, errors };
}

let activeConfig = defaultConfig();

export function setActiveConfig(config) {
  if (!config) {
    activeConfig = defaultConfig();
    return activeConfig;
  }

  const { config: normalized } = normalizeConfig(config);
  activeConfig = normalized;
  return activeConfig;
}

export function getConfig() {
  return activeConfig;
}

export function labelFor(key) {
  const labels = activeConfig && activeConfig.labels ? activeConfig.labels : DEFAULT_LABELS;
  if (labels[key]) return labels[key];
  return DEFAULT_LABELS[key] || '';
}

export async function loadModuleConfig() {
  return normalizeConfig(userConfig);
}
