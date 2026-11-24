import { sanitizeText } from './utils/sanitize.js';
import { matchesAny, matchesQuery, normalizeText } from './utils/search.js';
import { isValidISODate, resolveEntityDateRule } from './utils/entity-date.js';
import { isValidFormat, normalizeFieldValue } from './utils/field-formats.js';
import {
  isConditionActive,
  isFieldSearchable,
  pruneInactiveGroupValues,
  resolveFieldRules,
} from './utils/field-rules.js';
import { getConfig } from './module-config.js';
import { transitionStage } from './utils/marketing-stage.js';
import { runAutomationRules } from './utils/marketing-automation.js';
import { normalizeMarketingConfig } from './utils/marketing-config.js';

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

export function loadEntities() {
  return readJson(ENTITIES_KEY);
}

export function saveEntities(entities) {
  writeJson(ENTITIES_KEY, entities);
}

export function loadDocuments() {
  return readJson(DOCUMENTS_KEY);
}

export function saveDocuments(documents) {
  writeJson(DOCUMENTS_KEY, documents);
}

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

export function saveMarketingConfig(value) {
  writeJson(MARKETING_CONFIG_KEY, value);
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
  const created = pending.map((item) => ({
    id: generateRecordId(),
    entity_id: item.entity_id,
    startDate: item.startDate || '',
    endDate: '',
    notes: item.notes,
    status: item.status,
    automation_key: item.automation_key,
    ...(item.campaignId ? { campaignId: item.campaignId } : {}),
    ...(item.campaña ? { campaña: item.campaña } : {}),
    ...(item.skipReason ? { skipReason: item.skipReason } : {}),
    ...(item.fecha ? { fecha: item.fecha } : {}),
    createdAt: now,
    updatedAt: now,
  }));
  saveDocuments([...documents, ...created]);
  let currentEntities = loadEntities();
  for (const item of pending) {
    if (!item.campaignAction || !currentEntities.some((candidate) => candidate.entity_id === entity.entity_id)) continue;
    currentEntities = currentEntities.map((candidate) => {
      if (candidate.entity_id !== entity.entity_id) return candidate;
      const updated = { ...candidate, updatedAt: now };
      if (item.campaignAction === 'assign_executive') updated.ejecutivo_asignado = item.executive || '';
      if (item.campaignAction === 'update_stage' && item.targetStage) updated.estado_comercial = item.targetStage;
      return updated;
    });
  }
  if (currentEntities.some((candidate) => candidate.updatedAt === now)) saveEntities(currentEntities);
  return created;
}

function normalizeCode(code) {
  return String(code || '').trim().toLowerCase().replace(/\s+/g, '');
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

function validateFieldRules(rules, data, { entities, editingId, customFieldDefs }, errors) {
  const labels = new Map((customFieldDefs || []).map((def) => [def.key, def.label || def.key]));
  for (const [key, rule] of Object.entries(rules || {})) {
    if (!isConditionActive(rule, data)) continue;
    const value = data[key];
    const label = rule.label || labels.get(key) || key;
    if (rule.required && isEmptyValue(value)) {
      errors[key] = `${label} es obligatorio.`;
      continue;
    }
    if (isEmptyValue(value)) continue;
    if (rule.format && !isValidFormat(rule.format, value)) {
      errors[key] = `${label} no tiene un formato válido.`;
      continue;
    }
    if (rule.unique) {
      const normalized = normalizeForUniqueness(value, rule, key);
      const duplicate = entities.some(
        (entity) => entity.id !== editingId && normalizeForUniqueness(entity[key], rule, key) === normalized,
      );
      if (duplicate) errors[key] = `Ya existe un registro con ese ${label.toLowerCase()}.`;
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

export function validateEntityData(data, { entities = [], editingId = null, customFieldDefs = null } = {}) {
  const errors = {};
  const customFieldDefinitions = resolveCustomFieldDefs('entity', customFieldDefs);
  const name = sanitizeText(data.name);
  const code = sanitizeText(data.code);
  if (!name) errors.name = 'El nombre es obligatorio.';
  if (!code) {
    errors.code = 'El código es obligatorio.';
  } else {
    const normalized = normalizeCode(code);
    const duplicate = entities.some((e) => e.id !== editingId && normalizeCode(e.code) === normalized);
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
  validateFieldRules(resolveFieldRules(getConfig(), 'entity'), data, {
    entities,
    editingId,
    customFieldDefs: customFieldDefinitions,
  }, errors);
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

export function addEntity(data, { customFieldDefs = null } = {}) {
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
    ...pickCustomFieldValues(customFieldDefinitions, pruned),
  };
  entities.push(entity);
  saveEntities(entities);
  if (entity.estado_comercial) persistAutomation('entity_created', entity);
  return entity;
}

export function updateEntity(id, updates, { customFieldDefs = null } = {}) {
  const entities = loadEntities();
  const existing = entities.find((e) => e.id === id);
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
  saveEntities(entities);
  return updated;
}

export function updateEntityStage(id, toStage) {
  const entity = loadEntities().find((e) => e.id === id);
  if (!entity) throw new ValidationError({ _entity: 'La entidad ya no existe.' });
  const result = transitionStage(entity, toStage);
  if (!result.valid) throw new ValidationError(result.errors);
  const updated = updateEntity(id, result.data, { customFieldDefs: getConfig()?.customFields?.entity || [] });
  persistAutomation('stage_changed', updated, { from: entity.estado_comercial, to: toStage });
  return updated;
}

export function deleteEntity(id) {
  const entities = loadEntities();
  const entity = entities.find((e) => e.id === id);
  if (!entity) return { deletedDocumentCount: 0 };
  saveEntities(entities.filter((e) => e.id !== id));
  const deletedDocumentCount = deleteDocumentsForEntity(entity.entity_id);
  return { deletedDocumentCount };
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
  const allowed = (lifecycle.transitions && lifecycle.transitions[fromStatus]) || [];
  return allowed.includes(toStatus);
}

export function validateDocumentData(
  data,
  { entities = [], documents = [], editingId = null, customFieldDefs = null, statusLifecycle = null } = {},
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
  if (data.subtotal !== undefined && data.discount !== undefined && Number(data.discount) > Number(data.subtotal)) {
    errors.discount = 'El descuento no puede superar el subtotal.';
  }
  validateCustomFields(customFieldDefinitions, data, errors);
  return errors;
}

export function validateDocument(document, { entities = loadEntities(), documents = loadDocuments(), customFieldDefs = null, statusLifecycle = null } = {}) {
  const errors = validateDocumentData(document || {}, {
    entities,
    documents,
    editingId: document?.id || null,
    customFieldDefs,
    statusLifecycle,
  });
  return { valid: Object.keys(errors).length === 0, errors };
}

export function addDocument(data, { customFieldDefs = null, statusLifecycle = null } = {}) {
  const entities = loadEntities();
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
  const document = {
    id: generateRecordId(),
    entity_id: documentEntityId(data),
    startDate: data.startDate || '',
    endDate: data.endDate || '',
    notes: sanitizeText(data.notes || ''),
    status: data.status || '',
    createdAt: now,
    updatedAt: now,
    ...pickCustomFieldValues(customFieldDefinitions, data),
  };
  documents.push(document);
  saveDocuments(documents);
  const linkedEntity = entities.find((e) => e.entity_id === document.entity_id);
  if (linkedEntity?.estado_comercial) persistAutomation('document_created', linkedEntity);
  return document;
}

export function updateDocument(id, updates, { customFieldDefs = null, statusLifecycle = null } = {}) {
  const entities = loadEntities();
  const documents = loadDocuments();
  const existing = documents.find((d) => d.id === id);
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
  saveDocuments(documents);
  return updated;
}

export function deleteDocument(id) {
  const documents = loadDocuments();
  saveDocuments(documents.filter((d) => d.id !== id));
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
  const documents = loadDocuments();
  const remaining = documents.filter((d) => d.entity_id !== entityId);
  const deletedCount = documents.length - remaining.length;
  saveDocuments(remaining);
  return deletedCount;
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

function entityMatchesQuery(entity, query, documents, customFieldKeys) {
  const entityRules = resolveFieldRules(getConfig(), 'entity');
  const documentRules = resolveFieldRules(getConfig(), 'document');
  const entityKeys = new Set([
    'name', 'code', 'category', 'description', 'targetDate',
    ...Object.keys(entity),
    ...customFieldKeys,
  ]);
  const haystacks = searchableValues(entity, entityKeys, entityRules);
  if (haystacks.some((value) => matchesQuery(value, query))) return true;
  const docs = documents.filter((d) => d.entity_id === entity.entity_id);
  return docs.some((d) => {
    const documentKeys = new Set(['notes', 'status', ...Object.keys(d), ...customFieldKeys]);
    return matchesAny(searchableValues(d, documentKeys, documentRules), query);
  });
}

export function searchEntities(
  query,
  { entities = loadEntities(), documents = loadDocuments(), customFieldKeys = [] } = {},
) {
  if (!normalizeText(query)) return entities.slice();
  return entities.filter((e) => entityMatchesQuery(e, query, documents, customFieldKeys));
}

// ---------------------------------------------------------------------------
// Resumen de Gestión Comercial (Historia de Usuario 6)
// ---------------------------------------------------------------------------

export function computeSummary({ entities = loadEntities(), documents = loadDocuments(), statusLifecycle = null } = {}) {
  const pendingStates = Array.isArray(statusLifecycle?.pendingStates) && statusLifecycle.pendingStates.length
    ? statusLifecycle.pendingStates.map((state) => normalizeText(state))
    : null;
  const pendingStatus = normalizeText(
    statusLifecycle?.states?.find((state) => normalizeText(state) === 'pendiente') || 'pendiente',
  );
  const pendingDocuments = pendingStates
    ? documents.filter((d) => pendingStates.includes(normalizeText(d.status)))
    : documents.filter((d) => normalizeText(d.status) === pendingStatus);
  const pendingByEntityMap = new Map();
  for (const doc of pendingDocuments) {
    pendingByEntityMap.set(doc.entity_id, (pendingByEntityMap.get(doc.entity_id) || 0) + 1);
  }
  const pendingByEntity = Array.from(pendingByEntityMap.entries()).map(([entityId, count]) => ({
    entityId,
    entity: entities.find((e) => e.entity_id === entityId) || null,
    count,
  }));
  return {
    totalEntities: entities.length,
    totalDocuments: documents.length,
    totalPending: pendingDocuments.length,
    pendingByEntity,
  };
}
