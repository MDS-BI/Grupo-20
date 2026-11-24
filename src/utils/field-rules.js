import { resolveEntityDateRule } from './entity-date.js';
import { isValidFormat } from './field-formats.js';
import { MESSAGES, exactFormatMessage } from './messages.js';
import { getConfig } from '../module-config.js';

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function resolveFieldRules(config, entityType = 'entity') {
  const declared = config?.fieldRules;
  if (!isPlainObject(declared)) return {};
  const inherited = {};
  for (const [key, rule] of Object.entries(declared)) {
    if (key === 'entity' || key === 'document') continue;
    if (isPlainObject(rule)) inherited[key] = rule;
  }
  const scoped = isPlainObject(declared[entityType]) ? declared[entityType] : {};
  return { ...inherited, ...scoped };
}

export function isConditionActive(rule, values = {}) {
  const condition = rule?.when;
  if (!isPlainObject(condition) || !condition.key) return true;
  const actual = values?.[condition.key];
  if (Array.isArray(condition.equals)) return condition.equals.includes(actual);
  return actual === condition.equals;
}

export const CANONICAL_SEARCH_KEYS = Object.freeze({
  entity: Object.freeze(['name', 'code', 'category', 'description', 'targetDate']),
  document: Object.freeze(['notes', 'status']),
});

export function canonicalSearchKeys(entityType = 'entity', customKeys = []) {
  const base = CANONICAL_SEARCH_KEYS[entityType] || CANONICAL_SEARCH_KEYS.entity;
  const rules = resolveFieldRules(getConfig(), entityType);
  const isSearchable = (key) => !rules[key] || isFieldPotentiallySearchable(rules, key);
  return [...new Set([...base, ...customKeys].filter(isSearchable))];
}

export function isFieldVisible(rules, key, values = {}) {
  const rule = rules?.[key] || {};
  return !rule.hidden && isConditionActive(rule, values);
}

export function isFieldSearchable(rules, key, values = {}) {
  const rule = rules?.[key] || {};
  return isFieldVisible(rules, key, values) && rule.searchable !== false;
}

export function isFieldPotentiallySearchable(rules, key) {
  const rule = rules?.[key] || {};
  if (rule.hidden || rule.searchable === false) return false;
  const condition = rule.when;
  if (!isPlainObject(condition) || !condition.key) return true;
  const values = Array.isArray(condition.equals) ? condition.equals : [condition.equals];
  return values.some((value) => isFieldSearchable(rules, key, { [condition.key]: value }));
}

export function groupKeysByActiveField(rules, values = {}) {
  const groups = new Map();
  for (const [key, rule] of Object.entries(rules || {})) {
    if (!rule.group || !isConditionActive(rule, values)) continue;
    if (!groups.has(rule.group)) groups.set(rule.group, new Set());
    groups.get(rule.group).add(key);
  }
  return groups;
}

export function pruneInactiveGroupValues(values = {}, rules = {}) {
  const result = { ...values };
  const groups = groupKeysByActiveField(rules, values);
  for (const [key, rule] of Object.entries(rules)) {
    if (!rule.group) continue;
    const activeKeys = groups.get(rule.group);
    if (!activeKeys || !activeKeys.has(key)) delete result[key];
  }
  return result;
}

export function getReadinessErrors(entity = {}, config, entityType = 'entity') {
  const rules = resolveFieldRules(config, entityType);
  const errors = {};
  for (const [key, rule] of Object.entries(rules)) {
    if (!isConditionActive(rule, entity)) continue;
    const value = entity[key];
    const isEmpty = value === undefined || value === null || value === '';
    if (rule.required && isEmpty) errors[key] = MESSAGES.required;
    if (!isEmpty && rule.format && !isValidFormat(rule.format, value)) {
      errors[key] = exactFormatMessage(key);
    }
  }
  const dateRule = resolveEntityDateRule(config);
  if (dateRule?.required && !entity.targetDate) {
    errors.targetDate = MESSAGES.required;
  }
  return errors;
}
