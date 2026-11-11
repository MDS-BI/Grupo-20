import { escapeHtml } from '../utils/sanitize.js';
import { getLabel } from '../module-config.js';
import { renderDocumentListHtml } from './document-list.js';

export function renderEntityDetailHtml(config, entity, documents) {
  if (!entity) {
    return `<p class="empty-state">${getLabel(config, 'entity')} no encontrada.</p>`;
  }
  return `
    <article class="entity-detail" data-entity-id="${escapeHtml(entity.entity_id)}">
      <header class="entity-detail-header">
        <h2>${escapeHtml(entity.name)}</h2>
        <p class="entity-detail-code">${getLabel(config, 'entity')}: ${escapeHtml(entity.code)}</p>
        ${entity.category ? `<p>${escapeHtml(entity.category)}</p>` : ''}
        ${entity.description ? `<p>${escapeHtml(entity.description)}</p>` : ''}
        ${entity.targetDate ? `<p>Fecha objetivo: ${escapeHtml(entity.targetDate)}</p>` : ''}
      </header>
      <section class="entity-detail-history">
        <h3>Historial de ${getLabel(config, 'documentPlural').toLowerCase()}</h3>
        ${renderDocumentListHtml(documents, config)}
      </section>
    </article>
  `;
}
