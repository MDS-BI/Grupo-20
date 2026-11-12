import { describe, it, expect, beforeEach } from 'vitest';
import { initApp } from '../../src/app.js';

function mount(rawConfig) {
  document.body.innerHTML = '<div id="app"></div>';
  return initApp(document.getElementById('app'), { rawConfig });
}

describe('Marco de espacio de trabajo ERP con marca (H14)', () => {
  beforeEach(() => {
    mount();
  });

  it('muestra una barra superior con logotipo y nombre en cada pantalla', () => {
    for (const view of ['dashboard', 'manage-entity', 'search', 'summary']) {
      document.querySelector(`[data-action="navigate"][data-view="${view}"]`).click();
      expect(document.querySelector('.topbar .module-logo')).toBeTruthy();
      expect(document.querySelector('.topbar .module-name').textContent).toBe('Módulo Base ERP');
    }
  });

  it('resalta visualmente el botón del módulo activo', () => {
    document.querySelector('[data-action="navigate"][data-view="search"]').click();
    const active = document.querySelector('.sidebar-button.active');
    expect(active.dataset.view).toBe('search');
    expect(active.getAttribute('aria-current')).toBe('page');
  });

  it('conserva las entidades y documentos almacenados al navegar entre módulos', () => {
    document.querySelector('[data-action="navigate"][data-view="manage-entity"]').click();
    document.getElementById('field-name').value = 'Acme';
    document.getElementById('field-code').value = 'AC-1';
    document.getElementById('entity-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    document.querySelector('[data-action="navigate"][data-view="dashboard"]').click();
    document.querySelector('[data-action="navigate"][data-view="search"]').click();
    expect(document.querySelectorAll('#search-results .list-item')).toHaveLength(1);
  });

  it('aplica el color de acento configurado como propiedad CSS', () => {
    mount({ theme: { accentColor: '#112233' } });
    expect(document.getElementById('app').style.getPropertyValue('--accent-color')).toBe('#112233');
  });
});
