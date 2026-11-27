import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect, beforeEach } from 'vitest';
import { initApp } from '../../src/app.js';
import { MODULE_CONFIG } from '../../src/module-config.js';
import { addEntity, addDocument } from '../../src/storage.js';

let app;

function mount() {
  document.body.innerHTML = '<div id="app"></div>';
  app = initApp(document.getElementById('app'), { rawConfig: MODULE_CONFIG });
  return app;
}

function createClient() {
  return addEntity({
    name: 'Acme',
    code: 'AC-1',
    targetDate: '1980-05-05',
    rut: '11.111.111-1',
    canal_contacto: 'llamada',
    contacto_telefono: '+56912345678',
  });
}

describe('Panel de inicio con tres acciones rápidas (T229/T232)', () => {
  beforeEach(() => mount());

  it('ofrece exactamente tres acciones rápidas en el orden acordado', () => {
    const quickActions = document.querySelector('.dashboard .quick-actions');
    expect(quickActions).toBeTruthy();
    const actions = [...quickActions.querySelectorAll('button')];
    expect(actions).toHaveLength(3);
    expect(
      actions.map((button) =>
        button.dataset.action === 'navigate'
          ? `navigate:${button.dataset.view}`
          : button.dataset.action
      )
    ).toEqual(['quick-manage', 'navigate:manage-document', 'quick-search']);
    expect(document.body.textContent).not.toContain('Abrir Marketing');
    expect(document.body.textContent).not.toContain('Nuevo Cliente');
    expect(document.body.textContent).not.toContain('Nueva interacción');
    expect(document.querySelector('.demo-note')).toBeNull();
    expect(actions.map((button) => button.dataset.variant)).toEqual([
      'primary',
      'secondary',
      'secondary',
    ]);
    expect(actions.map((button) => button.textContent.trim())).toEqual([
      'Gestionar clientes',
      'Gestionar interacciones',
      'Buscar registros',
    ]);
  });

  it('aplica fondo claro, tarjetas elevadas y botones de acciones jerarquizados', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/styles.css'), 'utf8');
    expect(css).toContain('--bg: #F8FAFC');
    expect(css).toContain('--surface: #FFFFFF');
    expect(css).toContain('--accent-color: #1D4ED8');
    expect(css).toMatch(/\.stat-card[^}]*box-shadow:/);
    expect(css).toMatch(/\.quick-actions[^}]*flex-wrap:\s*nowrap/);
    expect(css).toMatch(/\[data-variant="primary"\][^}]*var\(--accent-color\)/);
    expect(css).toMatch(/\[data-variant="secondary"\][^}]*var\(--surface\)/);
    expect(css).toMatch(/\[data-variant="secondary"\][^}]*border:\s*1px solid/);
  });

  it('abre cada acción en su gestión o enfoca la búsqueda', () => {
    createClient();
    app.navigate('dashboard');
    document.querySelector('[data-action="quick-manage"]').click();
    expect(document.querySelector('.manage-view')).toBeTruthy();
    expect(document.querySelector('[data-tab="entity"]').getAttribute('aria-selected')).toBe(
      'true'
    );
    expect(document.getElementById('field-name').value).toBe('');

    app.navigate('dashboard');
    document.querySelector('[data-action="navigate"][data-view="manage-document"]').click();
    expect(document.querySelector('[data-tab="document"]').getAttribute('aria-selected')).toBe(
      'true'
    );
    expect(document.getElementById('document-form')).toBeTruthy();
    expect(document.getElementById('field-notes').value).toBe('');

    app.navigate('dashboard');
    document.querySelector('[data-action="quick-search"]').click();
    expect(document.activeElement.id).toBe('search-input');
  });

  it('muestra los recuentos en cero y los actualiza tras crear registros', () => {
    expect(
      [...document.querySelectorAll('.summary-cards .stat-value')].map((el) => el.textContent)
    ).toEqual(['0', '0', '0', '0%', '$0']);

    const client = createClient();
    addDocument({ entity_id: client.entity_id, status: 'cerrado ganado', importe: 500 });
    app.navigate('dashboard');
    expect(
      [...document.querySelectorAll('.summary-cards .stat-value')].map((el) => el.textContent)
    ).toEqual(['1', '1', '1', '100%', '$0']);
  });
});
