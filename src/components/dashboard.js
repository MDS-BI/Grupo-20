import { escapeHtml } from '../utils/sanitize.js';
import { normalizeText } from '../utils/search.js';
import { getLabel } from '../module-config.js';

export function renderDashboardHtml(config, stats) {
  const entityLabel = getLabel(config, 'entity');
  const documentLabel = getLabel(config, 'document');
  const entityPlural = getLabel(config, 'entityPlural');
  const documentPlural = getLabel(config, 'documentPlural');

  const totalEntities = stats.entityCount || 0;
  const totalDocuments = stats.documentCount || 0;

  // Calculate CRM metrics from documents
  const allDocuments = stats.documents || [];
  const totalInteractions = allDocuments.length;

  // Count by status lifecycle
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
    // Count documents by status
    for (const doc of allDocuments) {
      const status = doc.status || '';
      if (funnelData[status] !== undefined) {
        funnelData[status]++;
      } else {
        // Fallback: normalize status text
        const normalized = (status || '').trim().toLowerCase().replace(/\s+/g, '');
        if (funnelData[normalized] !== undefined) {
          funnelData[normalized]++;
        }
      }
    }
  } else {
    // Sin ciclo de vida: contar "pendiente" por normalización de texto
    const pendingStatus = 'pendiente';
    for (const doc of allDocuments) {
      const normalized = normalizeText(doc.status || '');
      if (normalized === pendingStatus) {
        funnelData.pendiente++;
      }
    }
  }

  // Calculate pipeline value (sum of active interactions)
  let pipelineTotal = 0;
  const activeStates = ['prospecto', 'contactado', 'en negociacion'];
  for (const doc of allDocuments) {
    const status = (doc.status || '').trim().toLowerCase();
    if (activeStates.includes(status)) {
      // Try to get importe from custom fields
      const importe = doc.importe || 0;
      pipelineTotal += Number(importe) || 0;
    }
  }

  // Calculate closed won
  let cerradoGanado = funnelData['cerrado ganado'] || 0;
  let conversionRate = totalEntities > 0 ? ((cerradoGanado / totalEntities) * 100).toFixed(1) : '0.0';

  // Ultimas interacciones (últimas 5)
    const lastInteractions = allDocuments
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return `
    <section class="dashboard">
      <h1>${escapeHtml(config.moduleName)}</h1>
      <div class="quick-actions">
        <button type="button" data-action="quick-new-entity">Nuevo ${escapeHtml(entityLabel.toLowerCase())}</button>
        <button type="button" data-action="quick-new-document">Nueva ${escapeHtml(documentLabel.toLowerCase())}</button>
        <button type="button" data-action="quick-manage">Abrir gestión de ${escapeHtml(entityPlural.toLowerCase())}</button>
        <button type="button" data-action="quick-search">Buscar registros</button>
      </div>
      <div class="summary-cards">
        <div class="stat-card"><span class="stat-value">${totalEntities}</span><span class="stat-label">${escapeHtml(entityPlural)}</span></div>
        <div class="stat-card"><span class="stat-value">${totalInteractions}</span><span class="stat-label">${escapeHtml(documentPlural)}</span></div>
        <div class="stat-card"><span class="stat-value">${cerradoGanado}</span><span class="stat-label">Cerrado Ganado</span></div>
        <div class="stat-card"><span class="stat-value">${conversionRate}%</span><span class="stat-label">Tasa Conversión</span></div>
        <div class="stat-card"><span class="stat-value">$${pipelineTotal.toFixed(2)}</span><span class="stat-label">Pipeline ($)</span></div>
      </div>
      <div class="commercial-funnel">
        <h2>Embudo Comercial por Estado</h2>
        <div class="funnel-rows">
          ${Object.entries(funnelData).map(([estado, count]) => `
            <div class="funnel-row">
              <span class="funnel-state">${escapeHtml(estado)}</span>
              <span class="funnel-count">${count}</span>
              <div class="funnel-bar" style="width: ${totalInteractions > 0 ? (count / totalInteractions * 100) : 0}%"></div>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="recent-interactions">
        <h2>Últimas Interacciones / Próximos Seguimientos</h2>
        ${lastInteractions.length > 0 ? `
          <ul class="pending-list">
            ${lastInteractions.map((doc) => `
              <li class="list-item history-item">
                <div class="list-item-main">
                  <span class="list-item-title">${escapeHtml(doc.notes || 'Sin notas')}</span>
                  <span class="status-badge" data-status="${escapeHtml(doc.status)}">${escapeHtml(doc.status || '—')}</span>
                </div>
                <div class="list-item-actions">
                  <button type="button" data-action="view-entity" data-entity-id="${escapeHtml(doc.entity_id)}">Ver ficha</button>
                </div>
              </li>
            `).join('')}
          </ul>
        ` : '<p class="empty-state">No hay interacciones recientes.</p>'}
      </div>
    </section>
  `;
}
