import { MESSAGES } from './messages.js';

export const DEFAULT_POSTVENTA_CONFIG = Object.freeze({
  states: Object.freeze(['Abierto', 'En revisión', 'Resuelto']),
  categoryOptions: Object.freeze([
    Object.freeze({ value: 'soporte_tecnico', label: 'Soporte técnico' }),
    Object.freeze({ value: 'facturacion', label: 'Facturación' }),
    Object.freeze({ value: 'garantia', label: 'Garantía' }),
    Object.freeze({ value: 'consulta', label: 'Consulta' }),
  ]),
  priorityOptions: Object.freeze([
    Object.freeze({ value: 'baja', label: 'Baja' }),
    Object.freeze({ value: 'media', label: 'Media' }),
    Object.freeze({ value: 'alta', label: 'Alta' }),
  ]),
  cardMapping: Object.freeze({
    abiertos: 'Abierto',
    enProceso: 'En revisión',
    resueltos: 'Resuelto',
  }),
  resolutionNoteStates: Object.freeze(['Resuelto']),
  transitions: Object.freeze([]),
});

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function sameStrings(actual, expected) {
  return (
    Array.isArray(actual) &&
    actual.length === expected.length &&
    actual.every((value, index) => value === expected[index])
  );
}

function sameOptions(actual, expected) {
  return (
    Array.isArray(actual) &&
    actual.length === expected.length &&
    actual.every(
      (option, index) =>
        isPlainObject(option) &&
        option.value === expected[index].value &&
        option.label === expected[index].label
    )
  );
}

export function validatePostventaConfig(raw, errors = []) {
  if (!isPlainObject(raw)) {
    errors.push('postventa debe ser un objeto.');
    return errors;
  }
  if (!sameStrings(raw.states, DEFAULT_POSTVENTA_CONFIG.states)) {
    errors.push('postventa.states debe ser exactamente ["Abierto", "En revisión", "Resuelto"].');
  }
  if (!sameOptions(raw.categoryOptions, DEFAULT_POSTVENTA_CONFIG.categoryOptions)) {
    errors.push('postventa.categoryOptions no declara las categorías contratadas.');
  }
  if (!sameOptions(raw.priorityOptions, DEFAULT_POSTVENTA_CONFIG.priorityOptions)) {
    errors.push('postventa.priorityOptions no declara las prioridades contratadas.');
  }
  if (!isPlainObject(raw.cardMapping)) {
    errors.push('postventa.cardMapping debe ser un objeto.');
  } else {
    for (const key of ['abiertos', 'enProceso', 'resueltos']) {
      if (raw.cardMapping[key] !== DEFAULT_POSTVENTA_CONFIG.cardMapping[key]) {
        errors.push(`postventa.cardMapping.${key} no coincide con el estado contratado.`);
      }
    }
    if (Object.keys(raw.cardMapping).length !== 3) {
      errors.push('postventa.cardMapping declara claves adicionales.');
    }
  }
  if (!sameStrings(raw.resolutionNoteStates, DEFAULT_POSTVENTA_CONFIG.resolutionNoteStates)) {
    errors.push('postventa.resolutionNoteStates debe ser exactamente ["Resuelto"].');
  }
  if (!Array.isArray(raw.transitions) || raw.transitions.length !== 0) {
    errors.push('postventa.transitions debe ser una lista vacía.');
  }
  if (Object.prototype.hasOwnProperty.call(raw, 'defaultPriority')) {
    errors.push('postventa no debe preseleccionar una prioridad.');
  }
  return errors;
}

export function normalizePostventaConfig(raw) {
  return {
    states: [...raw.states],
    categoryOptions: raw.categoryOptions.map((option) => ({ ...option })),
    priorityOptions: raw.priorityOptions.map((option) => ({ ...option })),
    cardMapping: { ...raw.cardMapping },
    resolutionNoteStates: [...raw.resolutionNoteStates],
    transitions: [...raw.transitions],
  };
}

export function isTicket(document) {
  return document?.ticket === true;
}

export function allowsTicketTransition(fromStatus, toStatus, config = DEFAULT_POSTVENTA_CONFIG) {
  const postventa = config?.postventa || config || DEFAULT_POSTVENTA_CONFIG;
  const states = postventa.states || DEFAULT_POSTVENTA_CONFIG.states;
  if (!states.includes(fromStatus) || !states.includes(toStatus)) return false;
  const transitions = postventa.transitions || DEFAULT_POSTVENTA_CONFIG.transitions;
  if (!Array.isArray(transitions) || transitions.length === 0) return true;
  return transitions.some(
    (transition) =>
      (isPlainObject(transition) && transition.from === fromStatus && transition.to === toStatus) ||
      (Array.isArray(transition) && transition[0] === fromStatus && transition[1] === toStatus)
  );
}

function resolvePostventaConfig(config) {
  if (!config) return DEFAULT_POSTVENTA_CONFIG;
  return config.postventa || config;
}

function optionValues(options) {
  return (options || []).map((option) => (typeof option === 'string' ? option : option?.value));
}

export function validateTicketValues(values = {}, { entities = [], config = null } = {}) {
  const errors = {};
  const postventa = resolvePostventaConfig(config);
  const states = postventa.states || DEFAULT_POSTVENTA_CONFIG.states;
  const categories = optionValues(
    postventa.categoryOptions || DEFAULT_POSTVENTA_CONFIG.categoryOptions
  );
  const priorities = optionValues(
    postventa.priorityOptions || DEFAULT_POSTVENTA_CONFIG.priorityOptions
  );
  const noteStates =
    postventa.resolutionNoteStates || DEFAULT_POSTVENTA_CONFIG.resolutionNoteStates;
  const entityId = values.entity_id || values.entityId;
  const status = values.status || states[0];

  if (
    !entityId ||
    !entities.some((entity) => entity.entity_id === entityId || entity.id === entityId)
  ) {
    errors.entity_id = 'El cliente seleccionado no existe.';
  }
  if (values.categoria && !categories.includes(values.categoria)) {
    errors.categoria = MESSAGES.required;
  }
  if (values.prioridad && !priorities.includes(values.prioridad)) {
    errors.prioridad = MESSAGES.required;
  }
  if (!states.includes(status)) errors.status = MESSAGES.required;

  const missing = [
    !String(values.asunto || '').trim(),
    !String(values.categoria || '').trim(),
    !String(values.prioridad || '').trim(),
    !states.includes(status),
    noteStates.includes(status) && !String(values.nota_resolucion || '').trim(),
  ];
  if (missing.some(Boolean)) errors._form = MESSAGES.required;
  return errors;
}

export function computeTicketStats({ documents = [], config = null } = {}) {
  const postventa = resolvePostventaConfig(config);
  const mapping = postventa.cardMapping || DEFAULT_POSTVENTA_CONFIG.cardMapping;
  const stats = { abiertos: 0, enProceso: 0, resueltos: 0 };
  const seen = new Set();
  for (const document of documents) {
    if (!isTicket(document)) continue;
    const key = document.id || document;
    if (seen.has(key)) continue;
    seen.add(key);
    if (document.status === mapping.abiertos) stats.abiertos += 1;
    else if (document.status === mapping.enProceso) stats.enProceso += 1;
    else if (document.status === mapping.resueltos) stats.resueltos += 1;
  }
  return stats;
}
