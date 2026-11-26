import { sanitizeText } from './utils/sanitize.js';
import { matchesAny, matchesQuery, normalizeText } from './utils/search.js';
import { isValidISODate, resolveEntityDateRule } from './utils/entity-date.js';
import { isValidFormat, normalizeFieldValue } from './utils/field-formats.js';
import {
  canonicalSearchKeys,
  isConditionActive,
  isFieldSearchable,
  pruneInactiveGroupValues,
  resolveFieldRules,
} from './utils/field-rules.js';
import { MESSAGES, exactFormatMessage } from './utils/messages.js';
import { getConfig } from './module-config.js';
import { transitionStage } from './utils/marketing-stage.js';
import { runAutomationRules } from './utils/marketing-automation.js';
import { normalizeMarketingConfig } from './utils/marketing-config.js';
import {
  DEFAULT_POSTVENTA_CONFIG,
  isTicket,
  validateTicketValues,
} from './utils/postventa.js';
import { getCurrentUser, listUsers, resolveExecutive } from './auth.js';
import { assertPermission, can } from './auth/permissions.js';

const ENTITIES_KEY = 'erp_entities';
const DOCUMENTS_KEY = 'erp_documents';
const MARKETING_CONFIG_KEY = 'erp_marketing_config';

export class ValidationError extends Error {
  constructor(errors) {
    super('Validation failed');
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

export class EntityHasRecordsError extends Error {
  constructor(recordCount) {
    super('La entidad tiene registros asociados y no se puede eliminar.');
    this.name = 'EntityHasRecordsError';
    this.recordCount = recordCount;
  }
}

export function isArchivedEntity(entity) {
  return Boolean(entity?.archivedAt);
}

function readJson(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

let storageAuthEnforced = false;

export function setStorageAuthEnforced(value) {
  storageAuthEnforced = Boolean(value);
}

function currentUser() {
  try {
    return getCurrentUser();
  } catch {
    return null;
  }
}

const PUBLIC_ACTIONS = new Set(['entity:create', 'document:create', 'document:edit_own']);

function authorize(action, context = {}, { actor = '' } = {}) {
  const user = currentUser();
  if (!user && !storageAuthEnforced) return;
  if (!user && actor === 'public' && PUBLIC_ACTIONS.has(action)) return;
  assertPermission(user?.rank || 'visitor', action, {
    ...context,
    ...(user ? { userId: user.id } : {}),
    ...(!user && actor ? { actor } : {}),
  });
}

function authorizeOwnOrAny(record, ownAction, anyAction, options = {}) {
  const user = currentUser();
  if (!user && !storageAuthEnforced) return;
  if (!user && options.actor === 'public' && PUBLIC_ACTIONS.has(ownAction)) {
    authorize(ownAction, { ownerId: record?.ownerId }, options);
    return;
  }
  const assigned = record?.ejecutivo_asignado;
  const hasAssignment = Boolean(assigned) && assigned !== 'Sin asignar';
  const ownerId = hasAssignment ? assigned : record?.ownerId || null;
  const owns = Boolean(ownerId) && ownerId === user?.id;
  authorize(owns ? ownAction : anyAction, { ownerId }, options);
}

function writeEntities(entities) {
  writeJson(ENTITIES_KEY, entities);
}

function writeDocuments(documents) {
  writeJson(DOCUMENTS_KEY, documents);
}

function isCapturePayload(data) {
  return data?.estado_comercial === 'prospecto' && data?.consentimiento === true;
}

function isChatQueryPayload(data, entity) {
  return Boolean(
    data?.canal === 'chat' && data?.tipo_interaccion === 'consulta' && entity?.consentimiento
  );
}

function isChatAnswerUpdate(existing, updates) {
  return Boolean(
    existing?.canal === 'chat' &&
    (updates?.respondida === true ||
      updates?.status === 'respondida' ||
      updates?.respuesta !== undefined)
  );
}

function publicActorFor(action, payload = {}, options = {}) {
  if (options.actor === 'public') return 'public';
  if (currentUser() || !storageAuthEnforced) return '';
  if (action === 'entity:create' && isCapturePayload(payload)) return 'public';
  if (action === 'document:create' && isChatQueryPayload(payload, payload._linkedEntity))
    return 'public';
  if (action === 'document:edit_own' && isChatAnswerUpdate(payload.existing, payload.updates)) {
    return 'public';
  }
  return '';
}

export function loadEntities() {
  return readJson(ENTITIES_KEY);
}

export function saveEntities(entities) {
  authorize('entity:edit_any');
  writeEntities(entities);
}

export function loadDocuments() {
  return readJson(DOCUMENTS_KEY);
}

export function saveDocuments(documents) {
  authorize('document:edit_any');
  writeDocuments(documents);
}

export function savePermissions() {
  assertPermission(currentUser()?.rank || 'visitor', 'permissions:edit');
}

export const savePermissionMatrix = savePermissions;
export const updatePermissionMatrix = savePermissions;
export const setPermissions = savePermissions;

function marketingSeed() {
  const { config } = normalizeMarketingConfig(getConfig()?.marketing);
  return {
    salesTeams: config.salesTeams || [],
    faq: config.faq || [],
    campaigns: config.campaigns || [],
  };
}

export function loadMarketingConfig() {
  const seed = marketingSeed();
  let raw;
  try {
    raw = JSON.parse(localStorage.getItem(MARKETING_CONFIG_KEY));
  } catch {
    raw = null;
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return seed;
  return {
    salesTeams: Array.isArray(raw.salesTeams) ? raw.salesTeams : seed.salesTeams,
    faq: Array.isArray(raw.faq) ? raw.faq : seed.faq,
    campaigns: Array.isArray(raw.campaigns) ? raw.campaigns : seed.campaigns,
  };
}

function sanitizeSalesTeamUsers(value) {
  if (!value || !Array.isArray(value.salesTeams)) return value;
  const inactiveIds = new Set(
    listUsers()
      .filter((user) => user.active === false)
      .map((user) => user.id)
  );
  return {
    ...value,
    salesTeams: value.salesTeams.map((team) => ({
      ...team,
      members: Array.isArray(team?.members)
        ? team.members.map((member) => {
            if (!inactiveIds.has(member?.userId)) return member;
            const safeMember = { ...member };
            delete safeMember.userId;
            return safeMember;
          })
        : team?.members,
    })),
  };
}

export function saveMarketingConfig(value) {
  authorize('marketing:manage');
  writeJson(MARKETING_CONFIG_KEY, sanitizeSalesTeamUsers(value));
}

let idCounter = 0;
function generateId(prefix) {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}${idCounter.toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function generateEntityId() {
  return generateId('ent');
}

function generateRecordId() {
  return generateId('rec');
}

function persistAutomation(event, entity, context = {}) {
  const config = getConfig();
  if (!config?.marketing || !entity) return [];
  const documents = loadDocuments();
  const marketingConfig = loadMarketingConfig();
  const pending = runAutomationRules(event, entity, config, documents, {
    ...context,
    campaigns: marketingConfig.campaigns,
  });
  if (!pending.length) return [];
  const now = new Date().toISOString();
  const assignedUser = resolveExecutive(entity.ejecutivo_asignado);
  const created = pending.map((item) => ({
    id: generateRecordId(),
    entity_id: item.entity_id,
    startDate: item.startDate || '',
    endDate: '',
    notes: item.notes,
    status: item.status,
    automation_key: item.automation_key,
    ...(assignedUser ? { assignedUserIdAtSale: assignedUser.id } : {}),
    ...(item.campaignId ? { campaignId: item.campaignId } : {}),
    ...(item.campaña ? { campaña: item.campaña } : {}),
    ...(item.skipReason ? { skipReason: item.skipReason } : {}),
    ...(item.fecha ? { fecha: item.fecha } : {}),
    createdBy: 'Sistema',
    actor: 'Sistema',
    ownerId: 'Sistema',
    createdAt: now,
    updatedAt: now,
  }));
  writeDocuments([...documents, ...created]);
  let currentEntities = loadEntities();
  for (const item of pending) {
    if (
      !item.campaignAction ||
      !currentEntities.some((candidate) => candidate.entity_id === entity.entity_id)
    )
      continue;
    currentEntities = currentEntities.map((candidate) => {
      if (candidate.entity_id !== entity.entity_id) return candidate;
      const updated = { ...candidate, updatedAt: now };
      if (item.campaignAction === 'assign_executive')
        updated.ejecutivo_asignado = item.executive || '';
      if (item.campaignAction === 'update_stage' && item.targetStage)
        updated.estado_comercial = item.targetStage;
      return updated;
    });
  }
  if (currentEntities.some((candidate) => candidate.updatedAt === now))
    writeEntities(currentEntities);
  return created;
}

function normalizeCode(code) {
  return String(code || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
}

function isEmptyValue(value) {
  return value === undefined || value === null || value === '';
}

function generateBusinessCode(entities, generated) {
  const prefix = generated.prefix || 'CLI-';
  const pad = Number(generated.pad) || 3;
  let sequence = Number(generated.start) || 1;
  let code = `${prefix}${String(sequence).padStart(pad, '0')}`;
  while (entities.some((entity) => normalizeCode(entity.code) === normalizeCode(code))) {
    sequence += 1;
    code = `${prefix}${String(sequence).padStart(pad, '0')}`;
  }
  return code;
}

function normalizeForUniqueness(value, rule, key) {
  if (key === 'code') return normalizeCode(value);
  return normalizeFieldValue(value, rule.normalize);
}

function validateFieldRules(rules, data, { entities, editingId }, errors) {
  for (const [key, rule] of Object.entries(rules || {})) {
    if (!isConditionActive(rule, data)) continue;
    const value = data[key];
    if (rule.required && isEmptyValue(value)) {
      errors[key] = MESSAGES.required;
      continue;
    }
    if (isEmptyValue(value)) continue;
    if (rule.format && !isValidFormat(rule.format, value)) {
      errors[key] = exactFormatMessage(key);
      continue;
    }
    if (rule.unique) {
      const normalized = normalizeForUniqueness(value, rule, key);
      const duplicate = entities.some(
        (entity) =>
          entity.id !== editingId && normalizeForUniqueness(entity[key], rule, key) === normalized
      );
      if (duplicate) errors[key] = key === 'rut' ? MESSAGES.duplicateRut : MESSAGES.required;
    }
  }
}

export function isValidDate(value) {
  return isValidISODate(value);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function activeCustomFieldDefs(kind) {
  const customFields = getConfig()?.customFields;
  if (Array.isArray(customFields)) {
    return customFields.filter((def) => (def?.target || 'entity') === kind);
  }
  return customFields?.[kind] || [];
}

function resolveCustomFieldDefs(kind, customFieldDefs) {
  return customFieldDefs === null || customFieldDefs === undefined
    ? activeCustomFieldDefs(kind)
    : customFieldDefs;
}

function documentEntityId(data) {
  return data.entity_id || data.entityId || '';
}

function validateCustomFields(definitions, data, errors) {
  for (const def of definitions || []) {
    const value = data[def.key];
    const isEmpty = value === undefined || value === null || value === '';
    if (def.required && isEmpty) {
      errors[def.key] = `${def.label || def.key} es obligatorio.`;
      continue;
    }
    if (isEmpty) continue;
    if (def.type === 'number' && Number.isNaN(Number(value))) {
      errors[def.key] = `${def.label || def.key} debe ser un número.`;
      continue;
    }
    if (def.type === 'date' && !isValidDate(value)) {
      errors[def.key] = `${def.label || def.key} debe ser una fecha válida (AAAA-MM-DD).`;
      continue;
    }
    if (def.key === 'email' && !EMAIL_RE.test(value)) {
      errors[def.key] = 'El correo electrónico no tiene un formato válido.';
    }
    if (def.key === 'creditLimit' && Number(value) < 0) {
      errors[def.key] = 'El límite de crédito no puede ser negativo.';
    }
  }
}

function pickCustomFieldValues(definitions, data) {
  const values = {};
  for (const def of definitions || []) {
    if (Object.prototype.hasOwnProperty.call(data, def.key)) {
      values[def.key] = data[def.key];
    }
  }
  return values;
}

// ---------------------------------------------------------------------------
// Entities
// ---------------------------------------------------------------------------

export function validateEntityData(
  data,
  { entities = [], editingId = null, customFieldDefs = null } = {}
) {
  const errors = {};
  const customFieldDefinitions = resolveCustomFieldDefs('entity', customFieldDefs);
  const name = sanitizeText(data.name);
  const code = sanitizeText(data.code);
  if (!name) errors.name = 'El nombre es obligatorio.';
  if (!code) {
    errors.code = 'El código es obligatorio.';
  } else {
    const normalized = normalizeCode(code);
    const duplicate = entities.some(
      (e) => e.id !== editingId && normalizeCode(e.code) === normalized
    );
    if (duplicate) errors.code = 'Ya existe una entidad con ese código.';
  }
  const entityDateRule = resolveEntityDateRule(getConfig());
  if (entityDateRule?.required && !data.targetDate) {
    errors.targetDate = `${entityDateRule.label} es obligatoria.`;
  }
  if (data.targetDate) {
    if (!isValidDate(data.targetDate)) {
      errors.targetDate = `${entityDateRule?.label || 'La fecha objetivo'} no es una fecha de calendario válida.`;
    } else if (entityDateRule) {
      const min = entityDateRule.min || '';
      const max = entityDateRule.max || '';
      if ((min && data.targetDate < min) || (max && data.targetDate > max)) {
        const range = [min && `desde ${min}`, max && `hasta ${max}`].filter(Boolean).join(' y ');
        errors.targetDate = `${entityDateRule.label} debe estar ${range ? `${range} ` : ''}(inclusive).`;
      }
    }
  }
  validateCustomFields(customFieldDefinitions, data, errors);
  validateFieldRules(
    resolveFieldRules(getConfig(), 'entity'),
    data,
    {
      entities,
      editingId,
      customFieldDefs: customFieldDefinitions,
    },
    errors
  );
  return errors;
}

export function validateEntity(entity, { entities = loadEntities(), customFieldDefs = null } = {}) {
  const errors = validateEntityData(entity || {}, {
    entities,
    editingId: entity?.id || null,
    customFieldDefs,
  });
  return { valid: Object.keys(errors).length === 0, errors };
}

export function addEntity(data, { customFieldDefs = null, actor = '' } = {}) {
  const publicActor = publicActorFor('entity:create', data, { actor });
  authorize('entity:create', {}, { actor: publicActor });
  const entities = loadEntities();
  const customFieldDefinitions = resolveCustomFieldDefs('entity', customFieldDefs);
  const rules = resolveFieldRules(getConfig(), 'entity');
  const prepared = { ...data };
  if (rules.code?.generated && isEmptyValue(prepared.code)) {
    prepared.code = generateBusinessCode(entities, rules.code.generated);
  }
  const pruned = pruneInactiveGroupValues(prepared, rules);
  const errors = validateEntityData(pruned, { entities, customFieldDefs: customFieldDefinitions });
  if (Object.keys(errors).length) throw new ValidationError(errors);
  const now = new Date().toISOString();
  const entity = {
    id: generateRecordId(),
    entity_id: generateEntityId(),
    name: sanitizeText(pruned.name),
    code: sanitizeText(pruned.code),
    category: sanitizeText(pruned.category || ''),
    description: sanitizeText(pruned.description || ''),
    targetDate: pruned.targetDate || '',
    createdAt: now,
    updatedAt: now,
    ownerId: data.ownerId || currentUser()?.id || null,
    ...pickCustomFieldValues(customFieldDefinitions, pruned),
  };
  entities.push(entity);
  writeEntities(entities);
  if (entity.estado_comercial) persistAutomation('entity_created', entity);
  return entity;
}

export function updateEntity(id, updates, { customFieldDefs = null } = {}) {
  const entities = loadEntities();
  const existing = entities.find((e) => e.id === id);
  authorizeOwnOrAny(existing || {}, 'entity:edit_own', 'entity:edit_any');
  if (!existing) throw new ValidationError({ _entity: 'La entidad ya no existe.' });
  const customFieldDefinitions = resolveCustomFieldDefs('entity', customFieldDefs);
  const rules = resolveFieldRules(getConfig(), 'entity');
  const merged = pruneInactiveGroupValues({ ...existing, ...updates }, rules);
  const prunedUpdates = pruneInactiveGroupValues(updates, rules);
  const errors = validateEntityData(merged, {
    entities,
    editingId: id,
    customFieldDefs: customFieldDefinitions,
  });
  if (Object.keys(errors).length) throw new ValidationError(errors);
  const now = new Date().toISOString();
  const updated = {
    ...merged,
    ...pickCustomFieldValues(customFieldDefinitions, prunedUpdates),
    name: sanitizeText(merged.name),
    code: sanitizeText(merged.code),
    category: sanitizeText(merged.category || ''),
    description: sanitizeText(merged.description || ''),
    targetDate: merged.targetDate || '',
    id: existing.id,
    entity_id: existing.entity_id,
    createdAt: existing.createdAt,
    updatedAt: now,
  };
  const index = entities.findIndex((e) => e.id === id);
  entities[index] = updated;
  writeEntities(entities);
  return updated;
}

export function updateEntityStage(id, toStage) {
  const entity = loadEntities().find((e) => e.id === id);
  if (!entity) throw new ValidationError({ _entity: 'La entidad ya no existe.' });
  authorizeOwnOrAny(entity, 'document:transition_own', 'document:edit_any');
  const result = transitionStage(
    { ...entity, estado_comercial: entity.estado_comercial || 'prospecto' },
    toStage
  );
  if (!result.valid) throw new ValidationError(result.errors);
  const updated = updateEntity(id, result.data, {
    customFieldDefs: getConfig()?.customFields?.entity || [],
  });
  persistAutomation('stage_changed', updated, { from: entity.estado_comercial, to: toStage });
  return updated;
}

function removeDocumentsForEntity(entityId) {
  const documents = loadDocuments();
  const remaining = documents.filter((d) => d.entity_id !== entityId);
  const deletedCount = documents.length - remaining.length;
  writeDocuments(remaining);
  return deletedCount;
}

export function archiveEntity(id) {
  authorize('entity:delete');
  const entities = loadEntities();
  const index = entities.findIndex((e) => e.id === id);
  if (index === -1) throw new ValidationError({ _entity: 'La entidad ya no existe.' });
  const entity = entities[index];
  if (isArchivedEntity(entity)) return entity;
  const now = new Date().toISOString();
  const archived = { ...entity, archivedAt: now, updatedAt: now };
  entities[index] = archived;
  writeEntities(entities);
  return archived;
}

export function restoreEntity(id) {
  authorize('entity:delete');
  const entities = loadEntities();
  const index = entities.findIndex((e) => e.id === id);
  if (index === -1) throw new ValidationError({ _entity: 'La entidad ya no existe.' });
  const entity = entities[index];
  if (!isArchivedEntity(entity)) return entity;
  const { archivedAt: _archivedAt, ...rest } = entity;
  const restored = { ...rest, updatedAt: new Date().toISOString() };
  entities[index] = restored;
  writeEntities(entities);
  return restored;
}

export function deleteEntity(id) {
  authorize('entity:delete');
  const entities = loadEntities();
  const entity = entities.find((e) => e.id === id);
  if (!entity) return { deletedDocumentCount: 0 };
  const associatedRecordCount = countDocumentsForEntity(entity.entity_id);
  if (associatedRecordCount > 0) throw new EntityHasRecordsError(associatedRecordCount);
  writeEntities(entities.filter((e) => e.id !== id));
  return { deletedDocumentCount: 0 };
}

export function countDocumentsForEntity(entityId, documents = loadDocuments()) {
  return documents.filter((d) => d.entity_id === entityId).length;
}

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

export function isValidTransition(lifecycle, fromStatus, toStatus) {
  if (!lifecycle || !Array.isArray(lifecycle.states)) return true;
  if (!fromStatus) return lifecycle.states.includes(toStatus);
  if (fromStatus === toStatus) return true;
  const transitions = lifecycle.transitions;
  if (!transitions || !Object.keys(transitions).length) return true;
  const allowed = transitions[fromStatus] || [];
  return allowed.includes(toStatus);
}

export function validateDocumentData(
  data,
  {
    entities = [],
    documents = [],
    editingId = null,
    customFieldDefs = null,
    statusLifecycle = null,
  } = {}
) {
  const errors = {};
  const customFieldDefinitions = resolveCustomFieldDefs('document', customFieldDefs);
  const entityId = documentEntityId(data);
  if (!entityId) {
    errors.entity_id = 'El documento debe estar asociado a una entidad.';
  } else if (!entities.some((e) => e.entity_id === entityId)) {
    errors.entity_id = 'La entidad asociada no existe.';
  }
  if (data.startDate && !isValidDate(data.startDate)) {
    errors.startDate = 'La fecha de inicio no es válida.';
  }
  if (data.endDate && !isValidDate(data.endDate)) {
    errors.endDate = 'La fecha de término no es válida.';
  }
  if (
    data.startDate &&
    data.endDate &&
    isValidDate(data.startDate) &&
    isValidDate(data.endDate) &&
    data.endDate < data.startDate
  ) {
    errors.endDate = 'La fecha de término debe ser igual o posterior a la fecha de inicio.';
  }
  if (statusLifecycle && data.status) {
    const existing = editingId ? documents.find((d) => d.id === editingId) : null;
    const fromStatus = existing ? existing.status : null;
    if (!isValidTransition(statusLifecycle, fromStatus, data.status)) {
      errors.status = 'Transición de estado inválida.';
    }
  }
  if (
    data.subtotal !== undefined &&
    data.discount !== undefined &&
    Number(data.discount) > Number(data.subtotal)
  ) {
    errors.discount = 'El descuento no puede superar el subtotal.';
  }
  validateCustomFields(customFieldDefinitions, data, errors);
  return errors;
}

export function validateDocument(
  document,
  {
    entities = loadEntities(),
    documents = loadDocuments(),
    customFieldDefs = null,
    statusLifecycle = null,
  } = {}
) {
  const errors = validateDocumentData(document || {}, {
    entities,
    documents,
    editingId: document?.id || null,
    customFieldDefs,
    statusLifecycle,
  });
  return { valid: Object.keys(errors).length === 0, errors };
}

function defaultDocumentStatus() {
  const lifecycle = getConfig()?.statusLifecycle;
  return lifecycle?.defaultStatus || lifecycle?.initialStatus || 'pendiente';
}

export function addDocument(
  data,
  { customFieldDefs = null, statusLifecycle = null, actor = '' } = {}
) {
  const entities = loadEntities();
  const linkedEntity = entities.find((e) => e.entity_id === documentEntityId(data));
  const publicActor = publicActorFor(
    'document:create',
    { ...data, _linkedEntity: linkedEntity },
    { actor }
  );
  authorize('document:create', {}, { actor: publicActor });
  const documents = loadDocuments();
  const customFieldDefinitions = resolveCustomFieldDefs('document', customFieldDefs);
  const errors = validateDocumentData(data, {
    entities,
    documents,
    customFieldDefs: customFieldDefinitions,
    statusLifecycle,
  });
  if (Object.keys(errors).length) throw new ValidationError(errors);
  const now = new Date().toISOString();
  const assignedUser = resolveExecutive(linkedEntity?.ejecutivo_asignado);
  const assignedUserIdAtSale = data.assignedUserIdAtSale || assignedUser?.id || '';
  const document = {
    id: generateRecordId(),
    entity_id: documentEntityId(data),
    startDate: data.startDate || '',
    endDate: data.endDate || '',
    notes: sanitizeText(data.notes || ''),
    status: data.status || defaultDocumentStatus(),
    ...(assignedUserIdAtSale ? { assignedUserIdAtSale } : {}),
    createdAt: now,
    updatedAt: now,
    ownerId: data.ownerId || currentUser()?.id || null,
    ...pickCustomFieldValues(customFieldDefinitions, data),
  };
  documents.push(document);
  writeDocuments(documents);
  if (linkedEntity?.estado_comercial) persistAutomation('document_created', linkedEntity);
  return document;
}

export function updateDocument(
  id,
  updates,
  { customFieldDefs = null, statusLifecycle = null, actor = '' } = {}
) {
  const entities = loadEntities();
  const documents = loadDocuments();
  const existing = documents.find((d) => d.id === id);
  const publicActor = publicActorFor('document:edit_own', { existing, updates }, { actor });
  authorizeOwnOrAny(existing || {}, 'document:edit_own', 'document:edit_any', {
    actor: publicActor,
  });
  if (!existing) throw new ValidationError({ _document: 'El documento ya no existe.' });
  const customFieldDefinitions = resolveCustomFieldDefs('document', customFieldDefs);
  const merged = { ...existing, ...updates };
  const errors = validateDocumentData(merged, {
    entities,
    documents,
    editingId: id,
    customFieldDefs: customFieldDefinitions,
    statusLifecycle,
  });
  if (Object.keys(errors).length) throw new ValidationError(errors);
  const now = new Date().toISOString();
  const updated = {
    ...existing,
    ...updates,
    ...pickCustomFieldValues(customFieldDefinitions, updates),
    notes: sanitizeText(merged.notes || ''),
    id: existing.id,
    entity_id: existing.entity_id,
    createdAt: existing.createdAt,
    updatedAt: now,
  };
  const index = documents.findIndex((d) => d.id === id);
  documents[index] = updated;
  writeDocuments(documents);
  return updated;
}

export function deleteDocument(id) {
  authorize('document:delete');
  const documents = loadDocuments();
  writeDocuments(documents.filter((d) => d.id !== id));
}

export function clearAll() {
  try {
    localStorage.removeItem(ENTITIES_KEY);
    localStorage.removeItem(DOCUMENTS_KEY);
  } catch {
    // Storage may be unavailable in some environments.
  }
}

export function deleteDocumentsForEntity(entityId) {
  authorize('document:delete');
  return removeDocumentsForEntity(entityId);
}

function postventaConfig() {
  return getConfig()?.postventa || DEFAULT_POSTVENTA_CONFIG;
}

export function createTicketDocument(values = {}) {
  authorize('postventa:create');
  const config = postventaConfig();
  const entities = loadEntities();
  const errors = validateTicketValues(values, { entities, config });
  if (Object.keys(errors).length) throw new ValidationError(errors);
  const now = new Date().toISOString();
  const status = values.status || config.states[0];
  const ticket = {
    id: generateRecordId(),
    entity_id: documentEntityId(values),
    ticket: true,
    startDate: '',
    endDate: '',
    notes: '',
    status,
    asunto: sanitizeText(values.asunto || ''),
    categoria: values.categoria,
    prioridad: values.prioridad,
    nota_resolucion: config.resolutionNoteStates.includes(status)
      ? sanitizeText(values.nota_resolucion || '')
      : '',
    createdAt: now,
    updatedAt: now,
    ownerId: values.ownerId || currentUser()?.id || null,
  };
  const documents = loadDocuments();
  documents.push(ticket);
  writeDocuments(documents);
  return ticket;
}

export function changeTicketStatus(documentId, nextStatus, resolutionNote = '') {
  authorize('postventa:transition');
  const config = postventaConfig();
  const documents = loadDocuments();
  const existing = documents.find((document) => document.id === documentId);
  if (!existing || !isTicket(existing)) {
    throw new ValidationError({ _document: 'El ticket ya no existe.' });
  }
  const errors = validateTicketValues(
    { ...existing, status: nextStatus, nota_resolucion: resolutionNote },
    { entities: loadEntities(), config }
  );
  if (Object.keys(errors).length) throw new ValidationError(errors);
  const updated = {
    ...existing,
    status: nextStatus,
    nota_resolucion: config.resolutionNoteStates.includes(nextStatus)
      ? sanitizeText(resolutionNote)
      : existing.nota_resolucion || '',
    updatedAt: new Date().toISOString(),
  };
  documents[documents.findIndex((document) => document.id === documentId)] = updated;
  writeDocuments(documents);
  return updated;
}

function ticketBelongsToUser(ticket, entities, user) {
  const entity = entities.find((item) => item.entity_id === ticket.entity_id);
  if (!entity) return false;
  const assigned = entity.ejecutivo_asignado;
  const hasAssignment = Boolean(assigned) && assigned !== 'Sin asignar';
  const ownerId = hasAssignment ? assigned : entity.ownerId || ticket.ownerId || null;
  return Boolean(ownerId) && ownerId === user?.id;
}

export function listTicketDocuments(options = {}) {
  const user = options.user !== undefined ? options.user : currentUser();
  const role = user?.rank || 'visitor';
  const context = user ? { userId: user.id } : {};
  let viewAll = true;
  let viewOwn = true;
  if (!user && !storageAuthEnforced) {
    viewAll = true;
    viewOwn = true;
  } else {
    viewAll = can(role, 'postventa:view', context);
    viewOwn = can(role, 'postventa:view_own', { ...context, ownerId: user?.id });
    if (!viewAll && !viewOwn) assertPermission(role, 'postventa:view', context);
  }
  const documents = options.documents || loadDocuments();
  const entities = options.entities || loadEntities();
  return documents.filter((document) => {
    if (!isTicket(document)) return false;
    const entity = entities.find((item) => item.entity_id === document.entity_id);
    if (!entity || isArchivedEntity(entity)) return false;
    return viewAll || (viewOwn && ticketBelongsToUser(document, entities, user));
  });
}

export function documentsForEntity(entityId) {
  return loadDocuments().filter((document) => document.entity_id === entityId);
}

export function getEntityDocuments(entityId, documents = loadDocuments()) {
  return documents
    .filter((d) => d.entity_id === entityId)
    .slice()
    .sort((a, b) => {
      const dateA = a.startDate || a.createdAt;
      const dateB = b.startDate || b.createdAt;
      return dateA < dateB ? -1 : dateA > dateB ? 1 : 0;
    });
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

function searchableValues(record, keys, rules) {
  const haystacks = [];
  for (const key of keys) {
    if (!isFieldSearchable(rules, key, record)) continue;
    const value = record[key];
    if (value !== undefined && value !== null) haystacks.push(String(value));
  }
  return haystacks;
}

function entityMatchesQuery(entity, query, documents, customFieldKeys, documentCustomFieldKeys) {
  const entityRules = resolveFieldRules(getConfig(), 'entity');
  const documentRules = resolveFieldRules(getConfig(), 'document');
  const entityKeys = canonicalSearchKeys('entity', customFieldKeys);
  const haystacks = searchableValues(entity, entityKeys, entityRules);
  if (haystacks.some((value) => matchesQuery(value, query))) return true;
  const documentKeys = canonicalSearchKeys('document', documentCustomFieldKeys);
  const docs = documents.filter((d) => d.entity_id === entity.entity_id);
  return docs.some((d) => matchesAny(searchableValues(d, documentKeys, documentRules), query));
}

export function searchEntities(
  query,
  {
    entities = loadEntities(),
    documents = loadDocuments(),
    customFieldKeys = [],
    documentCustomFieldKeys = customFieldKeys,
  } = {}
) {
  if (!normalizeText(query)) return entities.slice();
  return entities.filter((e) =>
    entityMatchesQuery(e, query, documents, customFieldKeys, documentCustomFieldKeys)
  );
}

// ---------------------------------------------------------------------------
// Resumen de Gestión Comercial (Historia de Usuario 6)
// ---------------------------------------------------------------------------

function belongsToOwner(record, ownerId) {
  if (!ownerId) return true;
  const assigned = record?.ejecutivo_asignado;
  if (
    assigned !== undefined &&
    assigned !== null &&
    assigned !== '' &&
    assigned !== 'Sin asignar'
  ) {
    return assigned === ownerId;
  }
  return record?.ownerId === ownerId;
}

export function computeSummary({
  entities = loadEntities(),
  documents = loadDocuments(),
  statusLifecycle = null,
  ownerId = null,
} = {}) {
  const visibleEntities = ownerId ? entities.filter((e) => belongsToOwner(e, ownerId)) : entities;
  const visibleEntityIds = new Set(visibleEntities.map((e) => e.entity_id));
  const visibleDocuments = ownerId
    ? documents.filter((doc) => visibleEntityIds.has(doc.entity_id))
    : documents;
  const pendingStates =
    Array.isArray(statusLifecycle?.pendingStates) && statusLifecycle.pendingStates.length
      ? statusLifecycle.pendingStates.map((state) => normalizeText(state))
      : null;
  const pendingStatus = normalizeText(
    statusLifecycle?.states?.find((state) => normalizeText(state) === 'pendiente') || 'pendiente'
  );
  const pendingDocuments = pendingStates
    ? visibleDocuments.filter((d) => pendingStates.includes(normalizeText(d.status)))
    : visibleDocuments.filter((d) => normalizeText(d.status) === pendingStatus);
  const pendingByEntityMap = new Map();
  for (const doc of pendingDocuments) {
    pendingByEntityMap.set(doc.entity_id, (pendingByEntityMap.get(doc.entity_id) || 0) + 1);
  }
  const pendingByEntity = Array.from(pendingByEntityMap.entries()).map(([entityId, count]) => ({
    entityId,
    entity: visibleEntities.find((e) => e.entity_id === entityId) || null,
    count,
  }));
  return {
    totalEntities: visibleEntities.length,
    totalDocuments: visibleDocuments.length,
    totalPending: pendingDocuments.length,
    pendingByEntity,
  };
}
