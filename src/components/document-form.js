import { renderFieldsHtml, collectFormData } from './form-fields.js';
import { getLabel } from '../module-config.js';

export function getDocumentFieldDefs(config) {
  const statusField = config.statusLifecycle
    ? { key: 'status', label: 'Estado', type: 'select', options: config.statusLifecycle.states }
    : { key: 'status', label: 'Estado', type: 'text' };
  const base = [
    { key: 'startDate', label: 'Fecha', type: 'date' },
    { key: 'endDate', label: 'Fecha de término', type: 'date' },
    { key: 'notes', label: 'Notas', type: 'textarea' },
  ];
  return [...base, statusField, ...(config.customFields?.document || [])];
}

export function renderDocumentFormHtml(config, document = {}, errors = {}) {
  const defs = getDocumentFieldDefs(config);
  const label = getLabel(config, 'document');
  return `
    <form id="document-form" novalidate aria-label="Formulario de ${label}">
      ${renderFieldsHtml(defs, document, errors)}
      <div class="form-actions">
        <button type="submit">Guardar</button>
        <button type="button" data-action="cancel-document-form">Cancelar</button>
      </div>
    </form>
  `;
}

export function collectDocumentFormData(formEl, config) {
  return collectFormData(formEl, getDocumentFieldDefs(config));
}
