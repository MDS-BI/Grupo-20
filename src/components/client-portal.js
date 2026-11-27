import { escapeHtml } from '../utils/sanitize.js';
import { DEFAULT_POSTVENTA_CONFIG } from '../utils/postventa.js';

const TABS = [
  { key: 'quote', label: 'Solicitar cotización' },
  { key: 'support', label: 'Soporte Postventa' },
];

function fieldValue(values, key) {
  const value = values?.[key];
  return value === undefined || value === null ? '' : value;
}

function renderFieldError(name, error) {
  return error
    ? `<p id="error-${escapeHtml(name)}" class="field-error" role="alert">${escapeHtml(error)}</p>`
    : '';
}

function renderTextField({ name, label, type = 'text', values, errors }) {
  const id = `field-${name}`;
  const error = errors?.[name];
  return `<div class="form-field${error ? ' has-error' : ''}">
    <label for="${escapeHtml(id)}">${escapeHtml(label)} *</label>
    <input id="${escapeHtml(id)}" name="${escapeHtml(name)}" type="${escapeHtml(type)}" value="${escapeHtml(fieldValue(values, name))}" required />
    ${renderFieldError(name, error)}
  </div>`;
}

function renderConsentField(values, errors) {
  const name = 'consentimiento';
  const id = `field-${name}`;
  const error = errors?.[name];
  return `<div class="form-field portal-consent${error ? ' has-error' : ''}">
    <label for="${escapeHtml(id)}">${escapeHtml('Acepto el aviso de privacidad y el tratamiento de mis datos para esta solicitud.')} *</label>
    <input id="${escapeHtml(id)}" name="${escapeHtml(name)}" type="checkbox"${fieldValue(values, name) ? ' checked' : ''} required />
    ${renderFieldError(name, error)}
  </div>`;
}

function resolveCategoryOptions(values) {
  const categories = values?.categories;
  const source =
    Array.isArray(categories) && categories.length
      ? categories
      : DEFAULT_POSTVENTA_CONFIG.categoryOptions;
  return source.map((option) => {
    if (typeof option === 'string') return { value: option, label: option };
    return {
      value: option?.value ?? '',
      label: option?.label ?? option?.value ?? '',
    };
  });
}

function renderCategoryField(values, errors) {
  const name = 'categoria';
  const id = `field-${name}`;
  const error = errors?.[name];
  const selected = fieldValue(values, name);
  const placeholder = `<option value=""${selected ? '' : ' selected'}>${escapeHtml('-- Seleccionar --')}</option>`;
  const options = resolveCategoryOptions(values)
    .map(
      (option) =>
        `<option value="${escapeHtml(option.value)}"${String(option.value) === String(selected) ? ' selected' : ''}>${escapeHtml(option.label)}</option>`
    )
    .join('');
  return `<div class="form-field${error ? ' has-error' : ''}">
    <label for="${escapeHtml(id)}">${escapeHtml('Categoría')} *</label>
    <select id="${escapeHtml(id)}" name="${escapeHtml(name)}" required>${placeholder}${options}</select>
    ${renderFieldError(name, error)}
  </div>`;
}

function renderTextareaField({ name, label, values, errors }) {
  const id = `field-${name}`;
  const error = errors?.[name];
  return `<div class="form-field${error ? ' has-error' : ''}">
    <label for="${escapeHtml(id)}">${escapeHtml(label)} *</label>
    <textarea id="${escapeHtml(id)}" name="${escapeHtml(name)}" required>${escapeHtml(fieldValue(values, name))}</textarea>
    ${renderFieldError(name, error)}
  </div>`;
}

function renderQuoteForm(values, errors) {
  return `<form id="portal-quote-form" class="portal-form" novalidate aria-label="Formulario de solicitud de cotización">
    ${renderTextField({ name: 'name', label: 'Nombre', values, errors })}
    ${renderTextField({ name: 'empresa', label: 'Empresa', values, errors })}
    ${renderTextField({ name: 'correo', label: 'Correo', values, errors })}
    ${renderTextField({ name: 'telefono', label: 'Teléfono', values, errors })}
    ${renderTextField({ name: 'servicio_interes', label: 'Servicio de interés', values, errors })}
    ${renderTextField({ name: 'monto_estimado', label: 'Monto estimado', type: 'number', values, errors })}
    ${renderConsentField(values, errors)}
    <div class="form-actions">
      <button type="submit">Enviar datos</button>
    </div>
  </form>`;
}

function renderSupportForm(values, errors) {
  return `<form id="portal-support-form" class="portal-form" novalidate aria-label="Formulario de soporte postventa">
    ${renderTextField({ name: 'correo_cliente', label: 'Correo del cliente', values, errors })}
    ${renderCategoryField(values, errors)}
    ${renderTextareaField({ name: 'descripcion', label: 'Descripción del problema', values, errors })}
    <div class="form-actions">
      <button type="submit">Enviar datos</button>
    </div>
  </form>`;
}

function renderTab(tab, activeTab) {
  const isActive = tab.key === activeTab;
  const activeAttrs = isActive ? ' class="is-active"' : '';
  return `<button type="button" data-action="portal-tab" data-tab="${escapeHtml(tab.key)}"${activeAttrs} aria-selected="${isActive}">${escapeHtml(tab.label)}</button>`;
}

export function renderClientPortalHtml({
  tab = 'quote',
  values = {},
  errors = {},
  confirmation = '',
} = {}) {
  const activeTab = tab === 'support' ? 'support' : 'quote';
  const errorHtml = errors?._form
    ? `<p id="portal-error" role="alert" class="form-error">${escapeHtml(errors._form)}</p>`
    : '';
  const confirmationHtml = confirmation
    ? `<p id="portal-confirmation" role="status" class="portal-confirmation">${escapeHtml(confirmation)}</p>`
    : '';
  const formHtml =
    activeTab === 'support' ? renderSupportForm(values, errors) : renderQuoteForm(values, errors);
  return `
    <section class="portal-view">
      <h1>Portal del Cliente</h1>
      <div class="portal-tabs" role="tablist" aria-label="Opciones del Portal del Cliente">${TABS.map((item) => renderTab(item, activeTab)).join('')}</div>
      ${errorHtml}
      ${confirmationHtml}
      ${formHtml}
    </section>
  `;
}

export function collectPortalFormData(form) {
  if (!form) return { consentimiento: false };
  const data = Object.fromEntries(new FormData(form));
  const consentField = form.elements?.namedItem('consentimiento');
  data.consentimiento = Boolean(consentField?.checked);
  return data;
}
