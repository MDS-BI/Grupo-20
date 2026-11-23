import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { MODULE_CONFIG, setActiveConfig } from '../../src/module-config.js';
import { formatCurrencyUsd, formatPercent } from '../../src/components/dashboard.js';
import { addEntity, addDocument, deleteEntity } from '../../src/storage.js';

let dom;

beforeEach(() => {
  dom = new JSDOM('<!doctype html><html><body><div id="app"></div></body></html>', {
    url: 'http://localhost/',
  });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.localStorage = dom.window.localStorage;
  globalThis.confirm = vi.fn(() => true);
  setActiveConfig(MODULE_CONFIG);
});

afterEach(() => dom.window.close());

function cards() {
  return [...document.querySelectorAll('.summary-cards .stat-card')].map((card) => ({
    value: card.querySelector('.stat-value').textContent,
    label: card.querySelector('.stat-label').textContent,
  }));
}

describe('formato de indicadores del panel', () => {
  it('formatea moneda USD y porcentajes de forma limpia', () => {
    expect(formatCurrencyUsd(1500)).toBe('$1,500');
    expect(formatCurrencyUsd(1234.5)).toBe('$1,234.50');
    expect(formatCurrencyUsd(0)).toBe('$0');
    expect(formatPercent(64)).toBe('64%');
    expect(formatPercent(5.94)).toBe('5.9%');
    expect(formatPercent(0)).toBe('0%');
  });
});

describe('panel de CRM Comercial', () => {
  it('muestra los valores de referencia cuando no hay registros', async () => {
    const { boot } = await import('../../src/app.js');
    const app = boot(document.getElementById('app'));

    expect(cards()).toEqual([
      { value: '421', label: 'Clientes' },
      { value: '35', label: 'Interacciones' },
      { value: '25', label: 'Cerrado ganado' },
      { value: '64%', label: 'Tasa de conversión' },
      { value: '$1,500', label: 'Pipeline (USD)' },
    ]);
    expect(document.querySelector('.demo-note')).toBeTruthy();
    expect(document.querySelector('.commercial-funnel').textContent).toContain('25');

    app.setDemoMode(false);
    expect(cards()[0].value).toBe('0');
    expect(document.querySelector('.demo-note')).toBeNull();
  });

  it('recalcula los indicadores al crear y eliminar registros reales', async () => {
    const { boot } = await import('../../src/app.js');
    const app = boot(document.getElementById('app'));

    const client = addEntity({
      name: 'Acme',
      code: 'AC-1',
      targetDate: '1980-05-05',
      rut: '11.111.111-1',
      canal_contacto: 'llamada',
      contacto_telefono: '+56912345678',
    });
    addDocument({ entity_id: client.entity_id, status: 'cerrado ganado', startDate: '2026-10-01' });
    addDocument({ entity_id: client.entity_id, status: 'en negociacion', startDate: '2026-10-02', importe: 250 });
    app.navigate('dashboard');

    expect(cards()).toEqual([
      { value: '1', label: 'Clientes' },
      { value: '2', label: 'Interacciones' },
      { value: '1', label: 'Cerrado ganado' },
      { value: '100%', label: 'Tasa de conversión' },
      { value: '$250', label: 'Pipeline (USD)' },
    ]);
    expect(document.querySelector('.demo-note')).toBeNull();

    deleteEntity(client.id);
    app.navigate('dashboard');
    expect(cards()[0]).toEqual({ value: '421', label: 'Clientes' });
    expect(document.querySelector('.demo-note')).toBeTruthy();
  });
});
