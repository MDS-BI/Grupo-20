import { escapeHtml } from '../utils/sanitize.js';
import { getLabel } from '../module-config.js';

export function formatCurrencyUsd(value) {
  const amount = Number(value) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPercent(value) {
  const rate = Number(value) || 0;
  return `${Number(rate.toFixed(1))}%`;
}

export function renderDashboardHtml(
  config,
  stats,
  { title, sectionClass = 'dashboard', showQuickActions = true } = {}
) {
  const entityLabel = stats.entityLabel || getLabel(config, 'entity');
  const documentLabel = stats.documentLabel || getLabel(config, 'document');
  const entityPlural = stats.entityPlural || getLabel(config, 'entityPlural');
  const documentPlural = stats.documentPlural || getLabel(config, 'documentPlural');
  const documents = Array.isArray(stats.documents) ? stats.documents : [];
  const funnel = Array.isArray(stats.funnel) ? stats.funnel : [];
  const documentCount = Number(stats.documentCount) || 0;
  const viewTitle = title || config.moduleName;
  const quickActions = showQuickActions
    ? `
      <div class="quick-actions">
        <button type="button" data-action="quick-new-entity">Nuevo ${escapeHtml(entityLabel)}</button>
        <button type="button" data-action="quick-new-document">Nueva ${escapeHtml(documentLabel.toLowerCase())}</button>
        <button type="button" data-action="quick-manage">Gestionar ${escapeHtml(entityPlural.toLowerCase())} (editar, archivar, eliminar)</button>
        <button type="button" data-action="quick-search">Buscar registros</button>
        <button type="button" data-action="navigate" data-view="manage-document">Gestionar ${escapeHtml(documentPlural.toLowerCase())}</button>
      </div>`
    : '';

  const lastInteractions = documents
    .slice()
    .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
    .slice(0, 5);

  return `
    <section class="${escapeHtml(sectionClass)}">
      <h1>${escapeHtml(viewTitle)}</h1>
      ${quickActions}
      <div class="summary-cards">
        <div class="stat-card"><span class="stat-value">${Number(stats.entityCount) || 0}</span><span class="stat-label">${escapeHtml(entityPlural)}</span></div>
        <div class="stat-card"><span class="stat-value">${documentCount}</span><span class="stat-label">${escapeHtml(documentPlural)}</span></div>
        <div class="stat-card"><span class="stat-value">${Number(stats.wonDocuments) || 0}</span><span class="stat-label">Cerrado ganado</span></div>
        <div class="stat-card"><span class="stat-value">${formatPercent(stats.conversionRate)}</span><span class="stat-label">Tasa de conversión</span></div>
        <div class="stat-card"><span class="stat-value">${formatCurrencyUsd(stats.pipelineTotal)}</span><span class="stat-label">Pipeline (USD)</span></div>
      </div>
      <div class="commercial-funnel">
        <h2>Embudo Comercial por Estado</h2>
        <div class="funnel-rows">
          ${funnel
            .map(
              (step) => `
            <div class="funnel-row">
              <span class="funnel-state">${escapeHtml(step.label)}</span>
              <span class="funnel-count">${Number(step.count) || 0}</span>
              <div class="funnel-bar" style="width: ${documentCount > 0 ? ((Number(step.count) || 0) / documentCount) * 100 : 0}%"></div>
            </div>`
            )
            .join('')}
        </div>
      </div>
      <div class="recent-interactions">
        <h2>Últimas Interacciones / Próximos Seguimientos</h2>
        ${
          lastInteractions.length > 0
            ? `
          <ul class="pending-list">
            ${lastInteractions
              .map(
                (doc) => `
              <li class="list-item history-item">
                <div class="list-item-main">
                  <span class="list-item-title">${escapeHtml(doc.notes || 'Sin notas')}</span>
                  <span class="status-badge" data-status="${escapeHtml(doc.status)}">${escapeHtml(doc.status || '—')}</span>
                </div>
                <div class="list-item-actions">
                  <button type="button" data-action="view-entity" data-entity-id="${escapeHtml(doc.entity_id)}">Ver ficha</button>
                </div>
              </li>`
              )
              .join('')}
          </ul>
        `
            : '<p class="empty-state">No hay interacciones recientes.</p>'
        }
      </div>
    </section>
  `;
}
