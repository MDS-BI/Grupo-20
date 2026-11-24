import { describe, it, expect, beforeEach } from 'vitest';
import { initApp } from '../../src/app.js';

let app;

function mount(rawConfig) {
  document.body.innerHTML = '<div id="app"></div>';
  app = initApp(document.getElementById('app'), { rawConfig });
  return app;
}

describe('Marco de espacio de trabajo ERP con marca (T043/T045)', () => {
  beforeEach(() => {
    mount();
  });

  it('muestra monograma SVG y nombre en la barra superior de cada pantalla', () => {
    for (const view of ['dashboard', 'search', 'summary', 'marketing']) {
      app.navigate(view);
      const logo = document.querySelector('.topbar .module-logo');
      expect(logo.tagName.toLowerCase()).toBe('svg');
      expect(logo.getAttribute('role')).toBe('img');
      expect(document.querySelector('#brand-name').textContent).toBe('CRM Comercial');
    }
  });

  it('ofrece cuatro botones laterales en el orden acordado sin Clientes ni Interacciones', () => {
    const views = Array.from(document.querySelectorAll('.sidebar-button')).map((button) => button.dataset.view);
    expect(views).toEqual(['dashboard', 'search', 'summary', 'marketing']);
    expect(document.querySelector('#nav-entities')).toBeNull();
    expect(document.querySelector('#nav-documents')).toBeNull();
    expect(document.querySelector('#nav-marketing')).toBeTruthy();
    expect(document.querySelector('.sidebar').textContent).not.toContain('Clientes');
    expect(document.querySelector('.sidebar').textContent).not.toContain('Interacciones');
  });

  it('mantiene etiquetas accesibles con la barra contraída', () => {
    for (const button of document.querySelectorAll('.sidebar-button')) {
      expect(button.getAttribute('aria-label')).toBeTruthy();
      expect(button.getAttribute('title')).toBe(button.getAttribute('aria-label'));
      expect(button.querySelector('.sidebar-icon')).toBeTruthy();
      expect(button.querySelector('.sidebar-label')).toBeTruthy();
    }
    expect(document.querySelector('#nav-marketing').getAttribute('aria-label')).toBe('Marketing');
  });

  it('resalta visualmente el botón del módulo activo', () => {
    document.querySelector('[data-action="navigate"][data-view="search"]').click();
    const active = document.querySelector('.sidebar-button.active');
    expect(active.dataset.view).toBe('search');
    expect(active.getAttribute('aria-current')).toBe('page');
    app.navigate('marketing');
    expect(document.querySelector('.sidebar-button.active').dataset.view).toBe('marketing');
  });

  it('conserva las entidades y documentos almacenados al navegar entre módulos', () => {
    mount({});
    app.navigate('manage-entity');
    document.getElementById('field-name').value = 'Acme';
    document.getElementById('field-code').value = 'AC-1';
    document.getElementById('entity-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    for (const view of ['dashboard', 'search', 'summary', 'marketing']) {
      document.querySelector(`[data-action="navigate"][data-view="${view}"]`).click();
    }
    expect(localStorage.getItem('erp_entities')).toContain('Acme');
    expect(document.querySelectorAll('.sidebar-button')).toHaveLength(4);
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
