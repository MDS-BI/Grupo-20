import { escapeHtml } from '../utils/sanitize.js';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});
const numberFormatter = new Intl.NumberFormat('es-CL');

const EMPTY_SERIES_HTML = '<p class="empty-state">No hay registros para esta serie.</p>';

function formatCurrency(value) {
  return currencyFormatter.format(Number(value) || 0);
}

function formatNumber(value) {
  return numberFormatter.format(Number(value) || 0);
}

function canvasHtml(type, label, summary) {
  return `
    <div class="chart-canvas">
      <canvas id="dashboard-chart-${type}" data-chart="${type}" role="img" aria-label="${escapeHtml(`${label} ${summary}`)}"></canvas>
    </div>`;
}

function salesCard(rows = []) {
  const summary = rows
    .map((row) => `${row.mes}: ${formatCurrency(row.ingresos)}, ${row.negocios} negocios`)
    .join('; ');
  return `
    <article class="chart-card chart-card--wide">
      <h3>Ventas por mes</h3>
      ${
        rows.length
          ? canvasHtml(
              'sales',
              'Evolución de ingresos y negocios cerrados en los últimos 6 meses.',
              summary
            )
          : EMPTY_SERIES_HTML
      }
    </article>`;
}

function ticketsCard(rows = []) {
  const summary = rows.map((row) => `${row.estado}: ${formatNumber(row.total)}`).join('; ');
  return `
    <article class="chart-card">
      <h3>Tickets de soporte</h3>
      ${
        rows.length
          ? canvasHtml('tickets', 'Distribución de tickets por estado.', summary)
          : EMPTY_SERIES_HTML
      }
    </article>`;
}

function leadsCard(rows = []) {
  const summary = rows.map((row) => `${row.campana}: ${row.leads} leads`).join('; ');
  return `
    <article class="chart-card">
      <h3>Leads generados por campaña</h3>
      ${
        rows.length
          ? canvasHtml('leads', 'Leads generados por cada campaña.', summary)
          : EMPTY_SERIES_HTML
      }
    </article>`;
}

export function renderDashboardChartsHtml(
  chartData = {},
  { funnelHtml = '', funnelOnly = false } = {}
) {
  const series = funnelOnly
    ? ''
    : `${salesCard(chartData.salesByMonth)}${ticketsCard(chartData.ticketsByStatus)}${leadsCard(chartData.leadsByCampaign)}`;

  return `
    <section class="dashboard-analytics" aria-labelledby="dashboard-analytics-title">
      <div class="analytics-heading">
        <h2 id="dashboard-analytics-title">Panel visual</h2>
        <p class="analytics-note">Series derivadas de registros almacenados.</p>
      </div>
      <div class="chart-grid">
        ${series}
        ${funnelHtml}
      </div>
    </section>
  `;
}
