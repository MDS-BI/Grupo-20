import { escapeHtml } from '../utils/sanitize.js';
import { getLabel } from '../module-config.js';

export function renderDashboardHtml(config, stats) {
  const entityLabel = getLabel(config, 'entity');
  const documentLabel = getLabel(config, 'document');
  const entityPlural = getLabel(config, 'entityPlural');
  const documentPlural = getLabel(config, 'documentPlural');

  return `
    <section class="dashboard">
      <h1>${escapeHtml(config.moduleName)}</h1>
      <div class="quick-actions">
        <button type="button" data-action="quick-new-entity">Nueva ${escapeHtml(entityLabel.toLowerCase())}</button>
        <button type="button" data-action="quick-new-document">Nueva ${escapeHtml(documentLabel.toLowerCase())}</button>
        <button type="button" data-action="quick-manage">Abrir gestión de ${escapeHtml(entityPlural.toLowerCase())}</button>
        <button type="button" data-action="quick-search">Buscar registros</button>
      </div>
      <div class="summary-cards">
        <div class="stat-card"><span class="stat-value">${stats.entityCount}</span><span class="stat-label">${escapeHtml(entityPlural)}</span></div>
        <div class="stat-card"><span class="stat-value">${stats.documentCount}</span><span class="stat-label">${escapeHtml(documentPlural)}</span></div>
      </div>
    </section>
  `;
}
