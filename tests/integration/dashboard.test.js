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

  it('la acción de nueva entidad abre la gestión con un formulario vacío', () => {
    document.querySelector('[data-action="quick-new-entity"]').click();
    expect(document.querySelector('.manage-view')).toBeTruthy();
    expect(document.getElementById('field-name').value).toBe('');
  });

  it('la acción de buscar registros enfoca el campo de búsqueda', () => {
    document.querySelector('[data-action="quick-search"]').click();
    expect(document.activeElement.id).toBe('search-input');
  });

  it('las estadísticas reflejan el número actual de registros y cero cuando no hay ninguno', () => {
    const values = Array.from(document.querySelectorAll('.summary-cards .stat-value')).map((el) => el.textContent);
    expect(values).toEqual(['0', '0']);

    document.querySelector('[data-action="quick-new-entity"]').click();
    document.getElementById('field-name').value = 'Acme';
    document.getElementById('field-code').value = 'AC-1';
    document.getElementById('entity-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    document.querySelector('[data-action="navigate"][data-view="dashboard"]').click();
    const updated = Array.from(document.querySelectorAll('.summary-cards .stat-value')).map((el) => el.textContent);
    expect(updated).toEqual(['1', '0']);
  });
});
