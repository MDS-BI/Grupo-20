import { describe, it, expect, beforeEach } from 'vitest';
import { initApp } from '../../src/app.js';

function mount() {
  document.body.innerHTML = '<div id="app"></div>';
  return initApp(document.getElementById('app'));
}

describe('Panel de inicio con acciones rápidas y estadísticas (H15)', () => {
  beforeEach(() => {
    mount();
  });

  it('aterriza en el panel con al menos cuatro acciones rápidas', () => {
    expect(document.querySelectorAll('.quick-actions button').length).toBeGreaterThanOrEqual(4);
  });

  it('ofrece acceso rápido a Marketing desde el panel', () => {
    const quickActions = document.querySelectorAll('.quick-actions button');
    expect(quickActions.length).toBeGreaterThanOrEqual(6);
    const marketingAction = document.querySelector('[data-action="navigate"][data-view="marketing"]');
    expect(marketingAction.textContent).toContain('Marketing');
    marketingAction.click();
    expect(document.querySelector('.marketing-view')).toBeTruthy();
  });

  it('la acción de nueva entidad abre la gestión con un formulario vacío', () => {
    document.querySelector('[data-action="quick-new-entity"]').click();
    expect(document.querySelector('.manage-view')).toBeTruthy();
    expect(document.getElementById('field-name').value).toBe('');
  });

  it('la acción de buscar registros enfoca el campo de búsqueda', () => {
    document.querySelector('[data-action="quick-search"]').click();
    expect(document.activeElement.id).toBe('search-input');
  });

  it('las estadísticas muestran los valores de referencia sin registros y se actualizan con registros reales', () => {
    const values = Array.from(document.querySelectorAll('.summary-cards .stat-value')).map((el) => el.textContent);
    expect(values).toEqual(['421', '35', '25', '64%', '$1,500']);
    expect(document.querySelector('.demo-note')).toBeTruthy();

    document.querySelector('[data-action="quick-new-entity"]').click();
    document.getElementById('field-name').value = 'Acme';
    document.getElementById('field-targetDate').value = '1980-05-05';
    document.getElementById('field-rut').value = '11.111.111-1';
    document.getElementById('field-canal_contacto').value = 'llamada';
    document.getElementById('field-canal_contacto').dispatchEvent(new Event('change', { bubbles: true }));
    document.getElementById('field-contacto_telefono').value = '+56912345678';
    document.getElementById('entity-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    document.querySelector('[data-action="navigate"][data-view="dashboard"]').click();
    const updated = Array.from(document.querySelectorAll('.summary-cards .stat-value')).map((el) => el.textContent);
    expect(updated).toEqual(['1', '0', '0', '0%', '$0']);
    expect(document.querySelector('.demo-note')).toBeNull();
  });
});
