import { describe, it, expect, beforeEach } from 'vitest';
import { initApp } from '../../src/app.js';
import { MODULE_CONFIG } from '../../src/module-config.js';
import { addEntity, loadEntities, loadDocuments } from '../../src/storage.js';
import { formatRut } from '../../src/seed.js';

function seed(stage, suffix) {
  addEntity({
    name: `Prospecto ${suffix}`,
    code: `MKT-${suffix}`,
    targetDate: '1980-05-05',
    rut: formatRut(`111111${suffix}`),
    canal_contacto: 'correo',
    contacto_correo: `p${suffix}@ejemplo.cl`,
    estado_comercial: stage,
  });
}

function values() {
  return Array.from(document.querySelectorAll('.marketing-view .summary-cards .stat-value')).map((el) => el.textContent);
}

describe('Resumen del apartado de Marketing (T092)', () => {
  let app;

  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
    app = initApp(document.getElementById('app'), { rawConfig: MODULE_CONFIG });
    seed('prospecto', '1');
    seed('en_proceso', '2');
    seed('en_recontacto', '3');
    seed('ganado', '4');
    seed('perdido', '5');
    app.navigate('marketing');
  });

  it('muestra los cinco contadores con la misma presentación de tarjetas', () => {
    const labels = Array.from(document.querySelectorAll('.marketing-view .summary-cards .stat-label')).map((el) => el.textContent);
    expect(labels).toEqual([
      'Leads analizados',
      'Oportunidades abiertas',
      'Clientes ganados',
      'Tasa de pérdida',
      'Conversión actual',
    ]);
    expect(values()[0]).toBe('5');
    expect(values()[1]).toBe('2');
    expect(values()[2]).toBe('1');
    expect(values()[3]).toBe('20%');
    expect(values()[4]).toBe('20%');
  });

  it('muestra el embudo por etapas y la torta con cinco categorías', () => {
    expect(document.querySelectorAll('.marketing-funnel .funnel-row')).toHaveLength(5);
    expect(document.querySelectorAll('.chart-legend li')).toHaveLength(5);
    const chart = document.querySelector('.marketing-chart svg');
    expect(chart.getAttribute('role')).toBe('img');
    expect(chart.getAttribute('aria-label')).toContain('Clientes ganados: 1');
    expect(chart.getAttribute('aria-label')).toContain('Sin resultados definitivos: 1');
  });

  it('actualiza contadores y gráfico al cambiar la etapa de un prospecto', () => {
    const select = document.querySelector('[data-role="marketing-stage"]');
    select.value = 'ganado';
    select.dispatchEvent(new Event('change', { bubbles: true }));

    expect(values()[1]).toBe('2');
    expect(values()[2]).toBe('2');
    expect(values()[4]).toBe('40%');
    expect(document.querySelectorAll('.marketing-funnel .funnel-row')[0].querySelector('.funnel-count').textContent).toBe('0');
    expect(document.querySelector('.marketing-chart svg').getAttribute('aria-label')).toContain('Clientes ganados: 2');
    expect(loadEntities().some((e) => e.estado_comercial === 'ganado')).toBe(true);
  });

  it('registra en el historial las ejecuciones automáticas de captura y cambio de etapa', () => {
    const first = loadEntities().find((e) => e.estado_comercial === 'prospecto');
    const history = () => loadDocuments().filter((d) => d.entity_id === first.entity_id);
    expect(history().some((d) => d.notes === 'Registro de bienvenida' && d.status === 'automatico')).toBe(true);

    const select = document.querySelector(`[data-role="marketing-stage"][data-id="${first.id}"]`);
    select.value = 'en_proceso';
    select.dispatchEvent(new Event('change', { bubbles: true }));

    expect(history().some((d) => d.notes === 'Prospecto en seguimiento' && d.status === 'automatico')).toBe(true);
    expect(history().filter((d) => d.notes === 'Registro de bienvenida')).toHaveLength(1);
  });
});
