import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
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

function setField(name, value) {
  const field = document.querySelector(`#ticket-form [name="${name}"]`);
  expect(field, `No se encontró ${name}`).toBeTruthy();
  field.value = value;
  field.dispatchEvent(new Event('input', { bubbles: true }));
  field.dispatchEvent(new Event('change', { bubbles: true }));
}

function cardSnapshot() {
  const cards = document.querySelector('.postventa-cards');
  return {
    labels: [...cards.querySelectorAll('.stat-label')].map((element) => element.textContent),
    values: [...cards.querySelectorAll('.stat-value')].map((element) => element.textContent),
  };
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

    const view = document.querySelector('.postventa-view');
    const button = document.querySelector('[data-action="ticket-form"]');
    const cards = document.querySelector('.postventa-cards');
    const table = document.querySelector('.client-management-table');
    expect(view).toBeTruthy();
    expect(button).toBeTruthy();
    expect(cards).toBeTruthy();
    expect(table).toBeTruthy();
    expect(view.contains(cards)).toBe(true);
    expect(view.querySelectorAll('.postventa-cards .stat-card')).toHaveLength(3);
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
  });

  it('filtra el desplegable Cliente por nombre y excluye archivados', () => {
    addEntity({ name: 'Alpha Ltda', code: 'PV-A' });
    addEntity({ name: 'Beta S.A.', code: 'PV-B' });
    const archived = addEntity({ name: 'Archivada', code: 'PV-C' });
    archiveEntity(archived.id);
    setSearch('?view=postventa');
    mount();
    document.querySelector('[data-action="ticket-form"]').click();

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

  it('usa el mismo dimensionamiento de tarjetas que Resumen sin reglas específicas', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/styles.css'), 'utf8');
    const declarations = (selector) => {
      const escaped = selector.replaceAll('.', '\\.');
      const match = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`));
      expect(match, `No se encontró ${selector}`).toBeTruthy();
      return match[1]
        .split(';')
        .map((declaration) => declaration.trim())
        .filter(Boolean);
    };

    expect(declarations('.summary-cards')).toEqual(declarations('.postventa-cards'));
    expect(css).not.toMatch(/\.postventa-cards\s+\.stat-card/);
    expect(css).not.toMatch(/\.postventa-cards\s+\.stat-label/);
    expect(css).not.toMatch(/\.postventa-cards\s+\.stat-value/);

    setSearch('?view=postventa');
    mount();
    const card = document.querySelector('.postventa-cards .stat-card');
    expect([...card.children].map((element) => element.className)).toEqual([
      'stat-label',
      'stat-value',
    ]);
  });

  it('conserva tarjetas y tabla al abrir, guardar y cerrar el panel (T242)', () => {
    const entity = addEntity({ name: 'Cliente del panel en línea', code: 'PV-INLINE' });
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    setSearch('?view=postventa');
    mount();

    const before = cardSnapshot();
    document.querySelector('[data-action="ticket-form"]').click();
    const during = cardSnapshot();
    expect(during).toEqual(before);
    expect(document.querySelector('.client-management-table')).toBeNull();

    setField('entity_id', entity.entity_id);
    setField('asunto', 'Ticket creado en línea');
    setField('categoria', 'garantia');
    setField('prioridad', 'media');
    document
      .getElementById('ticket-form')
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    expect(document.querySelector('#ticket-form')).toBeNull();
    expect(document.querySelector('.client-management-table').textContent).toContain(
      'Ticket creado en línea'
    );
    expect(document.querySelector('[data-action="ticket-form"]')).toBeTruthy();
    const after = cardSnapshot();
    expect(after.labels).toEqual(before.labels);
    expect(after.values).toEqual(['1', '0', '0']);
    expect(dispatchSpy.mock.calls.some(([event]) => event instanceof StorageEvent)).toBe(false);
    expect(app.getState().view).toBe('postventa');
    expect(window.location.search).toBe('?view=postventa');
  });
});
