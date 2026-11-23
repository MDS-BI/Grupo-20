import { escapeHtml } from '../utils/sanitize.js';

export function renderFieldHtml(def, value, error) {
  const id = `field-${def.key}`;
  const val = value === undefined || value === null ? '' : value;
  const requiredAttr = def.required ? 'required' : '';
  const hintId = def.hint ? `hint-${def.key}` : '';
  const describedByAttr = hintId ? ` aria-describedby="${hintId}"` : '';
  let input;
  if (def.type === 'select') {
    const options = (def.options || [])
      .map((opt) => `<option value="${escapeHtml(opt)}" ${String(opt) === String(val) ? 'selected' : ''}>${escapeHtml(opt)}</option>`)
      .join('');
    input = `<select id="${id}" name="${def.key}" ${requiredAttr}${describedByAttr}><option value="">-- Seleccionar --</option>${options}</select>`;
  } else if (def.type === 'date') {
    const minAttr = def.min ? ` min="${escapeHtml(def.min)}"` : '';
    const maxAttr = def.max ? ` max="${escapeHtml(def.max)}"` : '';
    input = `<input type="date" id="${id}" name="${def.key}" value="${escapeHtml(val)}"${minAttr}${maxAttr} ${requiredAttr}${describedByAttr} />`;
  } else if (def.type === 'number') {
    input = `<input type="number" id="${id}" name="${def.key}" value="${escapeHtml(val)}" ${requiredAttr}${describedByAttr} />`;
  } else if (def.type === 'boolean') {
    input = `<input type="checkbox" id="${id}" name="${def.key}" ${val ? 'checked' : ''}${describedByAttr} />`;
  } else if (def.type === 'textarea') {
    input = `<textarea id="${id}" name="${def.key}" ${requiredAttr}${describedByAttr}>${escapeHtml(val)}</textarea>`;
  } else {
    input = `<input type="text" id="${id}" name="${def.key}" value="${escapeHtml(val)}" ${requiredAttr}${describedByAttr} />`;
  }
  const errorHtml = error
    ? `<p id="error-${escapeHtml(def.key)}" class="field-error" role="alert">${escapeHtml(error)}</p>`
    : '';
  const hintHtml = hintId
    ? `<p id="${hintId}" class="field-hint" data-role="date-range">${escapeHtml(def.hint)}</p>`
    : '';
  return `<div class="form-field${error ? ' has-error' : ''}"><label for="${id}">${escapeHtml(def.label)}${def.required ? ' *' : ''}</label>${input}${hintHtml}${errorHtml}</div>`;
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

export function buildFormBaseline(defs, values = {}) {
  const baseline = {};
  for (const def of defs) {
    baseline[def.key] = values[def.key] ?? (def.type === 'boolean' ? false : '');
  }
  return baseline;
}

export function isFormDirty(formEl, defs, baseline) {
  if (!formEl || !baseline) return false;
  const current = collectFormData(formEl, defs);
  return Object.keys(baseline).some((key) => String(current[key] ?? '') !== String(baseline[key] ?? ''));
}
