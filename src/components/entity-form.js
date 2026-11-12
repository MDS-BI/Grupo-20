import { getConfig } from '../module-config.js';

function byId(id) {
  return document.getElementById(id);
}

export function declaredFields(target) {
  const config = getConfig();
  const fields = config && Array.isArray(config.customFields) ? config.customFields : [];
  return fields.filter(field => field.target === target);
}

function createControl(field) {
  if (field.type === 'select') {
    const select = document.createElement('select');
    select.id = `cf-${field.key}`;
    select.name = field.key;
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = '--';
    select.appendChild(placeholder);
    for (const option of field.options || []) {
      const element = document.createElement('option');
      element.value = option;
      element.textContent = option;
      select.appendChild(element);
    }
    return select;
  }

  const input = document.createElement('input');
  input.id = `cf-${field.key}`;
  input.name = field.key;
  input.type = field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text';
  return input;
}

export function renderCustomFields(container, target) {
  const fields = declaredFields(target);
  if (!container) return fields;

  container.replaceChildren();
  if (fields.length === 0) {
    container.hidden = true;
    return fields;
  }

  container.hidden = false;
  for (const field of fields) {
    const wrapper = document.createElement('div');
    wrapper.className = 'custom-field';

    const label = document.createElement('label');
    label.htmlFor = `cf-${field.key}`;
    label.textContent = `${field.label}${field.required ? ' *' : ''}`;

    const error = document.createElement('p');
    error.className = 'error';
    error.id = `error-cf-${field.key}`;

    wrapper.appendChild(label);
    wrapper.appendChild(createControl(field));
    wrapper.appendChild(error);
    container.appendChild(wrapper);
  }
  return fields;
}

export function readCustomFields(target) {
  const values = {};
  for (const field of declaredFields(target)) {
    const control = byId(`cf-${field.key}`);
    if (control) values[field.key] = control.value;
  }
  return values;
}

export function fillCustomFields(target, record) {
  for (const field of declaredFields(target)) {
    const control = byId(`cf-${field.key}`);
    if (!control) continue;
    const value = record ? record[field.key] : '';
    control.value = value === undefined || value === null ? '' : String(value);
  }
}

export function clearCustomFields(target) {
  fillCustomFields(target, null);
  clearCustomFieldErrors(target);
}

export function clearCustomFieldErrors(target) {
  for (const field of declaredFields(target)) {
    const error = byId(`error-cf-${field.key}`);
    if (error) error.textContent = '';
  }
}
