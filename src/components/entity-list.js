import { escapeHtml } from '../utils/sanitize.js';
import { getLabel } from '../module-config.js';

export function renderEntityListHtml(entities, config, options = {}) {
  const entityLabel = getLabel(config, 'entity').toLowerCase();
  const entityPlural = getLabel(config, 'entityPlural').toLowerCase();
  const documentLabel = getLabel(config, 'document').toLowerCase();
  const documentPlural = getLabel(config, 'documentPlural').toLowerCase();
  const documents = options.documents || [];
  const customFieldDefs = config?.customFields?.entity || [];

  if (!entities.length) {
    const message = options.emptyMessage || `No hay ${entityPlural} registrados todavía`;
    const clearButton = options.showClearFilters
      ? `<button type="button" class="button-secondary" data-action="clear-search-filters">Limpiar búsqueda</button>`
      : '';
    return `
      <div class="empty-state">
        <p class="empty-state-message">${escapeHtml(message)}</p>
        <div class="empty-state-actions">
          <button type="button" data-action="quick-new-entity">Crear ${escapeHtml(entityLabel)}</button>
          ${clearButton}
        </div>
      </div>`;
  }

  const items = entities
    .map((e) => {
      const linked = documents.filter((d) => d.entity_id === e.entity_id);
      const count = linked.length;
      const interactionLabel = count === 1 ? documentLabel : documentPlural;
      const customFields = customFieldDefs
        .filter((def) => e[def.key] !== undefined && e[def.key] !== null && e[def.key] !== '')
        .map(
          (def) =>
            `<span class="list-item-custom" data-field="${escapeHtml(def.key)}">${escapeHtml(def.label || def.key)}: ${escapeHtml(e[def.key])}</span>`,
        )
        .join('');

      return `
      <li class="list-item entity-item entity-card" data-entity-id="${escapeHtml(e.entity_id)}">
        <div class="entity-card-main">
          <div class="entity-card-heading">
            <span class="list-item-title">${escapeHtml(e.name)}</span>
            <span class="list-item-code entity-card-code">${escapeHtml(e.code)}</span>
          </div>
          <div class="entity-card-meta">
            ${e.category ? `<span class="entity-card-category"><span class="meta-label">Categoría</span>${escapeHtml(e.category)}</span>` : ''}
            ${e.targetDate ? `<span class="list-item-date entity-card-date"><span class="meta-label">Próxima fecha</span>${escapeHtml(e.targetDate)}</span>` : ''}
            <span class="entity-card-interactions"><span class="meta-label">Seguimiento</span>${count} ${escapeHtml(interactionLabel)}</span>
          </div>
          ${customFields ? `<div class="entity-card-extra">${customFields}</div>` : ''}
        </div>
        <div class="list-item-actions entity-card-actions">
          <button type="button" data-action="view-entity" data-entity-id="${escapeHtml(e.entity_id)}">Ver ficha</button>
          <button type="button" data-action="edit-entity" data-id="${escapeHtml(e.id)}">Editar</button>
          <button type="button" data-action="delete-entity" data-id="${escapeHtml(e.id)}">Eliminar</button>
        </div>
      </li>`;
    })
    .join('');
  return `<ul class="entity-list entity-card-list">${items}</ul>`;
}
