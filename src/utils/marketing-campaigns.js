import { isMarketingStage } from './marketing-stages.js';

const INTERNAL_ACTIONS = ['create_document', 'assign_executive', 'update_stage'];
const CAMPAIGN_EVENTS = ['entity_created', 'stage_changed', 'document_created'];
const EDITABLE_FIELDS = [
  'name',
  'stage',
  'startDate',
  'endDate',
  'action',
  'executive',
  'targetStage',
  'notes',
];

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function declaredActions(campaigns) {
  const declared = Array.isArray(campaigns) ? campaigns.actions : campaigns?.actions;
  return Array.isArray(declared) ? declared : null;
}

function allowedActions(campaigns) {
  const declared = declaredActions(campaigns);
  return declared === null
    ? INTERNAL_ACTIONS
    : declared.filter((action) => INTERNAL_ACTIONS.includes(action));
}

function localDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function campaignDateKey(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (dateOnly) {
    const year = Number(dateOnly[1]);
    const month = Number(dateOnly[2]);
    const day = Number(dateOnly[3]);
    const parsed = new Date(Date.UTC(year, month - 1, day));
    if (
      parsed.getUTCFullYear() !== year ||
      parsed.getUTCMonth() !== month - 1 ||
      parsed.getUTCDate() !== day
    ) {
      return null;
    }
    return value;
  }
  if (
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})?$/.test(value)
  ) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return localDateKey(parsed);
  }
  return null;
}

function addError(errors, field, message) {
  errors.push(message);
  Object.defineProperty(errors, field, { value: message, configurable: true, enumerable: false });
}

function validationError(errors) {
  const error = new Error(errors.join(' '));
  Object.defineProperty(error, 'errors', { value: errors, enumerable: true });
  return error;
}

function validateCampaign(values, requireDates, actions = INTERNAL_ACTIONS) {
  const errors = [];
  const safe = isPlainObject(values) ? values : {};
  const name = safe.name;
  if (typeof name !== 'string' || !name.trim()) {
    addError(errors, 'name', 'El nombre de la campaña es obligatorio.');
  }
  if (!isMarketingStage(safe.stage === undefined ? 'prospecto' : safe.stage)) {
    addError(errors, 'stage', 'La etapa de la campaña no es válida.');
  }
  for (const field of ['startDate', 'endDate']) {
    const value = safe[field];
    if (value === undefined) {
      if (requireDates) addError(errors, field, `La ${field} debe ser una fecha ISO.`);
    } else if (!campaignDateKey(value)) {
      addError(errors, field, `La ${field} debe ser una fecha ISO.`);
    }
  }
  const start = campaignDateKey(safe.startDate);
  const end = campaignDateKey(safe.endDate);
  if (start && end && end < start) {
    addError(errors, 'endDate', 'La endDate no puede ser anterior a la startDate.');
  }
  if (
    actions !== null &&
    safe.action !== undefined &&
    safe.action !== '' &&
    !actions.includes(safe.action)
  ) {
    addError(errors, 'action', 'La acción de la campaña no está declarada.');
  }
  return errors;
}

function isoNow(now) {
  if (now instanceof Date && !Number.isNaN(now.getTime())) return now.toISOString();
  if (typeof now?.toISOString === 'function') return now.toISOString();
  const parsed = new Date(now);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function comparisonDate(now) {
  if (now instanceof Date && !Number.isNaN(now.getTime())) return now;
  if (typeof now?.toISOString === 'function') return new Date(now.toISOString());
  const parsed = new Date(now);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function isMoreRecent(left, right) {
  const leftTime = Date.parse(left.createdAt);
  const rightTime = Date.parse(right.createdAt);
  const safeLeftTime = Number.isNaN(leftTime) ? 0 : leftTime;
  const safeRightTime = Number.isNaN(rightTime) ? 0 : rightTime;
  if (safeLeftTime !== safeRightTime) return safeLeftTime > safeRightTime;
  return String(left.id ?? '') > String(right.id ?? '');
}

export function createCampaign(values = {}, campaigns = []) {
  const errors = validateCampaign(values, true, declaredActions(campaigns));
  if (errors.length) throw validationError(errors);

  const safeValues = isPlainObject(values) ? values : {};
  const campaign = {
    id: `camp-${Date.now()}${Math.random().toString(36).slice(2, 8)}`,
    name: safeValues.name.trim(),
    stage: safeValues.stage === undefined ? 'prospecto' : safeValues.stage,
    startDate: safeValues.startDate,
    endDate: safeValues.endDate,
    status: 'activa',
    createdAt: new Date().toISOString(),
    action:
      safeValues.action === undefined || safeValues.action === ''
        ? 'create_document'
        : safeValues.action,
    executive: safeValues.executive === undefined ? '' : safeValues.executive,
    targetStage: safeValues.targetStage === undefined ? '' : safeValues.targetStage,
    notes: safeValues.notes === undefined ? '' : safeValues.notes,
    ...(safeValues.createdByUserId === undefined
      ? {}
      : { createdByUserId: safeValues.createdByUserId }),
  };
  return [...(Array.isArray(campaigns) ? campaigns : []), campaign];
}

export function updateCampaign(id, updates = {}, campaigns = []) {
  const safeUpdates = isPlainObject(updates) ? updates : {};
  const changes = {};
  for (const field of EDITABLE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(safeUpdates, field))
      changes[field] = safeUpdates[field];
  }
  const errors = Object.keys(changes).length
    ? validateCampaign(changes, false, declaredActions(campaigns))
    : [];
  if (errors.length) throw validationError(errors);

  return (Array.isArray(campaigns) ? campaigns : []).map((campaign) => {
    if (campaign?.id !== id) return campaign;
    const updated = { ...campaign };
    for (const [field, value] of Object.entries(changes)) {
      updated[field] = field === 'name' && typeof value === 'string' ? value.trim() : value;
    }
    return updated;
  });
}

export function stopCampaign(id, campaigns = []) {
  return (Array.isArray(campaigns) ? campaigns : []).map((campaign) =>
    campaign?.id === id ? { ...campaign, status: 'detenida' } : campaign
  );
}

export function isCampaignActive(campaign, now = new Date()) {
  if (!isPlainObject(campaign) || campaign.status !== 'activa') return false;
  const currentDate = localDateKey(comparisonDate(now));
  const start = campaignDateKey(campaign.startDate);
  const end = campaignDateKey(campaign.endDate);
  if (start && currentDate < start) return false;
  if (end && currentDate > end) return false;
  return true;
}

export function selectCampaignsForEvent({
  event,
  entity,
  campaigns = [],
  now = new Date(),
  context = {},
} = {}) {
  if (!CAMPAIGN_EVENTS.includes(event)) return { selected: null, skipped: [] };

  const safeContext = isPlainObject(context) ? context : {};
  const safeEntity = isPlainObject(entity) ? entity : {};
  const entityContext = isPlainObject(safeEntity.context) ? safeEntity.context : {};
  const targetStage =
    safeContext.to ?? entityContext.to ?? safeEntity.estado_comercial ?? 'prospecto';
  const entityId = safeEntity.entity_id ?? safeEntity.id ?? '';
  const currentDate = comparisonDate(now);
  const configuredActions = allowedActions(campaigns);

  const applicable = (Array.isArray(campaigns) ? campaigns : []).filter((campaign) => {
    if (!isPlainObject(campaign) || !isCampaignActive(campaign, currentDate)) return false;
    if (campaign.stage !== targetStage) return false;
    if (campaign.event !== undefined && campaign.event !== event) return false;
    if (
      event === 'stage_changed' &&
      campaign.from &&
      safeContext.from &&
      campaign.from !== safeContext.from
    ) {
      return false;
    }
    return configuredActions.includes(campaign.action ?? 'create_document');
  });

  if (!applicable.length) return { selected: null, skipped: [] };

  const ranked = [...applicable].sort((left, right) => (isMoreRecent(left, right) ? -1 : 1));
  const [selected, ...others] = ranked;
  const skipped = others.map((campaign) => ({
    ...campaign,
    notes: 'omitida por solapamiento',
    campaignId: campaign.id,
    skipReason: 'solapamiento con campaña más reciente',
    entity_id: entityId,
    event,
    fecha: isoNow(now),
  }));

  return { selected, skipped };
}
