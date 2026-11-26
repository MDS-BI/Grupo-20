import { afterEach, describe, expect, it, vi } from 'vitest';
import { initApp } from '../../src/app.js';
import { NAV_ITEMS } from '../../src/components/shell.js';
import { addEntity, archiveEntity } from '../../src/storage.js';

let app = null;

function setSearch(search = '') {
  window.history.replaceState({}, '', `${window.location.pathname}${search}`);
}

function mount() {
  document.body.innerHTML = '<div id="app"></div>';
  app = initApp(document.getElementById('app'), { rawConfig: null });
  return app;
}

function click(selector) {
  const element = document.querySelector(selector);
  expect(element, `No se encontró ${selector}`).toBeTruthy();
  element.click();
}

afterEach(() => {
  app?.destroy();
  app = null;
  setSearch('');
  localStorage.clear();
});

describe('Vista de Postventa y ruta relativa (T198)', () => {
  it('muestra Postventa como quinta opción después de Marketing', () => {
    expect(NAV_ITEMS.map((item) => item.key)).toEqual([
      'dashboard',
      'search',
      'summary',
      'marketing',
      'postventa',
    ]);
    mount();
    const buttons = [...document.querySelectorAll('.sidebar-button')];
    expect(buttons).toHaveLength(5);
    expect(buttons[4].dataset.view).toBe('postventa');
    expect(buttons[4].textContent).toContain('Postventa');
  });

  it('resuelve ?view=postventa en carga, Back/Forward y resalta la opción activa', async () => {
    setSearch('?view=postventa');
    mount();

    expect(app.getState().view).toBe('postventa');
    expect(window.location.search).toBe('?view=postventa');
    expect(document.querySelector('.postventa-view')).toBeTruthy();
    expect(document.querySelector('.sidebar-button.active').dataset.view).toBe('postventa');

    app.navigate('search');
    expect(window.location.search).toBe('?view=search');
    window.history.back();
    await vi.waitFor(() => expect(app.getState().view).toBe('postventa'));
    expect(window.location.search).toBe('?view=postventa');
    window.history.forward();
    await vi.waitFor(() => expect(app.getState().view).toBe('search'));
    expect(window.location.search).toBe('?view=search');
  });

  it('ordena botón, tarjetas y tabla y muestra ceros con estado vacío', () => {
    mount();
    app.navigate('postventa');

    const button = document.querySelector('[data-action="ticket-form"]');
    const cards = document.querySelector('.postventa-cards');
    const table = document.querySelector('.client-management-table');
    expect(button).toBeTruthy();
    expect(cards).toBeTruthy();
    expect(table).toBeTruthy();
    expect(button.compareDocumentPosition(cards) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(cards.compareDocumentPosition(table) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(cards.textContent).toContain('Tickets abiertos');
    expect(cards.textContent).toContain('En proceso');
    expect(cards.textContent).toContain('Resueltos');
    expect([...cards.querySelectorAll('.stat-value')].map((el) => el.textContent)).toEqual([
      '0',
      '0',
      '0',
    ]);
    expect(table.textContent).toContain('No hay tickets registrados.');

    click('[data-action="ticket-form"]');
    const names = [...document.querySelectorAll('#ticket-form [name]')].map((field) => field.name);
    expect(names).toEqual([
      'entity_id',
      'asunto',
      'categoria',
      'prioridad',
      'status',
      'nota_resolucion',
    ]);
    const priority = document.querySelector('#ticket-form [name="prioridad"]');
    expect(priority.value).toBe('');
    expect([...priority.options].map((option) => option.textContent)).toEqual([
      '-- Selecciona --',
      'Baja',
      'Media',
      'Alta',
    ]);
  });

  it('filtra el desplegable Cliente por nombre y excluye archivados', () => {
    addEntity({ name: 'Alpha Ltda', code: 'PV-A' });
    addEntity({ name: 'Beta S.A.', code: 'PV-B' });
    const archived = addEntity({ name: 'Archivada', code: 'PV-C' });
    archiveEntity(archived.id);
    mount();
    app.navigate('postventa');
    click('[data-action="ticket-form"]');

    const initial = [...document.querySelectorAll('#ticket-client option')].map(
      (option) => option.textContent
    );
    expect(initial.join(' ')).toContain('Alpha Ltda');
    expect(initial.join(' ')).toContain('Beta S.A.');
    expect(initial.join(' ')).not.toContain('Archivada');

    const search = document.querySelector('#ticket-client-search');
    search.value = 'alpha';
    search.dispatchEvent(new Event('input', { bubbles: true }));

    const filtered = [...document.querySelectorAll('#ticket-client option')].map(
      (option) => option.textContent
    );
    expect(filtered.join(' ')).toContain('Alpha Ltda');
    expect(filtered.join(' ')).not.toContain('Beta S.A.');
  });
});
