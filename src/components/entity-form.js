import { renderFieldsHtml, collectFormData } from './form-fields.js';
import { getLabel } from '../module-config.js';

export function getEntityFieldDefs(config) {
  const base = [
    { key: 'name', label: `Nombre de ${getLabel(config, 'entity')}`, type: 'text', required: true },
    { key: 'code', label: 'Código', type: 'text', required: true },
    { key: 'category', label: 'Categoría', type: 'text' },
    { key: 'description', label: 'Descripción', type: 'textarea' },
    { key: 'targetDate', label: 'Fecha objetivo', type: 'date' },
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
