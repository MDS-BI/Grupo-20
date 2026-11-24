import {
  buildFormBaseline,
  collectFormData,
  isFormDirty,
  renderFieldsHtml,
} from './form-fields.js';
import { getLabel } from '../module-config.js';
import { resolveEntityDateRule } from '../utils/entity-date.js';
import { isFieldVisible, resolveFieldRules } from '../utils/field-rules.js';

export function getEntityFieldDefs(config, values = {}) {
  const dateRule = resolveEntityDateRule(config);
  const rules = resolveFieldRules(config, 'entity');
  const dateLabel = dateRule?.label || 'Fecha objetivo';
  const rangeParts = [
    dateRule?.min && `desde ${dateRule.min}`,
    dateRule?.max && `hasta ${dateRule.max}`,
  ].filter(Boolean);
  const applyRule = (def) => {
    const rule = rules[def.key] || {};
    return {
      ...def,
      label: rule.label || def.label || def.key,
      type: rule.type || def.type,
      required: Boolean(rule.required || def.required),
      placeholder: rule.placeholder || def.placeholder,
      options: rule.options || def.options,
      order: Number.isFinite(rule.order) ? rule.order : def.order,
      when: rule.when ? { ...rule.when } : undefined,
    };
  };
  const base = [
    { key: 'name', label: `Nombre de ${getLabel(config, 'entity')}`, type: 'text', required: true },
    { key: 'code', label: 'Código', type: 'text', required: true },
    { key: 'category', label: 'Categoría', type: 'text' },
    { key: 'description', label: 'Descripción', type: 'textarea' },
    {
      key: 'targetDate',
      label: dateLabel,
      type: 'date',
      required: Boolean(dateRule?.required),
      min: dateRule?.min || '',
      max: dateRule?.max || '',
      hint: rangeParts.length ? `Rango permitido ${rangeParts.join(' y ')} (inclusive).` : '',
    },
  ]
    .filter((def) => isFieldVisible(rules, def.key, values))
    .map(applyRule);
  const custom = (config.customFields?.entity || [])
    .filter((def) => isFieldVisible(rules, def.key, values))
    .map(applyRule);
  return [...base, ...custom].sort((a, b) => {
    const orderA = Number.isFinite(a.order) ? a.order : Number.MAX_SAFE_INTEGER;
    const orderB = Number.isFinite(b.order) ? b.order : Number.MAX_SAFE_INTEGER;
    return orderA - orderB;
  });
}

export function renderEntityFormHtml(config, entity = {}, errors = {}) {
  const defs = getEntityFieldDefs(config, entity);
  const label = getLabel(config, 'entity');
  return `
    <form id="entity-form" novalidate aria-label="Formulario de ${label}">
      ${renderFieldsHtml(defs, entity, errors)}
      <div class="form-actions">
        <button type="submit">Guardar</button>
        <button type="button" data-action="cancel-entity-form">Cancelar</button>
      </div>
    </form>
  `;
}

export function collectEntityFormData(formEl, config, values = {}) {
  return collectFormData(formEl, getEntityFieldDefs(config, values));
}

export function buildEntityFormBaseline(config, entity = {}) {
  return buildFormBaseline(getEntityFieldDefs(config, entity), entity);
}

export function isEntityFormDirty(formEl, config, baseline, values = {}) {
  return isFormDirty(formEl, getEntityFieldDefs(config, values), baseline);
}
