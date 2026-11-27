import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initApp } from '../../src/app.js';
import { signIn } from '../helpers/auth-session.js';

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

  it('ofrece cinco botones laterales en el orden acordado sin Clientes ni Interacciones', () => {
    const views = Array.from(document.querySelectorAll('.sidebar-button')).map(
      (button) => button.dataset.view
    );
    expect(views).toEqual(['dashboard', 'search', 'summary', 'marketing', 'postventa']);
    expect(document.querySelector('#nav-entities')).toBeNull();
    expect(document.querySelector('#nav-documents')).toBeNull();
    expect(document.querySelector('#nav-marketing')).toBeTruthy();
    expect(document.querySelector('#nav-postventa')).toBeTruthy();
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

  it('usa iconos SVG monocromáticos de trazo uniforme en los cinco botones laterales', () => {
    const buttons = [...document.querySelectorAll('.sidebar-button')];
    expect(buttons).toHaveLength(5);
    for (const button of buttons) {
      const icon = button.querySelector('.sidebar-icon svg');
      expect(icon, `Falta SVG en ${button.dataset.view}`).toBeTruthy();
      expect(icon.getAttribute('viewBox')).toBe('0 0 24 24');
      expect(icon.getAttribute('fill')).toBe('none');
      expect(icon.getAttribute('stroke')).toBe('currentColor');
      expect(icon.getAttribute('stroke-width')).toBe('1.75');
      expect(button.querySelector('.sidebar-icon').textContent.trim()).toBe('');
      expect(button.getAttribute('aria-label')).toBeTruthy();
    }
    expect(document.querySelector('.sidebar').textContent).not.toMatch(/[⌂🔍📊📣🎫]/u);

    const css = readFileSync(resolve(process.cwd(), 'src/styles.css'), 'utf8');
    expect(css).toMatch(/@media \(max-width:\s*640px\)[\s\S]*\.sidebar-icon[\s\S]*svg/);
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
    document
      .getElementById('entity-form')
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    for (const view of ['dashboard', 'search', 'summary', 'marketing', 'postventa']) {
      document.querySelector(`[data-action="navigate"][data-view="${view}"]`).click();
    }
    expect(localStorage.getItem('erp_entities')).toContain('Acme');
    expect(document.querySelectorAll('.sidebar-button')).toHaveLength(5);
  });

  it('conserva los enlaces profundos a las vistas de gestión retiradas del menú', () => {
    app.navigate('manage-entity');
    expect(document.querySelector('.manage-view')).toBeTruthy();
    app.navigate('manage-document');
    expect(document.querySelector('.manage-view')).toBeTruthy();
    expect(document.querySelector('[data-tab="document"]').getAttribute('aria-selected')).toBe(
      'true'
    );
  });

  it('abre las vistas retiradas del menú mediante enlaces profundos', () => {
    window.history.replaceState({}, '', '/?view=manage-document');
    mount();
    expect(document.querySelector('[data-tab="document"]').getAttribute('aria-selected')).toBe(
      'true'
    );
    window.history.replaceState({}, '', '/');
  });

  it('aplica el color de acento configurado como propiedad CSS', () => {
    mount({ theme: { accentColor: '#112233' } });
    expect(document.getElementById('app').style.getPropertyValue('--accent-color')).toBe('#112233');
  });
});

describe('Selector de tema claro y oscuro', () => {
  afterEach(() => {
    localStorage.removeItem('erp_theme');
    document.documentElement.dataset.theme = 'light';
  });

  it('cambia entre temas desde la barra superior y guarda la preferencia', () => {
    localStorage.removeItem('erp_theme');
    mount();
    const toggle = document.querySelector('#theme-toggle');

    expect(document.documentElement.dataset.theme).toBe('light');
    expect(toggle.querySelector('.theme-icon--sun')).toBeTruthy();
    expect(toggle.querySelector('.theme-icon--moon')).toBeTruthy();
    expect(toggle.getAttribute('aria-pressed')).toBe('false');

    toggle.click();

    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem('erp_theme')).toBe('dark');
    expect(document.querySelector('#theme-toggle').getAttribute('aria-pressed')).toBe('true');
    expect(document.querySelector('#theme-toggle').getAttribute('aria-label')).toBe(
      'Cambiar a tema claro'
    );
  });

  it('recupera el tema guardado al volver a cargar la aplicación', () => {
    localStorage.setItem('erp_theme', 'dark');
    mount();

    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(document.querySelector('#theme-toggle').getAttribute('aria-label')).toBe(
      'Cambiar a tema claro'
    );
  });

  it('define variables de fondo, tarjetas, textos y bordes para ambos temas', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/styles.css'), 'utf8');

    expect(css).toMatch(/:root\s*\{[\s\S]*--bg:[\s\S]*--surface:[\s\S]*--text:[\s\S]*--border:/);
    expect(css).toMatch(/\[data-theme='dark'\]/);
    expect(css).toMatch(/\[data-theme='dark'\] \{[\s\S]*?--bg:/);
  });
});

describe('Tarjeta del usuario en la barra lateral', () => {
  beforeEach(() => {
    localStorage.clear();
    signIn('gerente');
    mount();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('muestra el nombre en negrita y el rol debajo dentro de una tarjeta al pie de la barra lateral', () => {
    const card = document.querySelector('.sidebar .user-meta');
    expect(card).toBeTruthy();

    const name = card.querySelector('.user-identity #current-user');
    const role = card.querySelector('.user-identity #current-rank');
    expect(name.tagName.toLowerCase()).toBe('strong');
    expect(name.textContent).toBe('gerente');
    expect(role.textContent).toBe('Nivel 4 - Gerente Comercial');
    expect(card.querySelector('.user-role')).toBeTruthy();

    const css = readFileSync(resolve(process.cwd(), 'src/styles.css'), 'utf8');
    expect(css).toMatch(/\.user-meta\s*\{[\s\S]*?margin-top:\s*auto/);
    expect(css).toMatch(/\.user-actions\s*\{[\s\S]*?flex-direction:\s*column/);
    expect(css).toMatch(/\.user-actions button\s*\{[\s\S]*?width:\s*100%/);
  });

  it('diferencia la acción de gestión de la de cierre de sesión', () => {
    const secondary = document.querySelector('.user-action--secondary');
    const logout = document.querySelector('.user-action--logout');

    expect(secondary.textContent).toContain('Gestionar usuarios');
    expect(secondary.dataset.view).toBe('users-admin');
    expect(logout.textContent).toContain('Cerrar sesión');
    expect(logout.dataset.action).toBe('logout');
  });
});
