import { escapeHtml } from '../utils/sanitize.js';
import { getLabel } from '../module-config.js';
import { renderDocumentListHtml } from './document-list.js';

export function renderEntityDetailHtml(config, entity, documents) {
  if (!entity) {
    return `<p class="empty-state">${getLabel(config, 'entity')} no encontrada.</p>`;
  }
  const customFieldDefs = config?.customFields?.entity || [];
  const customFieldsHtml = customFieldDefs
    .filter((def) => entity[def.key] !== undefined && entity[def.key] !== null && entity[def.key] !== '')
    .map(
      (def) =>
        `<p class="entity-detail-custom" data-field="${escapeHtml(def.key)}">${escapeHtml(def.label || def.key)}: ${escapeHtml(entity[def.key])}</p>`,
    )
    .join('');
  return `
    <article id="entity-detail" class="entity-detail" data-entity-id="${escapeHtml(entity.entity_id)}">
      <header class="entity-detail-header">
        <h2 id="entity-detail-title">${escapeHtml(entity.name)}</h2>
        <div id="entity-detail-info" class="entity-detail-info">
          <p class="entity-detail-code">${getLabel(config, 'entity')}: ${escapeHtml(entity.code)}</p>
          ${entity.category ? `<p>${escapeHtml(entity.category)}</p>` : ''}
          ${entity.description ? `<p>${escapeHtml(entity.description)}</p>` : ''}
          ${entity.targetDate ? `<p>Fecha objetivo: ${escapeHtml(entity.targetDate)}</p>` : ''}
          ${customFieldsHtml}
        </div>
      </header>
      <section class="entity-detail-history">
        <h3>Historial de ${getLabel(config, 'documentPlural').toLowerCase()}</h3>
        <div id="entity-history" class="history-list">
          ${renderDocumentListHtml(documents, config)}
        </div>
        <p id="entity-history-empty" class="empty-state" ${documents.length ? 'hidden' : ''}>Este registro no tiene documentos asociados.</p>
      </section>
    </article>
  `;
}
