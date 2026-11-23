import { MARKETING_STAGES as STAGES } from './marketing-stages.js';

export const MARKETING_STAGES = STAGES;

export const DEFAULT_MARKETING_CONFIG = {
  privacyNoticeVersion: '2026-11-23',
  automationRules: [],
  captureFields: [],
};

const AUTOMATION_EVENTS = ['entity_created', 'stage_changed', 'document_created'];
const AUTOMATION_ACTIONS = ['create_document', 'notify'];

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function validateMarketingConfig(raw, errors = []) {
  if (raw === undefined || raw === null) return errors;
  if (!isPlainObject(raw)) {
    errors.push('marketing debe ser un objeto.');
    return errors;
  }
  if (raw.privacyNoticeVersion !== undefined &&
      (typeof raw.privacyNoticeVersion !== 'string' || !raw.privacyNoticeVersion.trim())) {
    errors.push('marketing.privacyNoticeVersion debe ser una cadena no vacía.');
  }
  if (raw.captureFields !== undefined &&
      (!Array.isArray(raw.captureFields) || !raw.captureFields.every((key) => typeof key === 'string' && key.trim()))) {
    errors.push('marketing.captureFields debe ser una lista de claves no vacías.');
  }
  if (raw.automationRules !== undefined && !Array.isArray(raw.automationRules)) {
    errors.push('marketing.automationRules debe ser una lista.');
    return errors;
  }
  for (const [index, rule] of (raw.automationRules || []).entries()) {
    const path = `marketing.automationRules[${index}]`;
    if (!isPlainObject(rule)) {
      errors.push(`${path} debe ser un objeto.`);
      continue;
    }
    if (!AUTOMATION_EVENTS.includes(rule.event)) {
      errors.push(`${path}.event debe ser ${AUTOMATION_EVENTS.join(', ')}.`);
    }
    if (!AUTOMATION_ACTIONS.includes(rule.action)) {
      errors.push(`${path}.action debe ser ${AUTOMATION_ACTIONS.join(', ')}.`);
    }
    if (typeof rule.label !== 'string' || !rule.label.trim()) {
      errors.push(`${path}.label debe ser una cadena no vacía.`);
    }
    for (const key of ['from', 'to']) {
      if (rule[key] !== undefined && rule[key] !== null && !STAGES.includes(rule[key])) {
        errors.push(`${path}.${key} referencia un estado comercial desconocido.`);
      }
    }
  }
  return errors;
}

export function normalizeMarketingConfig(raw) {
  const errors = validateMarketingConfig(raw);
  if (!isPlainObject(raw) || errors.length) {
    return {
      config: {
        privacyNoticeVersion: DEFAULT_MARKETING_CONFIG.privacyNoticeVersion,
        automationRules: [],
        captureFields: [],
      },
      errors,
    };
  }
  return {
    config: {
      privacyNoticeVersion: raw.privacyNoticeVersion || DEFAULT_MARKETING_CONFIG.privacyNoticeVersion,
      automationRules: (raw.automationRules || []).map((rule) => ({
        event: rule.event,
        action: rule.action,
        label: rule.label,
        ...(rule.from !== undefined && rule.from !== null ? { from: rule.from } : {}),
        ...(rule.to !== undefined && rule.to !== null ? { to: rule.to } : {}),
      })),
      captureFields: [...(raw.captureFields || [])],
    },
    errors: [],
  };
}
