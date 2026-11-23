import { buildFormBaseline, collectFormData, isFormDirty, renderFieldsHtml } from './form-fields.js';
import { getLabel } from '../module-config.js';
import { resolveEntityDateRule } from '../utils/entity-date.js';

export function getEntityFieldDefs(config) {
  const dateRule = resolveEntityDateRule(config);
  const dateLabel = dateRule?.label || 'Fecha objetivo';
  const rangeParts = [dateRule?.min && `desde ${dateRule.min}`, dateRule?.max && `hasta ${dateRule.max}`].filter(Boolean);
  const base = [
    { key: 'name', label: `Nombre de ${getLabel(config, 'entity')}`, type: 'text', required: true },
    { key: 'code', label: 'Código', type: 'text', required: true },
    { key: 'category', label: 'Categoría', type: 'text' },
    { key: 'description', label: 'Descripción', type: 'textarea' },
    {
      key: 'targetDate',
      label: dateLabel,
      type: 'date',
      min: dateRule?.min || '',
      max: dateRule?.max || '',
      hint: rangeParts.length ? `Rango permitido ${rangeParts.join(' y ')} (inclusive).` : '',
    },
  ];
  return [...base, ...(config.customFields?.entity || [])];
}

export function renderEntityFormHtml(config, entity = {}, errors = {}) {
  const defs = getEntityFieldDefs(config);
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

export function collectEntityFormData(formEl, config) {
  return collectFormData(formEl, getEntityFieldDefs(config));
}

export function buildEntityFormBaseline(config, entity = {}) {
  return buildFormBaseline(getEntityFieldDefs(config), entity);
}

export function isEntityFormDirty(formEl, config, baseline) {
  return isFormDirty(formEl, getEntityFieldDefs(config), baseline);
}
