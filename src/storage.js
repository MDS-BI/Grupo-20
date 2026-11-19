import { sanitizeText } from './utils/sanitize.js';
import { normalizeText } from './utils/search.js';
import { getConfig } from './module-config.js';

const ENTITIES_KEY = 'erp_entities';
const DOCUMENTS_KEY = 'erp_documents';

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

function normalizeCode(code) {
  return String(code || '').trim().toLowerCase().replace(/\s+/g, '');
}

export function isValidDate(value) {
  if (!value) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
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
  if (data.targetDate && !isValidDate(data.targetDate)) {
    errors.targetDate = 'La fecha objetivo no es una fecha de calendario válida.';
  }
  validateCustomFields(customFieldDefinitions, data, errors);
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
  const errors = validateEntityData(data, { entities, customFieldDefs: customFieldDefinitions });
  if (Object.keys(errors).length) throw new ValidationError(errors);
  const now = new Date().toISOString();
  const entity = {
    id: generateRecordId(),
    entity_id: generateEntityId(),
    name: sanitizeText(data.name),
    code: sanitizeText(data.code),
    category: sanitizeText(data.category || ''),
    description: sanitizeText(data.description || ''),
    targetDate: data.targetDate || '',
    createdAt: now,
    updatedAt: now,
    ...pickCustomFieldValues(customFieldDefinitions, data),
  };
  entities.push(entity);
  saveEntities(entities);
  return entity;
}

export function updateEntity(id, updates, { customFieldDefs = null } = {}) {
  const entities = loadEntities();
  const existing = entities.find((e) => e.id === id);
  if (!existing) throw new ValidationError({ _entity: 'La entidad ya no existe.' });
  const customFieldDefinitions = resolveCustomFieldDefs('entity', customFieldDefs);
  const merged = { ...existing, ...updates };
  const errors = validateEntityData(merged, {
    entities,
    editingId: id,
    customFieldDefs: customFieldDefinitions,
  });
  if (Object.keys(errors).length) throw new ValidationError(errors);
  const now = new Date().toISOString();
  const updated = {
    ...existing,
    ...updates,
    ...pickCustomFieldValues(customFieldDefinitions, updates),
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

function matchesQuery(entity, needle, documents, customFieldKeys) {
  const haystacks = [entity.name, entity.code, entity.category, entity.description, entity.targetDate];
  for (const key of customFieldKeys) {
    if (entity[key] !== undefined) haystacks.push(String(entity[key]));
  }
  if (haystacks.some((v) => v && String(v).toLowerCase().includes(needle))) return true;
  const docs = documents.filter((d) => d.entity_id === entity.entity_id);
  return docs.some((d) => {
    const docHaystacks = [d.notes, d.status];
    for (const key of customFieldKeys) {
      if (d[key] !== undefined) docHaystacks.push(String(d[key]));
    }
    return docHaystacks.some((v) => v && String(v).toLowerCase().includes(needle));
  });
}

export function searchEntities(
  query,
  { entities = loadEntities(), documents = loadDocuments(), customFieldKeys = [] } = {},
) {
  const needle = (query || '').trim().toLowerCase();
  if (!needle) return entities.slice();
  return entities.filter((e) => matchesQuery(e, needle, documents, customFieldKeys));
}

// ---------------------------------------------------------------------------
// Resumen de Gestión Comercial (Historia de Usuario 6)
// ---------------------------------------------------------------------------

export function computeSummary({ entities = loadEntities(), documents = loadDocuments(), statusLifecycle = null } = {}) {
  const pendingStatus = normalizeText(
    statusLifecycle?.states?.find((state) => normalizeText(state) === 'pendiente') || 'pendiente',
  );
  const pendingDocuments = documents.filter((d) => normalizeText(d.status) === pendingStatus);
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
