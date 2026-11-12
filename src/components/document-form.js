import { getConfig } from '../module-config.js';
import { declaredFields, readCustomFields, fillCustomFields, clearCustomFields, clearCustomFieldErrors, renderCustomFields } from './entity-form.js';

function byId(id) {
  return document.getElementById(id);
}

function buildStatusInput() {
  const input = document.createElement('input');
  input.id = 'status';
  input.name = 'status';
  input.type = 'text';
  input.autocomplete = 'off';
  return input;
}

function buildStatusSelect(lifecycle, currentStatus, isEditing) {
  const select = document.createElement('select');
  select.id = 'status';
  select.name = 'status';

  let statuses;
  if (isEditing && currentStatus && lifecycle.statuses.includes(currentStatus)) {
    const next = lifecycle.transitions[currentStatus] || [];
    statuses = [currentStatus, ...next.filter(status => status !== currentStatus)];
  } else {
    statuses = ['', ...lifecycle.statuses];
  }

  for (const status of statuses) {
    const option = document.createElement('option');
    option.value = status;
    option.textContent = status === '' ? '--' : status;
    select.appendChild(option);
  }
  return select;
}

export function renderStatusControl(isEditing, currentStatus) {
  const existing = byId('status');
  if (!existing) return null;

  const config = getConfig();
  const lifecycle = config ? config.statusLifecycle : null;
  const next = lifecycle
    ? buildStatusSelect(lifecycle, currentStatus, isEditing)
    : buildStatusInput();

  existing.replaceWith(next);
  return next;
}

export { declaredFields, readCustomFields, fillCustomFields, clearCustomFields, clearCustomFieldErrors, renderCustomFields };
