import {
  buildFormBaseline,
  collectFormData,
  isFormDirty,
  renderFieldsHtml,
} from './form-fields.js';
import { getLabel } from '../module-config.js';

function statusOptions(config, document) {
  const lifecycle = config?.statusLifecycle;
  if (!lifecycle) return null;
  const transitions =
    lifecycle.transitions && typeof lifecycle.transitions === 'object' ? lifecycle.transitions : {};
  const options = new Set();
  for (const [from, targets] of Object.entries(transitions)) {
    if (from) options.add(from);
    if (Array.isArray(targets)) for (const to of targets) options.add(to);
  }
  if (!options.size && Array.isArray(lifecycle.states)) {
    for (const state of lifecycle.states) options.add(state);
  }
  if (document?.status) options.add(document.status);
  return Array.from(options);
}

export function getDocumentFieldDefs(config, document = {}) {
  const options = statusOptions(config, document);
  const statusField = options
    ? { key: 'status', label: 'Estado', type: 'datalist', options }
    : { key: 'status', label: 'Estado', type: 'text' };
  const base = [
    { key: 'startDate', label: 'Fecha', type: 'date' },
    { key: 'endDate', label: 'Fecha de término', type: 'date' },
    { key: 'notes', label: 'Notas', type: 'textarea' },
  ];
  return [...base, statusField, ...(config.customFields?.document || [])];
}

export function renderDocumentFormHtml(config, document = {}, errors = {}) {
  const defs = getDocumentFieldDefs(config, document);
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

export function buildDocumentFormBaseline(config, doc = {}) {
  return buildFormBaseline(getDocumentFieldDefs(config, doc), doc);
}

export function isDocumentFormDirty(formEl, config, baseline) {
  return isFormDirty(formEl, getDocumentFieldDefs(config), baseline);
}
