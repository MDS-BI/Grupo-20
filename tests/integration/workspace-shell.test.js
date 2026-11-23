import { describe, it, expect, beforeEach } from 'vitest';
import { initApp } from '../../src/app.js';

let app;

function mount(rawConfig) {
  document.body.innerHTML = '<div id="app"></div>';
  app = initApp(document.getElementById('app'), { rawConfig });
  return app;
}

describe('Marco de espacio de trabajo ERP con marca (H14)', () => {
  beforeEach(() => {
    mount();
  });

  it('muestra una barra superior con logotipo y nombre en cada pantalla', () => {
    for (const view of ['dashboard', 'manage-entity', 'search', 'summary']) {
      app.navigate(view);
      expect(document.querySelector('.topbar .module-logo')).toBeTruthy();
      expect(document.querySelector('.topbar .module-name').textContent).toBe('CRM Comercial');
    }
  });

  it('no ofrece Clientes ni Interacciones en la barra lateral', () => {
    const views = Array.from(document.querySelectorAll('.sidebar-button')).map((button) => button.dataset.view);
    expect(views).toEqual(['dashboard', 'search', 'summary']);
    expect(document.querySelector('#nav-entities')).toBeNull();
    expect(document.querySelector('#nav-documents')).toBeNull();
  });

  it('resalta visualmente el botón del módulo activo', () => {
    document.querySelector('[data-action="navigate"][data-view="search"]').click();
    const active = document.querySelector('.sidebar-button.active');
    expect(active.dataset.view).toBe('search');
    expect(active.getAttribute('aria-current')).toBe('page');
  });

  it('conserva las entidades y documentos almacenados al navegar entre módulos', () => {
    mount({});
    app.navigate('manage-entity');
    document.getElementById('field-name').value = 'Acme';
    document.getElementById('field-code').value = 'AC-1';
    document.getElementById('entity-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    document.querySelector('[data-action="navigate"][data-view="dashboard"]').click();
    document.querySelector('[data-action="navigate"][data-view="search"]').click();
    expect(document.querySelectorAll('#search-results .list-item')).toHaveLength(1);
  });

  it('conserva los enlaces profundos a las vistas de gestión retiradas del menú', () => {
    app.navigate('manage-entity');
    expect(document.querySelector('.manage-view')).toBeTruthy();
    app.navigate('manage-document');
    expect(document.querySelector('.manage-view')).toBeTruthy();
    expect(document.querySelector('[data-tab="document"]').getAttribute('aria-selected')).toBe('true');
  });

  it('abre las vistas retiradas del menú mediante enlaces profundos', () => {
    window.history.replaceState({}, '', '/?view=manage-document');
    mount();
    expect(document.querySelector('[data-tab="document"]').getAttribute('aria-selected')).toBe('true');
    window.history.replaceState({}, '', '/');
  });

  it('aplica el color de acento configurado como propiedad CSS', () => {
    mount({ theme: { accentColor: '#112233' } });
    expect(document.getElementById('app').style.getPropertyValue('--accent-color')).toBe('#112233');
  });
});
