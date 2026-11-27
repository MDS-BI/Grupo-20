export const LOST_REASON_OPTIONS = [
  'Precio alto',
  'Eligió competencia',
  'Sin presupuesto',
  'No responde',
];

const CANONICAL_LOST_STATUS = 'cerrado perdido';

function normalizeText(value) {
  return String(value === null || value === undefined ? '' : value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function lostReasonRule(config) {
  const rule = config?.documentRules?.lostReason;
  return rule && typeof rule === 'object' && !Array.isArray(rule) ? rule : {};
}

function reasonKey(rule) {
  return typeof rule.customField === 'string' && rule.customField
    ? rule.customField
    : 'motivo_perdida';
}

function optionValues(options) {
  return (options || [])
    .map((option) => {
      if (option === null || option === undefined) return '';
      return typeof option === 'object' && !Array.isArray(option) ? option.value : option;
    })
    .map((value) => String(value === null || value === undefined ? '' : value).trim())
    .filter(Boolean);
}

export function hasLostReasonRule(config = {}) {
  return Object.keys(lostReasonRule(config)).length > 0;
}

export function lostReasonStatus(config = {}) {
  const status = lostReasonRule(config).status;
  return typeof status === 'string' && status.trim() ? status.trim() : CANONICAL_LOST_STATUS;
}

export function isLostReasonEligibleEntity(entity = {}, config = {}) {
  const rule = lostReasonRule(config);
  const stateField =
    typeof rule.entityStateField === 'string' && rule.entityStateField
      ? rule.entityStateField
      : 'estado_comercial';
  const expectedState = normalizeText(rule.entityState || 'prospecto');
  const actualState = normalizeText(entity?.[stateField]);
  if (!actualState) return expectedState === normalizeText('prospecto');
  return actualState === expectedState;
}

export function requiresLostReason(document = {}, entity = {}, config = {}) {
  const status = normalizeText(document?.status);
  const statuses = [CANONICAL_LOST_STATUS, normalizeText(lostReasonStatus(config))];
  if (!statuses.includes(status)) return false;
  return isLostReasonEligibleEntity(entity, config);
}

export function requiresLostReasonOptions(config = {}) {
  const options = optionValues(lostReasonRule(config).options);
  return options.length ? options : [...LOST_REASON_OPTIONS];
}

export function lostReasonKey(config = {}) {
  return reasonKey(lostReasonRule(config));
}

export function validateLostReason(document = {}, entity = {}, config = {}) {
  if (!requiresLostReason(document, entity, config)) return true;
  const key = reasonKey(lostReasonRule(config));
  const value = document?.[key];
  const allowed = requiresLostReasonOptions(config);
  const reason = typeof value === 'string' ? value.trim() : '';
  if (!allowed.includes(reason)) {
    throw new Error('El motivo de pérdida es obligatorio.');
  }
  return true;
}

export function isLostReasonActive(document = {}, entity = {}, config = {}) {
  return requiresLostReason(document, entity, config);
}
