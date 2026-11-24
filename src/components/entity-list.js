import { escapeHtml } from '../utils/sanitize.js';
import { resolveEntityDateRule } from '../utils/entity-date.js';
import { isFieldVisible, resolveFieldRules } from '../utils/field-rules.js';
import { MESSAGES } from '../utils/messages.js';

export function renderEntityListHtml(entities, config) {
  if (!entities.length) {
    return `<p class="empty-state">${MESSAGES.noResults}</p>`;
  }
  const rules = resolveFieldRules(config, 'entity');
  const customFieldDefs = config?.customFields?.entity || [];
  const dateLabel = resolveEntityDateRule(config)?.label || 'Fecha objetivo';
  const items = entities
    .map(
      (e) => `
      <li class="list-item entity-item" data-entity-id="${escapeHtml(e.entity_id)}">
        <div class="list-item-main">
          <span class="list-item-title">${escapeHtml(e.name)}</span>
          ${isFieldVisible(rules, 'code', e) ? `<span class="list-item-code">${escapeHtml(e.code)}</span>` : ''}
          ${e.targetDate ? `<span class="list-item-date">${escapeHtml(dateLabel)}: ${escapeHtml(e.targetDate)}</span>` : ''}
          ${customFieldDefs
            .filter(
              (def) =>
                isFieldVisible(rules, def.key, e) &&
                e[def.key] !== undefined &&
                e[def.key] !== null &&
                e[def.key] !== ''
            )
            .map(
              (def) =>
                `<span class="list-item-custom" data-field="${escapeHtml(def.key)}">${escapeHtml(def.label || def.key)}: ${escapeHtml(e[def.key])}</span>`
            )
            .join('')}
        </div>
        <div class="list-item-actions">
          <button type="button" data-action="view-entity" data-entity-id="${escapeHtml(e.entity_id)}">Ver ficha</button>
          <button type="button" data-action="edit-entity" data-id="${escapeHtml(e.id)}">Editar</button>
          <button type="button" data-action="delete-entity" data-id="${escapeHtml(e.id)}">Eliminar</button>
        </div>
      </li>`
    )
    .join('');
  return `<ul class="entity-list">${items}</ul>`;
}
