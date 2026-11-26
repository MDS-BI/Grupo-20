import { escapeHtml } from '../utils/sanitize.js';
import { resolveEntityDateRule } from '../utils/entity-date.js';
import { isFieldVisible, resolveFieldRules } from '../utils/field-rules.js';
import { MESSAGES } from '../utils/messages.js';

export function renderClientManagementTableHtml(
  entities,
  config,
  { archived = false, entityLabel = 'Cliente' } = {}
) {
  const dateLabel = resolveEntityDateRule(config)?.label || 'Fecha objetivo';
  const rows = entities
    .map(
      (entity) => `
        <tr class="client-management-row" data-entity-id="${escapeHtml(entity.entity_id)}">
          <td>
            <strong>${escapeHtml(entity.name)}</strong>
            ${archived ? '<span class="status-badge archived">Archivado</span>' : ''}
          </td>
          <td>${escapeHtml(entity.code || '—')}</td>
          <td>${escapeHtml(entity.targetDate || '—')}</td>
          <td class="client-actions-cell">
            <button type="button" class="action-button" data-action="edit-entity" data-id="${escapeHtml(entity.id)}" aria-label="Editar ${escapeHtml(entity.name)}">✎ Editar</button>
            ${
              archived
                ? `<button type="button" class="action-button" data-action="restore-entity" data-id="${escapeHtml(entity.id)}" aria-label="Restaurar ${escapeHtml(entity.name)}">↩️ Restaurar</button>`
                : `<button type="button" class="action-button" data-action="archive-entity" data-id="${escapeHtml(entity.id)}" aria-label="Archivar ${escapeHtml(entity.name)}">🗄️ Archivar</button>`
            }
            <button type="button" class="action-button danger" data-action="delete-entity" data-id="${escapeHtml(entity.id)}" aria-label="Eliminar ${escapeHtml(entity.name)}">🗑️ Eliminar</button>
          </td>
        </tr>`
    )
    .join('');
  const emptyState = entities.length
    ? ''
    : `<p class="empty-state">No hay ${escapeHtml(entityLabel.toLowerCase())}s ${archived ? 'archivados' : 'activos'}.</p>`;
  return `
    <div class="client-table-wrapper">
      <table class="client-management-table">
        <thead>
          <tr>
            <th scope="col">${escapeHtml(entityLabel)}</th>
            <th scope="col">Código</th>
            <th scope="col">${escapeHtml(dateLabel)}</th>
            <th scope="col">Acciones</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      ${emptyState}
    </div>
  `;
}

export function renderEntityListHtml(entities, config, { archived = false } = {}) {
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
          ${archived ? '<span class="status-badge archived">Archivado</span>' : ''}
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
          <button type="button" data-action="view-entity" data-entity-id="${escapeHtml(e.entity_id)}">👁 Ver ficha</button>
          ${
            archived
              ? `<button type="button" data-action="restore-entity" data-id="${escapeHtml(e.id)}">↩️ Restaurar</button>`
              : `<button type="button" data-action="edit-entity" data-id="${escapeHtml(e.id)}">✎ Editar</button>
                 <button type="button" data-action="archive-entity" data-id="${escapeHtml(e.id)}">🗄️ Archivar</button>`
          }
          <button type="button" data-action="delete-entity" data-id="${escapeHtml(e.id)}">🗑️ Eliminar</button>
        </div>
      </li>`
    )
    .join('');
  return `<ul class="entity-list">${items}</ul>`;
}
