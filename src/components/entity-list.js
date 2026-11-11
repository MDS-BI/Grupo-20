import { escapeHtml } from '../utils/sanitize.js';
import { getLabel } from '../module-config.js';

export function renderEntityListHtml(entities, config) {
  if (!entities.length) {
    return `<p class="empty-state">No hay ${getLabel(config, 'entityPlural').toLowerCase()} registradas todavía. Crea la primera usando el formulario.</p>`;
  }
  const items = entities
    .map(
      (e) => `
      <li class="list-item" data-entity-id="${escapeHtml(e.entity_id)}">
        <div class="list-item-main">
          <span class="list-item-title">${escapeHtml(e.name)}</span>
          <span class="list-item-code">${escapeHtml(e.code)}</span>
          ${e.targetDate ? `<span class="list-item-date">Objetivo: ${escapeHtml(e.targetDate)}</span>` : ''}
        </div>
        <div class="list-item-actions">
          <button type="button" data-action="view-entity" data-entity-id="${escapeHtml(e.entity_id)}">Ver ficha</button>
          <button type="button" data-action="edit-entity" data-id="${escapeHtml(e.id)}">Editar</button>
          <button type="button" data-action="delete-entity" data-id="${escapeHtml(e.id)}">Eliminar</button>
        </div>
      </li>`,
    )
    .join('');
  return `<ul class="entity-list">${items}</ul>`;
}
