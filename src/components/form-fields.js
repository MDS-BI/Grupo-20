import { escapeHtml } from '../utils/sanitize.js';

export function renderFieldHtml(def, value, error) {
  const id = `field-${def.key}`;
  const val = value === undefined || value === null ? '' : value;
  const requiredAttr = def.required ? 'required' : '';
  let input;
  if (def.type === 'select') {
    const options = (def.options || [])
      .map((opt) => `<option value="${escapeHtml(opt)}" ${String(opt) === String(val) ? 'selected' : ''}>${escapeHtml(opt)}</option>`)
      .join('');
    input = `<select id="${id}" name="${def.key}" ${requiredAttr}><option value="">-- Seleccionar --</option>${options}</select>`;
  } else if (def.type === 'date') {
    input = `<input type="date" id="${id}" name="${def.key}" value="${escapeHtml(val)}" ${requiredAttr} />`;
  } else if (def.type === 'number') {
    input = `<input type="number" id="${id}" name="${def.key}" value="${escapeHtml(val)}" ${requiredAttr} />`;
  } else if (def.type === 'boolean') {
    input = `<input type="checkbox" id="${id}" name="${def.key}" ${val ? 'checked' : ''} />`;
  } else if (def.type === 'textarea') {
    input = `<textarea id="${id}" name="${def.key}" ${requiredAttr}>${escapeHtml(val)}</textarea>`;
  } else {
    input = `<input type="text" id="${id}" name="${def.key}" value="${escapeHtml(val)}" ${requiredAttr} />`;
  }
  const errorHtml = error
    ? `<p id="error-${escapeHtml(def.key)}" class="field-error" role="alert">${escapeHtml(error)}</p>`
    : '';
  return `<div class="form-field${error ? ' has-error' : ''}"><label for="${id}">${escapeHtml(def.label)}${def.required ? ' *' : ''}</label>${input}${errorHtml}</div>`;
}

export function renderFieldsHtml(defs, values = {}, errors = {}) {
  return defs.map((def) => renderFieldHtml(def, values[def.key], errors?.[def.key])).join('\n');
}

export function collectFormData(formEl, defs) {
  const data = {};
  for (const def of defs) {
    const el = formEl.elements.namedItem(def.key);
    if (!el) continue;
    data[def.key] = def.type === 'boolean' ? el.checked : el.value;
  }
  return data;
}
