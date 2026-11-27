import { canonicalSearchKeys, isFieldSearchable, resolveFieldRules } from './field-rules.js';
import { getConfig } from '../module-config.js';

export function normalizeText(value) {
  return String(value === null || value === undefined ? '' : value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export const normalizeSearchText = normalizeText;

export function matchesQuery(value, query) {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return false;
  return normalizeText(value).includes(normalizedQuery);
}

export function matchesAny(values, query) {
  return values.some((value) => matchesQuery(value, query));
}

export function searchableValues(record, keys, rules) {
  const values = [];
  for (const key of keys) {
    if (!isFieldSearchable(rules, key, record)) continue;
    const value = record?.[key];
    if (value !== undefined && value !== null) values.push(String(value));
  }
  return values;
}

export function computeSearchResults(
  query,
  {
    entities = [],
    documents = [],
    config = getConfig(),
    customFieldKeys = [],
    documentCustomFieldKeys = customFieldKeys,
    entityKeys,
    documentKeys,
  } = {}
) {
  const normalizedQuery = normalizeText(query);
  const safeEntities = Array.isArray(entities) ? entities : [];
  const safeDocuments = Array.isArray(documents) ? documents : [];
  const resolvedEntityKeys = entityKeys || canonicalSearchKeys('entity', customFieldKeys, config);
  const resolvedDocumentKeys =
    documentKeys || canonicalSearchKeys('document', documentCustomFieldKeys, config);
  const entityRules = resolveFieldRules(config, 'entity');
  const documentRules = resolveFieldRules(config, 'document');

  if (!normalizedQuery) {
    return { entities: safeEntities.slice(), documents: safeDocuments.slice() };
  }

  const documentMatchesByEntity = new Map();
  const matchingDocuments = [];
  for (const document of safeDocuments) {
    const matches = matchesAny(
      searchableValues(document, resolvedDocumentKeys, documentRules),
      normalizedQuery
    );
    if (matches) matchingDocuments.push(document);
    if (!matches || !document?.entity_id) continue;
    documentMatchesByEntity.set(document.entity_id, true);
  }

  const matchingEntities = [];
  for (const entity of safeEntities) {
    const ownMatch = matchesAny(
      searchableValues(entity, resolvedEntityKeys, entityRules),
      normalizedQuery
    );
    if (ownMatch || documentMatchesByEntity.get(entity?.entity_id) === true) {
      matchingEntities.push(entity);
    }
  }

  return { entities: matchingEntities, documents: matchingDocuments };
}

export function computeSearchMatches(query, options = {}) {
  const results = computeSearchResults(query, options);
  const matches = results.entities;
  Object.defineProperty(matches, 'entities', {
    configurable: true,
    enumerable: false,
    value: results.entities,
  });
  Object.defineProperty(matches, 'documents', {
    configurable: true,
    enumerable: false,
    value: results.documents,
  });
  return matches;
}

export function searchVisibleEntities(query, options = {}) {
  return computeSearchMatches(query, options);
}
