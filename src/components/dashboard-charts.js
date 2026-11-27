import { escapeHtml } from '../utils/sanitize.js';
import { kpis, ventasPorMes, ticketsPorEstado, leadsPorCampana } from '../mockData.js';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});
const numberFormatter = new Intl.NumberFormat('es-CL');

function formatCurrency(value) {
  return currencyFormatter.format(Number(value) || 0);
}

function formatNumber(value) {
  return numberFormatter.format(Number(value) || 0);
}

function formatPercent(value) {
  return `${Number((Number(value) || 0).toFixed(1))}%`;
}

export function renderDashboardChartsHtml() {
  const salesSummary = ventasPorMes
    .map((row) => `${row.mes}: ${formatCurrency(row.ingresos)}, ${row.negocios} negocios`)
    .join('; ');
  const ticketsSummary = ticketsPorEstado.map((row) => `${row.estado}: ${row.total}`).join('; ');
  const leadsSummary = leadsPorCampana
    .map((row) => `${row.campana}: ${row.leads} leads`)
    .join('; ');

  return `
    <section class="dashboard-analytics" aria-labelledby="dashboard-analytics-title">
      <div class="analytics-heading">
        <h2 id="dashboard-analytics-title">Panel visual</h2>
        <p class="analytics-note">Datos de demostración cargados desde mockData.js.</p>
      </div>
      <div class="kpi-grid">
        <article class="kpi-card">
          <span class="kpi-label">Ingresos totales del mes</span>
          <strong class="kpi-value">${escapeHtml(formatCurrency(kpis.ingresosMes))}</strong>
        </article>
        <article class="kpi-card">
          <span class="kpi-label">Clientes activos</span>
          <strong class="kpi-value">${escapeHtml(formatNumber(kpis.clientesActivos))}</strong>
        </article>
        <article class="kpi-card">
          <span class="kpi-label">Campañas activas</span>
          <strong class="kpi-value">${escapeHtml(formatNumber(kpis.campanasActivas))}</strong>
          <span class="kpi-detail">Conversión promedio: ${escapeHtml(formatPercent(kpis.conversionPromedio))}</span>
        </article>
        <article class="kpi-card">
          <span class="kpi-label">Tickets abiertos</span>
          <strong class="kpi-value">${escapeHtml(formatNumber(kpis.ticketsAbiertos))}</strong>
        </article>
      </div>
      <div class="chart-grid">
        <article class="chart-card chart-card--wide">
          <h3>Ventas por mes</h3>
          <div class="chart-canvas">
            <canvas id="dashboard-chart-sales" data-chart="sales" role="img" aria-label="${escapeHtml(`Evolución de ingresos y negocios cerrados en los últimos 6 meses. ${salesSummary}`)}"></canvas>
          </div>
        </article>
        <article class="chart-card">
          <h3>Tickets de soporte</h3>
          <div class="chart-canvas">
            <canvas id="dashboard-chart-tickets" data-chart="tickets" role="img" aria-label="${escapeHtml(`Distribución de tickets por estado. ${ticketsSummary}`)}"></canvas>
          </div>
        </article>
        <article class="chart-card">
          <h3>Leads generados por campaña</h3>
          <div class="chart-canvas">
            <canvas id="dashboard-chart-leads" data-chart="leads" role="img" aria-label="${escapeHtml(`Leads generados por cada campaña. ${leadsSummary}`)}"></canvas>
          </div>
        </article>
      </div>
    </section>
  `;
}
