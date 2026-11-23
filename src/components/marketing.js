import { escapeHtml } from '../utils/sanitize.js';
import { formatPercent } from './dashboard.js';
import { MARKETING_STAGES, MARKETING_STAGE_LABELS } from '../utils/marketing-stages.js';

function renderPie(stats) {
  let offset = 0;
  const segments = stats.categories.map((category) => {
    const share = category.value;
    const segment = share > 0
      ? `<circle r="15.9155" cx="21" cy="21" fill="transparent" stroke="${category.color}" stroke-width="7" stroke-dasharray="${share} ${100 - share}" stroke-dashoffset="${-offset}" />`
      : '';
    offset += share;
    return segment;
  }).join('');
  const description = `Estado comercial de la cartera. ${stats.categories.map((category) => `${category.label}: ${category.count}`).join('. ')}.`;
  return `
    <div class="marketing-chart">
      <h2>Estado comercial de la cartera</h2>
      <svg viewBox="0 0 42 42" role="img" aria-label="${escapeHtml(description)}">
        <circle r="15.9155" cx="21" cy="21" fill="transparent" stroke="#e2e8f0" stroke-width="7" />
        <g transform="rotate(-90 21 21)">${segments}</g>
      </svg>
      <ul class="chart-legend">
        ${stats.categories.map((category) => `
          <li>
            <span class="legend-swatch" style="background:${category.color}" aria-hidden="true"></span>
            <span class="legend-label">${escapeHtml(category.label)}</span>
            <span class="legend-count">${category.count}</span>
          </li>`).join('')}
      </ul>
      ${stats.leadsAnalyzed === 0 ? '<p class="empty-state">Sin resultados definitivos: aún no hay prospectos registrados.</p>' : ''}
    </div>
  `;
}

export function renderMarketingHtml(config, stats, entities = []) {
  const cards = [
    { value: stats.leadsAnalyzed, label: 'Leads analizados' },
    { value: stats.openOpportunities, label: 'Oportunidades abiertas' },
    { value: stats.wonClients, label: 'Clientes ganados' },
    { value: formatPercent(stats.lossRate), label: 'Tasa de pérdida' },
    { value: formatPercent(stats.conversionRate), label: 'Conversión actual' },
  ];
  return `
    <section class="marketing-view">
      <h1>Marketing</h1>
      <div class="summary-cards">
        ${cards.map((card) => `
          <div class="stat-card">
            <span class="stat-value">${card.value}</span>
            <span class="stat-label">${escapeHtml(card.label)}</span>
          </div>`).join('')}
      </div>
      <div class="marketing-funnel">
        <h2>Embudo por etapa</h2>
        <div class="funnel-rows">
          ${stats.funnel.map((step) => `
            <div class="funnel-row">
              <span class="funnel-state">${escapeHtml(step.label)}</span>
              <span class="funnel-count">${step.count}</span>
              <span class="funnel-rate">${formatPercent(step.rate)} · paso ${formatPercent(step.stepRate)}</span>
              <div class="funnel-bar" style="width: ${stats.leadsAnalyzed ? (step.count / stats.leadsAnalyzed) * 100 : 0}%"></div>
            </div>`).join('')}
        </div>
      </div>
      ${renderPie(stats)}
      <div class="marketing-leads">
        <h2>Prospectos</h2>
        ${
          entities.length
            ? `<ul class="pending-list">${entities.map((entity) => `
              <li class="list-item">
                <div class="list-item-main">
                  <span class="list-item-title">${escapeHtml(entity.name)}</span>
                  <select data-role="marketing-stage" data-id="${escapeHtml(entity.id)}" aria-label="Estado comercial de ${escapeHtml(entity.name)}">
                    ${MARKETING_STAGES.map((stage) => `
                      <option value="${stage}" ${entity.estado_comercial === stage ? 'selected' : ''}>${escapeHtml(MARKETING_STAGE_LABELS[stage])}</option>`).join('')}
                  </select>
                </div>
              </li>`).join('')}</ul>`
            : '<p class="empty-state">Aún no hay prospectos. Usa el formulario público de captura para registrar el primero.</p>'
        }
      </div>
    </section>
  `;
}
