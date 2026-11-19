import { describe, it, expect, beforeEach } from 'vitest';
import { initApp } from '../../src/app.js';

function mount() {
  document.body.innerHTML = '<div id="app"></div>';
  return initApp(document.getElementById('app'));
}

describe('Pantalla de búsqueda dedicada (H12)', () => {
  beforeEach(() => {
    mount();
  });

  it('se accede desde la barra lateral y desde la acción rápida del panel', () => {
    document.querySelector('[data-action="navigate"][data-view="search"]').click();
    expect(document.querySelector('.search-view')).toBeTruthy();

    document.querySelector('[data-action="navigate"][data-view="dashboard"]').click();
    document.querySelector('[data-action="quick-search"]').click();
    expect(document.querySelector('.search-view')).toBeTruthy();
    expect(document.activeElement.id).toBe('search-input');
  });

  it('vuelve al panel de inicio al activar el botón Panel en la barra lateral', () => {
    document.querySelector('[data-action="navigate"][data-view="search"]').click();
    document.querySelector('[data-action="navigate"][data-view="dashboard"]').click();
    expect(document.querySelector('.dashboard')).toBeTruthy();
  });
});
