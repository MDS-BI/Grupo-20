import { escapeHtml } from '../utils/sanitize.js';
import { normalizeText } from '../utils/search.js';
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

export function renderDashboardHtml(config, stats) {
  const entityLabel = getLabel(config, 'entity');
  const documentLabel = getLabel(config, 'document');
  const entityPlural = getLabel(config, 'entityPlural');
  const documentPlural = getLabel(config, 'documentPlural');

  const totalEntities = stats.entityCount || 0;
  const totalDocuments = stats.documentCount || 0;
  const allDocuments = stats.documents || [];
  const totalInteractions = allDocuments.length || totalDocuments;

  const lifecycle = config.statusLifecycle;
  const funnelData = {
    prospecto: 0,
    contactado: 0,
    'en negociacion': 0,
    'cerrado ganado': 0,
    'cerrado perdido': 0,
    pendiente: 0,
  };

  if (lifecycle && Array.isArray(lifecycle.states)) {
    for (const state of lifecycle.states) {
      funnelData[state] = 0;
    }
    for (const doc of allDocuments) {
      const status = doc.status || '';
      if (funnelData[status] !== undefined) {
        funnelData[status] += 1;
      } else {
        const normalized = normalizeText(status);
        if (funnelData[normalized] !== undefined) funnelData[normalized] += 1;
      }
    }
  } else {
    for (const doc of allDocuments) {
      if (normalizeText(doc.status || '') === 'pendiente') funnelData.pendiente += 1;
    }
  }

  const activeStates = ['prospecto', 'contactado', 'en negociacion'];
  let pipelineTotal = 0;
  for (const doc of allDocuments) {
    const status = (doc.status || '').trim().toLowerCase();
    if (activeStates.includes(status)) pipelineTotal += Number(doc.importe) || 0;
  }

  const cerradoGanado = funnelData['cerrado ganado'] || 0;
  const conversionRate =
    stats.conversionRate !== undefined && stats.conversionRate !== null
      ? stats.conversionRate
      : totalEntities > 0
        ? (cerradoGanado / totalEntities) * 100
        : 0;

  const lastInteractions = allDocuments
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return `
    <section class="dashboard">
      <h1>${escapeHtml(config.moduleName)}</h1>
      <div class="quick-actions">
        <button type="button" data-action="quick-new-entity">Nuevo ${escapeHtml(entityLabel)}</button>
        <button type="button" data-action="quick-new-document">Nueva ${escapeHtml(documentLabel.toLowerCase())}</button>
        <button type="button" data-action="quick-manage">Abrir gestión de ${escapeHtml(entityPlural.toLowerCase())}</button>
        <button type="button" data-action="quick-search">Buscar registros</button>
        <button type="button" data-action="navigate" data-view="marketing">Abrir Marketing</button>
        <button type="button" data-action="navigate" data-view="manage-document">Gestionar ${escapeHtml(documentPlural.toLowerCase())}</button>
      </div>
      ${stats.isDemo ? '<p class="demo-note">Valores de referencia de demostración. Se actualizan automáticamente cuando registres clientes o interacciones.</p>' : ''}
      <div class="summary-cards">
        <div class="stat-card"><span class="stat-value">${totalEntities}</span><span class="stat-label">${escapeHtml(entityPlural)}</span></div>
        <div class="stat-card"><span class="stat-value">${totalInteractions}</span><span class="stat-label">${escapeHtml(documentPlural)}</span></div>
        <div class="stat-card"><span class="stat-value">${cerradoGanado}</span><span class="stat-label">Cerrado ganado</span></div>
        <div class="stat-card"><span class="stat-value">${formatPercent(conversionRate)}</span><span class="stat-label">Tasa de conversión</span></div>
        <div class="stat-card"><span class="stat-value">${formatCurrencyUsd(pipelineTotal)}</span><span class="stat-label">Pipeline (USD)</span></div>
      </div>
      <div class="commercial-funnel">
        <h2>Embudo Comercial por Estado</h2>
        <div class="funnel-rows">
          ${Object.entries(funnelData)
            .map(
              ([estado, count]) => `
            <div class="funnel-row">
              <span class="funnel-state">${escapeHtml(estado)}</span>
              <span class="funnel-count">${count}</span>
              <div class="funnel-bar" style="width: ${totalInteractions > 0 ? (count / totalInteractions) * 100 : 0}%"></div>
            </div>`,
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
              </li>`,
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
