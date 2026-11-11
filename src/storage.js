import { getConfig } from './module-config.js';

const ENTITIES_KEY = 'erp.entities';
const DOCUMENTS_KEY = 'erp.documents';

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

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function store() {
  return globalThis.localStorage;
}

function readList(key) {
  const storage = store();
  if (!storage) return [];
  try {
    const raw = storage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeList(key, list) {
  const storage = store();
  if (!storage) return;
  storage.setItem(key, JSON.stringify(list));
}

function nowIso() {
  return new Date().toISOString();
}

function randomId(prefix) {
  const cryptoObj = globalThis.crypto;
  if (cryptoObj && typeof cryptoObj.randomUUID === 'function') {
    return `${prefix}-${cryptoObj.randomUUID()}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function trimString(value) {
  return typeof value === 'string' ? value.trim() : value;
}

function normalizeCode(value) {
  return String(value == null ? '' : value)
    .replace(/\s+/g, '')
    .toLowerCase();
}

function isEmpty(value) {
  return value === undefined || value === null || value === '';
}

function toNumber(value) {
  if (isEmpty(value)) return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : value;
}

function isCalendarDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

function customFieldsFor(target) {
  const config = getConfig();
  const fields = config && Array.isArray(config.customFields) ? config.customFields : [];
  return fields.filter(field => field.target === target);
}

function validateCustomFields(target, record, errors) {
  for (const field of customFieldsFor(target)) {
    const value = record[field.key];
    const blank = isEmpty(value) || (typeof value === 'string' && value.trim() === '');

    if (field.required && blank) {
      errors[field.key] = `El campo ${field.label} es obligatorio.`;
      continue;
    }
    if (blank) continue;

    if (field.type === 'number' && !Number.isFinite(Number(value))) {
      errors[field.key] = `El campo ${field.label} debe ser un número.`;
    } else if (field.type === 'date' && !isCalendarDate(String(value))) {
      errors[field.key] = `El campo ${field.label} debe ser una fecha válida.`;
    } else if (field.type === 'select' && !Array.isArray(field.options)) {
      errors[field.key] = `El campo ${field.label} no tiene opciones válidas declaradas.`;
    } else if (field.type === 'select' && !field.options.includes(String(value))) {
      errors[field.key] = `El campo ${field.label} debe ser uno de: ${field.options.join(', ')}.`;
    }
  }
}

function convertCustomValue(field, value) {
  if (isEmpty(value)) return undefined;
  if (field.type === 'number') {
    const number = Number(value);
    return Number.isFinite(number) ? number : value;
  }
  if (typeof value === 'string') return value.trim();
  return value;
}

function applyBaseFields(target, source, targetRecord) {
  const fields = target === 'entity' ? BASE_ENTITY_FIELDS : BASE_DOCUMENT_FIELDS;
  for (const field of fields) {
    if (source[field] !== undefined) {
      targetRecord[field] = source[field];
    }
  }
}

function applyCustomFields(target, source, targetRecord) {
  for (const field of customFieldsFor(target)) {
    const converted = convertCustomValue(field, source[field.key]);
    if (converted === undefined) {
      delete targetRecord[field.key];
    } else {
      targetRecord[field.key] = converted;
    }
  }
}

function buildEntityRecord(source, existing) {
  const record = existing ? { ...existing } : {};
  applyBaseFields('entity', source, record);

  record.name = trimString(record.name) || '';
  record.code = trimString(record.code) || '';
  for (const key of ['taxId', 'email', 'phone', 'address', 'category', 'description', 'targetDate', 'paymentTerms']) {
    if (record[key] !== undefined && record[key] !== null) {
      record[key] = trimString(record[key]);
    }
  }
  if (!isEmpty(record.creditLimit)) {
    record.creditLimit = toNumber(record.creditLimit);
  } else {
    delete record.creditLimit;
  }

  applyCustomFields('entity', source, record);
  return record;
}

function buildDocumentRecord(source, existing) {
  const record = existing ? { ...existing } : {};
  applyBaseFields('document', source, record);

  if (record.entityId !== undefined && record.entity_id === undefined) {
    record.entity_id = record.entityId;
  }
  delete record.entityId;

  for (const key of ['series', 'startDate', 'endDate', 'currency', 'paymentTerms', 'notes', 'status']) {
    if (record[key] !== undefined && record[key] !== null) {
      record[key] = trimString(record[key]);
    }
  }
  for (const key of ['folio', 'quantity', 'subtotal', 'discount', 'taxAmount', 'totalAmount']) {
    if (!isEmpty(record[key])) {
      record[key] = toNumber(record[key]);
    } else {
      delete record[key];
    }
  }

  applyCustomFields('document', source, record);
  return record;
}

export function loadEntities() {
  return readList(ENTITIES_KEY);
}

export function saveEntities(entities) {
  writeList(ENTITIES_KEY, Array.isArray(entities) ? entities : []);
}

export function loadDocuments() {
  return readList(DOCUMENTS_KEY);
}

export function saveDocuments(documents) {
  writeList(DOCUMENTS_KEY, Array.isArray(documents) ? documents : []);
}

export function validateEntity(entity) {
  const errors = {};
  const data = entity || {};

  if (!trimString(data.name)) {
    errors.name = 'El nombre es obligatorio.';
  }
  if (!trimString(data.code)) {
    errors.code = 'El código es obligatorio.';
  } else {
    const codeKey = normalizeCode(data.code);
    const duplicate = loadEntities().some(existing =>
      existing.id !== data.id && normalizeCode(existing.code) === codeKey
    );
    if (duplicate) {
      errors.code = 'El código ya existe. Debe ser único entre todas las entidades.';
    }
  }

  if (!isEmpty(data.email) && !EMAIL_PATTERN.test(String(data.email).trim())) {
    errors.email = 'El correo electrónico no tiene un formato válido.';
  }

  if (!isEmpty(data.creditLimit)) {
    const limit = Number(data.creditLimit);
    if (!Number.isFinite(limit) || limit < 0) {
      errors.creditLimit = 'El límite de crédito debe ser un número no negativo.';
    }
  }

  if (!isEmpty(data.targetDate) && !isCalendarDate(String(data.targetDate))) {
    errors.targetDate = 'La fecha objetivo debe ser una fecha de calendario válida (YYYY-MM-DD).';
  }

  validateCustomFields('entity', data, errors);

  return { valid: Object.keys(errors).length === 0, errors };
}

export function addEntity(entity) {
  const { valid, errors } = validateEntity(entity);
  if (!valid) {
    const error = new Error(Object.values(errors)[0] || 'Entidad inválida.');
    error.errors = errors;
    throw error;
  }

  const record = buildEntityRecord(entity, null);
  record.id = randomId('ent');
  record.entity_id = randomId('eid');
  record.createdAt = nowIso();
  record.updatedAt = record.createdAt;

  const entities = loadEntities();
  entities.push(record);
  saveEntities(entities);
  return record;
}

export function updateEntity(id, updates) {
  const entities = loadEntities();
  const index = entities.findIndex(entity => entity.id === id);
  if (index === -1) return null;

  const merged = { ...entities[index], ...(updates || {}) };
  const { valid, errors } = validateEntity(merged);
  if (!valid) {
    const error = new Error(Object.values(errors)[0] || 'Entidad inválida.');
    error.errors = errors;
    throw error;
  }

  const record = buildEntityRecord(merged, entities[index]);
  record.id = entities[index].id;
  record.entity_id = entities[index].entity_id;
  record.createdAt = entities[index].createdAt;
  record.updatedAt = nowIso();

  entities[index] = record;
  saveEntities(entities);
  return record;
}

export function deleteEntity(id) {
  const entities = loadEntities();
  const index = entities.findIndex(entity => entity.id === id);
  if (index === -1) return false;

  const entity = entities[index];
  entities.splice(index, 1);
  saveEntities(entities);
  deleteDocumentsForEntity(entity.entity_id);
  return true;
}

export function searchEntities(term) {
  const query = String(term == null ? '' : term)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!query) return [];

  const declared = customFieldsFor('entity').map(field => field.key);

  return loadEntities().filter(entity => {
    const values = [];
    for (const [key, value] of Object.entries(entity)) {
      if (key === 'id' || key === 'createdAt' || key === 'updatedAt') continue;
      if (declared.includes(key) || BASE_ENTITY_FIELDS.includes(key)) {
        values.push(value);
      }
    }
    return values.some(value => String(value == null ? '' : value)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .includes(query));
  });
}

function documentEntityId(document) {
  return document.entityId !== undefined ? document.entityId : document.entity_id;
}

export function validateDocument(document) {
  const errors = {};
  const data = document || {};
  const entityId = documentEntityId(data);

  if (isEmpty(entityId) || !loadEntities().some(entity => entity.entity_id === entityId)) {
    errors.entityId = 'Debe seleccionar una entidad existente para el documento.';
  }

  if (isEmpty(data.folio)) {
    errors.folio = 'El folio es obligatorio.';
  } else {
    const folio = Number(data.folio);
    if (!Number.isInteger(folio) || folio <= 0) {
      errors.folio = 'El folio debe ser un entero positivo.';
    }
  }

  if (isEmpty(data.startDate) || !isCalendarDate(String(data.startDate))) {
    errors.startDate = 'La fecha de inicio debe ser una fecha de calendario válida.';
  }
  if (isEmpty(data.endDate) || !isCalendarDate(String(data.endDate))) {
    errors.endDate = 'La fecha de fin debe ser una fecha de calendario válida.';
  }
  if (!errors.startDate && !errors.endDate && String(data.endDate) < String(data.startDate)) {
    errors.endDate = 'La fecha de fin debe ser igual o posterior a la fecha de inicio.';
  }

  if (!isEmpty(data.quantity)) {
    const quantity = Number(data.quantity);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      errors.quantity = 'La cantidad debe ser un entero positivo.';
    }
  }

  for (const key of ['subtotal', 'discount', 'taxAmount', 'totalAmount']) {
    if (!isEmpty(data[key])) {
      const amount = Number(data[key]);
      if (!Number.isFinite(amount) || amount < 0) {
        errors[key] = 'El importe debe ser un número no negativo.';
      }
    }
  }

  if (!errors.subtotal && !errors.discount
    && !isEmpty(data.subtotal) && !isEmpty(data.discount)
    && Number(data.discount) > Number(data.subtotal)) {
    errors.discount = 'El descuento no puede superar el subtotal.';
  }

  const lifecycle = getConfig() ? getConfig().statusLifecycle : null;
  if (lifecycle && !isEmpty(data.status) && !lifecycle.statuses.includes(String(data.status))) {
    errors.status = `El estado debe ser uno de: ${lifecycle.statuses.join(', ')}.`;
  }

  validateCustomFields('document', data, errors);

  return { valid: Object.keys(errors).length === 0, errors };
}

function assertTransitionAllowed(existing, nextStatus) {
  const config = getConfig();
  const lifecycle = config ? config.statusLifecycle : null;
  if (!lifecycle || isEmpty(nextStatus)) return;
  if (nextStatus === existing.status) return;
  if (isEmpty(existing.status)) return;

  const allowed = lifecycle.transitions[existing.status] || [];
  if (!allowed.includes(nextStatus)) {
    throw new Error(`Transición de estado inválida: ${existing.status} → ${nextStatus}.`);
  }
}

export function addDocument(document) {
  const { valid, errors } = validateDocument(document);
  if (!valid) {
    const error = new Error(Object.values(errors)[0] || 'Documento inválido.');
    error.errors = errors;
    throw error;
  }

  const record = buildDocumentRecord(document, null);
  record.id = randomId('doc');
  record.entity_id = documentEntityId(document);
  record.createdAt = nowIso();
  record.updatedAt = record.createdAt;

  const documents = loadDocuments();
  documents.push(record);
  saveDocuments(documents);
  return record;
}

export function updateDocument(id, updates) {
  const documents = loadDocuments();
  const index = documents.findIndex(document => document.id === id);
  if (index === -1) return null;

  const merged = { ...documents[index], ...(updates || {}) };
  if (merged.entityId !== undefined) {
    merged.entity_id = merged.entityId;
    delete merged.entityId;
  }

  assertTransitionAllowed(documents[index], merged.status);

  const { valid, errors } = validateDocument(merged);
  if (!valid) {
    const error = new Error(Object.values(errors)[0] || 'Documento inválido.');
    error.errors = errors;
    throw error;
  }

  const record = buildDocumentRecord(merged, documents[index]);
  record.id = documents[index].id;
  record.entity_id = documents[index].entity_id;
  record.createdAt = documents[index].createdAt;
  record.updatedAt = nowIso();

  documents[index] = record;
  saveDocuments(documents);
  return record;
}

export function deleteDocument(id) {
  const documents = loadDocuments();
  const index = documents.findIndex(document => document.id === id);
  if (index === -1) return false;
  documents.splice(index, 1);
  saveDocuments(documents);
  return true;
}

export function deleteDocumentsForEntity(entityId) {
  const documents = loadDocuments();
  const remaining = documents.filter(document => document.entity_id !== entityId);
  saveDocuments(remaining);
  return documents.length - remaining.length;
}

export function documentsForEntity(entityId) {
  return loadDocuments().filter(document => document.entity_id === entityId);
}

export function clearAll() {
  const storage = store();
  if (!storage) return;
  storage.removeItem(ENTITIES_KEY);
  storage.removeItem(DOCUMENTS_KEY);
}
