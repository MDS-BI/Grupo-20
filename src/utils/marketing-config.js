import { MARKETING_STAGES as STAGES } from './marketing-stages.js';
import { isValidISODate } from './entity-date.js';

export const MARKETING_STAGES = STAGES;

export const DEFAULT_MARKETING_CONFIG = {
  privacyNoticeVersion: '2026-11-23',
  automationRules: [],
  captureFields: [],
  salesTeams: [],
  faq: [],
  campaigns: [],
};

const AUTOMATION_EVENTS = ['entity_created', 'stage_changed', 'document_created'];
const AUTOMATION_ACTIONS = ['create_document', 'notify', 'assign_executive', 'update_stage'];
const CAMPAIGN_ACTIONS = ['create_document', 'assign_executive', 'update_stage'];

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function nonEmptyText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

export function validateMarketingConfig(raw, errors = []) {
  if (raw === undefined || raw === null) return errors;
  if (!isPlainObject(raw)) {
    errors.push('marketing debe ser un objeto.');
    return errors;
  }
  if (raw.privacyNoticeVersion !== undefined && !nonEmptyText(raw.privacyNoticeVersion)) {
    errors.push('marketing.privacyNoticeVersion debe ser una cadena no vacía.');
  }
  if (
    raw.captureFields !== undefined &&
    (!Array.isArray(raw.captureFields) || !raw.captureFields.every((key) => nonEmptyText(key)))
  ) {
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
    if (!nonEmptyText(rule.label)) {
      errors.push(`${path}.label debe ser una cadena no vacía.`);
    }
    for (const key of ['from', 'to']) {
      if (rule[key] !== undefined && rule[key] !== null && !STAGES.includes(rule[key])) {
        errors.push(`${path}.${key} referencia un estado comercial desconocido.`);
      }
    }
  }
  if (raw.salesTeams !== undefined && !Array.isArray(raw.salesTeams)) {
    errors.push('marketing.salesTeams debe ser una lista.');
  } else {
    for (const [index, team] of safeArray(raw.salesTeams).entries()) {
      const path = `marketing.salesTeams[${index}]`;
      if (!isPlainObject(team)) {
        errors.push(`${path} debe ser un objeto.`);
        continue;
      }
      if (!nonEmptyText(team.name)) errors.push(`${path}.name debe ser una cadena no vacía.`);
      if (team.members !== undefined && !Array.isArray(team.members)) {
        errors.push(`${path}.members debe ser una lista.`);
        continue;
      }
      for (const [memberIndex, member] of safeArray(team.members).entries()) {
        const memberPath = `${path}.members[${memberIndex}]`;
        if (!isPlainObject(member)) {
          errors.push(`${memberPath} debe ser un objeto.`);
          continue;
        }
        if (!nonEmptyText(member.name))
          errors.push(`${memberPath}.name debe ser una cadena no vacía.`);
        if (!nonEmptyText(member.role))
          errors.push(`${memberPath}.role debe ser una cadena no vacía.`);
        if (member.active !== undefined && typeof member.active !== 'boolean') {
          errors.push(`${memberPath}.active debe ser booleano.`);
        }
      }
    }
  }
  if (raw.faq !== undefined && !Array.isArray(raw.faq)) {
    errors.push('marketing.faq debe ser una lista.');
  } else {
    for (const [index, item] of safeArray(raw.faq).entries()) {
      const path = `marketing.faq[${index}]`;
      if (!isPlainObject(item)) {
        errors.push(`${path} debe ser un objeto.`);
        continue;
      }
      if (!nonEmptyText(item.pregunta))
        errors.push(`${path}.pregunta debe ser una cadena no vacía.`);
      if (!nonEmptyText(item.respuesta))
        errors.push(`${path}.respuesta debe ser una cadena no vacía.`);
    }
  }
  if (raw.campaigns !== undefined && !Array.isArray(raw.campaigns)) {
    errors.push('marketing.campaigns debe ser una lista.');
  } else {
    for (const [index, campaign] of safeArray(raw.campaigns).entries()) {
      const path = `marketing.campaigns[${index}]`;
      if (!isPlainObject(campaign)) {
        errors.push(`${path} debe ser un objeto.`);
        continue;
      }
      if (!nonEmptyText(campaign.name)) errors.push(`${path}.name debe ser una cadena no vacía.`);
      if (!STAGES.includes(campaign.stage)) errors.push(`${path}.stage no es una etapa válida.`);
      for (const key of ['startDate', 'endDate']) {
        if (campaign[key] !== undefined && !isValidISODate(campaign[key])) {
          errors.push(`${path}.${key} debe ser una fecha ISO válida.`);
        }
      }
      if (campaign.startDate && campaign.endDate && campaign.endDate < campaign.startDate) {
        errors.push(`${path}.endDate no puede ser anterior a startDate.`);
      }
      if (campaign.action !== undefined && !CAMPAIGN_ACTIONS.includes(campaign.action)) {
        errors.push(`${path}.action no es una acción interna válida.`);
      }
    }
  }
  return errors;
}

function normalizeSalesTeams(raw) {
  return safeArray(raw).map((team, index) => ({
    id: team.id || `team_${index + 1}`,
    name: team.name.trim(),
    members: safeArray(team.members).map((member, memberIndex) => ({
      id: member.id || `member_${index + 1}_${memberIndex + 1}`,
      name: member.name.trim(),
      role: member.role.trim(),
      active: member.active !== false,
      ...(member.executive ? { executive: member.executive } : {}),
    })),
  }));
}

function normalizeFaq(raw) {
  return safeArray(raw).map((item) => ({
    pregunta: item.pregunta.trim(),
    respuesta: item.respuesta.trim(),
  }));
}

function normalizeCampaigns(raw) {
  return safeArray(raw).map((campaign) => ({
    id: campaign.id,
    name: campaign.name.trim(),
    stage: campaign.stage,
    startDate: campaign.startDate,
    endDate: campaign.endDate,
    status: campaign.status || 'activa',
    createdAt: campaign.createdAt || new Date().toISOString(),
    action: campaign.action || 'create_document',
    executive: campaign.executive || '',
    targetStage: campaign.targetStage || '',
    notes: campaign.notes || '',
  }));
}

export function normalizeMarketingConfig(raw) {
  const errors = validateMarketingConfig(raw);
  if (!isPlainObject(raw) || errors.length) {
    return {
      config: {
        privacyNoticeVersion: DEFAULT_MARKETING_CONFIG.privacyNoticeVersion,
        automationRules: [],
        captureFields: [],
        salesTeams: [],
        faq: [],
        campaigns: [],
      },
      errors,
    };
  }
  return {
    config: {
      privacyNoticeVersion:
        raw.privacyNoticeVersion || DEFAULT_MARKETING_CONFIG.privacyNoticeVersion,
      automationRules: (raw.automationRules || []).map((rule) => ({
        event: rule.event,
        action: rule.action,
        label: rule.label,
        ...(rule.from !== undefined && rule.from !== null ? { from: rule.from } : {}),
        ...(rule.to !== undefined && rule.to !== null ? { to: rule.to } : {}),
      })),
      captureFields: [...(raw.captureFields || [])],
      salesTeams: normalizeSalesTeams(raw.salesTeams),
      faq: normalizeFaq(raw.faq),
      campaigns: normalizeCampaigns(raw.campaigns),
    },
    errors: [],
  };
}
