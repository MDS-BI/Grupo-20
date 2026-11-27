import { escapeHtml } from '../utils/sanitize.js';
import { getLabel } from '../module-config.js';
import { renderDashboardChartsHtml } from './dashboard-charts.js';

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
  {
    title,
    sectionClass = 'dashboard',
    showQuickActions = true,
    chartData = null,
    funnelOnly = false,
  } = {}
) {
  const entityPlural = stats.entityPlural || getLabel(config, 'entityPlural');
  const documentPlural = stats.documentPlural || getLabel(config, 'documentPlural');
  const documents = Array.isArray(stats.documents) ? stats.documents : [];
  const funnel = Array.isArray(stats.funnel) ? stats.funnel : [];
  const documentCount = Number(stats.documentCount) || 0;
  const viewTitle = title || config.moduleName;
  const quickActions = showQuickActions
    ? `
      <div class="quick-actions">
        <button type="button" data-action="quick-manage" data-variant="primary">Gestionar ${escapeHtml(entityPlural.toLowerCase())}</button>
        <button type="button" data-action="navigate" data-view="manage-document" data-variant="secondary">Gestionar ${escapeHtml(documentPlural.toLowerCase())}</button>
        <button type="button" data-action="quick-search" data-variant="secondary">Buscar registros</button>
      </div>`
    : '';

  const lastInteractions = documents
    .slice()
    .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
    .slice(0, 5);
  const hasFunnelRecords = funnel.some((step) => Number(step.count) > 0);
  const funnelHtml = `
    <article class="chart-card chart-card--wide">
      <h3>Embudo comercial por estado</h3>
      <div class="funnel-rows">
        ${funnel
          .map((step) => {
            const state = escapeHtml(step.label);
            const count = Number(step.count) || 0;
            return `
            <div class="funnel-row" title="${escapeHtml(`${step.label}: ${count}`)}">
              <span class="funnel-state">${state}</span>
              <span class="funnel-count">${count}</span>
              <div class="funnel-bar" style="width: ${documentCount > 0 ? (count / documentCount) * 100 : 0}%"></div>
            </div>`;
          })
          .join('')}
      </div>
      ${hasFunnelRecords ? '' : '<p class="empty-state">No hay registros para esta serie.</p>'}
    </article>`;

  return `
    <section class="${escapeHtml(sectionClass)}">
      <h1>${escapeHtml(viewTitle)}</h1>
      ${quickActions}
      ${renderDashboardChartsHtml(chartData || {}, { funnelHtml, funnelOnly })}
      <div class="summary-cards">
        <div class="stat-card"><span class="stat-value">${Number(stats.entityCount) || 0}</span><span class="stat-label">${escapeHtml(entityPlural)}</span></div>
        <div class="stat-card"><span class="stat-value">${documentCount}</span><span class="stat-label">${escapeHtml(documentPlural)}</span></div>
        <div class="stat-card"><span class="stat-value">${Number(stats.wonDocuments) || 0}</span><span class="stat-label">Cerrado ganado</span></div>
        <div class="stat-card"><span class="stat-value">${formatPercent(stats.conversionRate)}</span><span class="stat-label">Tasa de conversión</span></div>
        <div class="stat-card"><span class="stat-value">${formatCurrencyUsd(stats.pipelineTotal)}</span><span class="stat-label">Pipeline (USD)</span></div>
      </div>
      <div class="recent-interactions">
        <h2>Últimas interacciones / próximos seguimientos</h2>
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
