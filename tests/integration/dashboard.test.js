import { describe, it, expect, beforeEach } from 'vitest';
import { initApp } from '../../src/app.js';
import { addEntity, addDocument } from '../../src/storage.js';

let app;

function mount() {
  document.body.innerHTML = '<div id="app"></div>';
  app = initApp(document.getElementById('app'));
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

describe('Panel de inicio con acciones rápidas y estadísticas (T048/T050/T051/T134)', () => {
  beforeEach(() => mount());

  it('ofrece exactamente cinco acciones rápidas sin «Abrir Marketing» ni datos demo', () => {
    const quickActions = document.querySelector('.dashboard .quick-actions');
    expect(quickActions).toBeTruthy();
    const actions = [...quickActions.querySelectorAll('button')];
    expect(actions).toHaveLength(5);
    expect(document.body.textContent).not.toContain('Abrir Marketing');
    expect(document.querySelector('.demo-note')).toBeNull();
    expect(
      actions.map((button) =>
        button.dataset.action === 'navigate'
          ? `navigate:${button.dataset.view}`
          : button.dataset.action
      )
    ).toEqual([
      'quick-new-entity',
      'quick-new-document',
      'quick-manage',
      'quick-search',
      'navigate:manage-document',
    ]);
  });

  it('abre cada destino con el formulario vacío o la búsqueda enfocada', () => {
    document.querySelector('[data-action="quick-new-entity"]').click();
    expect(document.querySelector('.manage-view')).toBeTruthy();
    expect(document.getElementById('field-name').value).toBe('');

    app.navigate('dashboard');
    document.querySelector('[data-action="quick-manage"]').click();
    expect(document.querySelector('[data-tab="entity"]').getAttribute('aria-selected')).toBe(
      'true'
    );

    app.navigate('dashboard');
    document.querySelector('[data-action="quick-search"]').click();
    expect(document.activeElement.id).toBe('search-input');

    app.navigate('dashboard');
    const client = createClient();
    document.querySelector('[data-action="quick-new-document"]').click();
    expect(document.querySelector('[data-tab="document"]').getAttribute('aria-selected')).toBe(
      'true'
    );
    const entitySelect = document.getElementById('document-entity-select');
    entitySelect.value = client.entity_id;
    entitySelect.dispatchEvent(new Event('change', { bubbles: true }));
    expect(document.getElementById('document-form')).toBeTruthy();
    expect(document.getElementById('field-notes').value).toBe('');
  });

  it('la acción «Gestionar documentos» abre la pestaña de documentos', () => {
    document.querySelector('[data-action="navigate"][data-view="manage-document"]').click();
    expect(document.querySelector('[data-tab="document"]').getAttribute('aria-selected')).toBe(
      'true'
    );
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
