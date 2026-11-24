import { escapeHtml } from '../utils/sanitize.js';
import { getLabel } from '../module-config.js';

function cardsHtml(entityLabel, documentLabel, summary) {
  return `
    <div class="summary-cards">
      <div class="stat-card"><span class="stat-value">${summary.totalEntities}</span><span class="stat-label">${escapeHtml(entityLabel)}</span></div>
      <div class="stat-card"><span class="stat-value">${summary.totalDocuments}</span><span class="stat-label">${escapeHtml(documentLabel)}</span></div>
      <div class="stat-card"><span class="stat-value">${summary.totalPending}</span><span class="stat-label">Pendientes</span></div>
    </div>`;
}

export function renderCommercialSummaryHtml(config, summary) {
  const entityLabel = getLabel(config, 'entityPlural');
  const documentLabel = getLabel(config, 'documentPlural');
  const pendingRows = (summary.pendingByEntity || [])
    .map(
      (row) => `
      <li class="list-item" data-entity-id="${escapeHtml(row.entityId)}">
        <div class="list-item-main">
          <span class="list-item-title">${escapeHtml(row.entity ? row.entity.name : row.entityId)}</span>
          <span class="stat-value">${row.count}</span>
        </div>
        <button type="button" data-action="view-entity" data-entity-id="${escapeHtml(row.entityId)}">Ver ficha</button>
      </li>`,
    )
    .join('');

  const empty = summary.totalEntities === 0 && summary.totalDocuments === 0;
  return `
    <div class="commercial-summary">
      <h2>Clientes</h2>
      ${cardsHtml(entityLabel, documentLabel, summary)}
      <h2>Historial/Ficha</h2>
      ${
        empty
          ? `<p class="empty-state">Aún no hay ${escapeHtml(entityLabel.toLowerCase())} ni ${escapeHtml(documentLabel.toLowerCase())} registrados. Crea el primer registro para ver indicadores aquí.</p>`
          : (summary.pendingByEntity || []).length
            ? `<ul class="pending-list">${pendingRows}</ul>`
            : '<p class="empty-state">No hay pendientes en este momento.</p>'
      }
    </div>
  `;
}
