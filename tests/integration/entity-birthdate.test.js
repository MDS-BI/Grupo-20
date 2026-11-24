import { afterEach, describe, it, expect, vi } from 'vitest';
import { initApp } from '../../src/app.js';

const CLIENT_CONFIG = {
  moduleName: 'CRM Comercial',
  labels: {
    entity: 'Cliente',
    entityPlural: 'Clientes',
    document: 'Interacción',
    documentPlural: 'Interacciones',
  },
  entityDate: { label: 'Fecha de nacimiento', min: '1910-01-01', max: 'localToday' },
};

function mount(rawConfig) {
  document.body.innerHTML = '<div id="app"></div>';
  return initApp(document.getElementById('app'), { rawConfig });
}

afterEach(() => {
  vi.useRealTimers();
});

describe('Fecha de nacimiento en el perfil de clientes (US10)', () => {
  it('aplica min/max, muestra la pista y actualiza el máximo sin perder el borrador', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 23, 23, 59, 0));
    const app = mount(CLIENT_CONFIG);
    app.navigate('manage-entity');

    const dateInput = document.querySelector('#field-targetDate');
    expect(dateInput.type).toBe('date');
    expect(dateInput.min).toBe('1910-01-01');
    expect(dateInput.max).toBe('2026-11-23');
    expect(document.querySelector('#hint-targetDate').textContent).toContain('1910-01-01');

    dateInput.value = '1980-01-01';
    document.querySelector('#field-name').value = 'Borrador';

    vi.advanceTimersByTime(60_000);

    expect(document.querySelector('#field-targetDate').max).toBe('2026-11-24');
    expect(document.querySelector('#field-targetDate').value).toBe('1980-01-01');
    expect(document.querySelector('#field-name').value).toBe('Borrador');
    app.destroy();
  });

  it('rechaza una fecha fuera de rango y muestra el error con la etiqueta configurada', () => {
    const app = mount(CLIENT_CONFIG);
    app.navigate('manage-entity');
    document.querySelector('#field-name').value = 'Ana';
    document.querySelector('#field-code').value = 'ANA-1';
    document.querySelector('#field-targetDate').value = '1909-12-31';
    document
      .querySelector('#entity-form')
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    expect(document.querySelector('#error-targetDate').textContent).toContain(
      'Fecha de nacimiento'
    );
    app.destroy();
  });
});
