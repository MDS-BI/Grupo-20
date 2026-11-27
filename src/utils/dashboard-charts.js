import Chart from 'chart.js/auto';

const SERIES_COLORS = ['#1d4ed8', '#16a34a', '#f59e0b', '#8b5cf6', '#ec4899', '#0ea5e9'];

let charts = [];

function cssColor(name, fallback) {
  if (typeof getComputedStyle !== 'function' || typeof document === 'undefined') return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

function readColors() {
  return {
    text: cssColor('--text', '#1f2430'),
    textMuted: cssColor('--text-muted', '#64748b'),
    surface: cssColor('--surface', '#ffffff'),
    grid: cssColor('--border', '#d8dce3'),
    accent: cssColor('--accent-color', '#1d4ed8'),
    palette: SERIES_COLORS,
  };
}

function baseOptions(colors) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' },
    plugins: {
      legend: { labels: { color: colors.text, usePointStyle: true } },
      tooltip: {
        enabled: true,
        backgroundColor: colors.surface,
        titleColor: colors.text,
        bodyColor: colors.textMuted,
        borderColor: colors.grid,
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        ticks: { color: colors.textMuted },
        grid: { color: colors.grid },
        border: { color: colors.grid },
      },
      y: {
        ticks: { color: colors.textMuted },
        grid: { color: colors.grid },
        border: { color: colors.grid },
      },
    },
  };
}

function salesConfig(colors, data) {
  const rows = Array.isArray(data.salesByMonth) ? data.salesByMonth : [];
  const options = baseOptions(colors);
  return {
    type: 'bar',
    data: {
      labels: rows.map((row) => row.mes),
      datasets: [
        {
          type: 'bar',
          label: 'Ingresos (USD)',
          data: rows.map((row) => row.ingresos),
          backgroundColor: colors.accent,
          borderColor: colors.accent,
          borderRadius: 6,
          yAxisID: 'y',
        },
        {
          type: 'line',
          label: 'Negocios cerrados',
          data: rows.map((row) => row.negocios),
          borderColor: colors.palette[1],
          backgroundColor: colors.palette[1],
          pointRadius: 4,
          tension: 0.3,
          yAxisID: 'y1',
        },
      ],
    },
    options: {
      ...options,
      scales: {
        x: options.scales.x,
        y: {
          ...options.scales.y,
          ticks: {
            ...options.scales.y.ticks,
            callback: (value) => `$${Number(value) / 1000}k`,
          },
        },
        y1: {
          ticks: { color: colors.textMuted },
          grid: { color: colors.grid },
          border: { color: colors.grid },
          position: 'right',
        },
      },
    },
  };
}

function ticketsConfig(colors, data) {
  const rows = Array.isArray(data.ticketsByStatus) ? data.ticketsByStatus : [];
  const options = baseOptions(colors);
  return {
    type: 'doughnut',
    data: {
      labels: rows.map((row) => row.estado),
      datasets: [
        {
          data: rows.map((row) => row.total),
          backgroundColor: colors.palette.slice(0, rows.length),
          borderColor: colors.surface,
        },
      ],
    },
    options: {
      responsive: options.responsive,
      maintainAspectRatio: options.maintainAspectRatio,
      cutout: '65%',
      plugins: options.plugins,
    },
  };
}

function leadsConfig(colors, data) {
  const rows = Array.isArray(data.leadsByCampaign) ? data.leadsByCampaign : [];
  const options = baseOptions(colors);
  return {
    type: 'bar',
    data: {
      labels: rows.map((row) => row.campana),
      datasets: [
        {
          label: 'Leads generados',
          data: rows.map((row) => row.leads),
          backgroundColor: colors.accent,
          borderColor: colors.accent,
          borderRadius: 6,
        },
      ],
    },
    options: {
      ...options,
      indexAxis: 'y',
      plugins: {
        ...options.plugins,
        legend: { display: false, labels: { color: colors.text, usePointStyle: true } },
      },
    },
  };
}

function configFor(type, colors, data = {}) {
  if (type === 'sales') return salesConfig(colors, data);
  if (type === 'tickets') return ticketsConfig(colors, data);
  if (type === 'leads') return leadsConfig(colors, data);
  return null;
}

export function destroyDashboardCharts() {
  while (charts.length) {
    const chart = charts.pop();
    try {
      chart.destroy();
    } catch {}
  }
}

export function mountDashboardCharts(root = document, data = {}) {
  destroyDashboardCharts();
  const canvases = root?.querySelectorAll?.('canvas[data-chart]') || [];
  if (!canvases.length || typeof CanvasRenderingContext2D === 'undefined') return;
  const colors = readColors();
  for (const canvas of canvases) {
    try {
      const context = canvas.getContext('2d');
      if (!context) continue;
      const config = configFor(canvas.dataset.chart, colors, data);
      if (!config) continue;
      const chart = new Chart(context, config);
      chart.$erpDashboardChartType = canvas.dataset.chart;
      chart.$erpDashboardChartData = data;
      charts.push(chart);
    } catch {}
  }
}

export function refreshDashboardChartTheme() {
  const colors = readColors();
  for (const chart of charts) {
    const config = configFor(chart.$erpDashboardChartType, colors, chart.$erpDashboardChartData);
    if (!config) continue;
    if (chart.data && config.data) {
      chart.data.labels = config.data.labels;
      chart.data.datasets?.forEach((dataset, index) => {
        const fresh = config.data.datasets[index];
        if (!fresh) return;
        dataset.label = fresh.label;
        dataset.data = fresh.data;
        dataset.backgroundColor = fresh.backgroundColor;
        dataset.borderColor = fresh.borderColor;
      });
    }
    if (chart.options) {
      chart.options.plugins = config.options.plugins;
      chart.options.scales = config.options.scales || chart.options.scales;
      chart.options.indexAxis = config.options.indexAxis;
    }
    chart.update?.('none');
  }
}
