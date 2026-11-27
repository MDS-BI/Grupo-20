import Chart from 'chart.js/auto';
import { ventasPorMes, ticketsPorEstado, leadsPorCampana } from '../mockData.js';

const SERIES_COLORS = ['#1d4ed8', '#16a34a', '#f59e0b', '#8b5cf6', '#ec4899', '#0ea5e9'];

let charts = [];

function cssColor(name, fallback) {
  if (typeof getComputedStyle !== 'function' || typeof document === 'undefined') return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

function readColors() {
  return {
    text: cssColor('--text', '#1f2430'),
    grid: cssColor('--border', '#d8dce3'),
    accent: cssColor('--accent-color', '#1d4ed8'),
  };
}

function baseOptions(colors) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' },
    plugins: {
      legend: { labels: { color: colors.text, usePointStyle: true } },
      tooltip: { enabled: true },
    },
    scales: {
      x: { ticks: { color: colors.text }, grid: { color: colors.grid } },
      y: { ticks: { color: colors.text }, grid: { color: colors.grid } },
    },
  };
}

function salesConfig(colors) {
  const options = baseOptions(colors);
  return {
    type: 'bar',
    data: {
      labels: ventasPorMes.map((row) => row.mes),
      datasets: [
        {
          type: 'bar',
          label: 'Ingresos (USD)',
          data: ventasPorMes.map((row) => row.ingresos),
          backgroundColor: colors.accent,
          borderRadius: 6,
          yAxisID: 'y',
        },
        {
          type: 'line',
          label: 'Negocios cerrados',
          data: ventasPorMes.map((row) => row.negocios),
          borderColor: SERIES_COLORS[1],
          backgroundColor: SERIES_COLORS[1],
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
            color: colors.text,
            callback: (value) => `$${Number(value) / 1000}k`,
          },
        },
        y1: {
          position: 'right',
          ticks: { color: colors.text },
          grid: { display: false },
        },
      },
    },
  };
}

function ticketsConfig(colors) {
  return {
    type: 'doughnut',
    data: {
      labels: ticketsPorEstado.map((row) => row.estado),
      datasets: [
        {
          data: ticketsPorEstado.map((row) => row.total),
          backgroundColor: SERIES_COLORS.slice(0, ticketsPorEstado.length),
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: { labels: { color: colors.text, usePointStyle: true } },
        tooltip: { enabled: true },
      },
    },
  };
}

function leadsConfig(colors) {
  const options = baseOptions(colors);
  return {
    type: 'bar',
    data: {
      labels: leadsPorCampana.map((row) => row.campana),
      datasets: [
        {
          label: 'Leads generados',
          data: leadsPorCampana.map((row) => row.leads),
          backgroundColor: SERIES_COLORS[0],
          borderRadius: 6,
        },
      ],
    },
    options: {
      ...options,
      indexAxis: 'y',
      plugins: { ...options.plugins, legend: { display: false } },
    },
  };
}

function configFor(type, colors) {
  if (type === 'sales') return salesConfig(colors);
  if (type === 'tickets') return ticketsConfig(colors);
  if (type === 'leads') return leadsConfig(colors);
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

export function mountDashboardCharts(root = document) {
  destroyDashboardCharts();
  const canvases = root?.querySelectorAll?.('canvas[data-chart]') || [];
  if (!canvases.length || typeof CanvasRenderingContext2D === 'undefined') return;
  const colors = readColors();
  for (const canvas of canvases) {
    try {
      const context = canvas.getContext('2d');
      if (!context) continue;
      const config = configFor(canvas.dataset.chart, colors);
      if (config) charts.push(new Chart(context, config));
    } catch {}
  }
}
