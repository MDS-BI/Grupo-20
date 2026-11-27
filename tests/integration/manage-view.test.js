import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { initApp } from '../../src/app.js';
import { renderClientManagementTableHtml } from '../../src/components/entity-list.js';
import { MODULE_CONFIG } from '../../src/module-config.js';
import { addEntity } from '../../src/storage.js';

let app;

function mount() {
  document.body.innerHTML = '<div id="app"></div>';
  app = initApp(document.getElementById('app'), { rawConfig: MODULE_CONFIG });
  return app;
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  app?.destroy();
  app = null;
});

describe('Vista de gestión de clientes (US4/US24)', () => {
  it('usa el nombre como acceso a la ficha rápida y oculta el código configurado', () => {
    const entity = addEntity({ name: 'Cliente Rápido', code: 'VR-1' });
    mount();
    app.navigate('manage-entity');

    const table = document.querySelector('.client-management-table');
    const row = [...table.querySelectorAll('.client-management-row')].find((item) =>
      item.textContent.includes('Cliente Rápido')
    );
    expect(row.querySelector('[data-action="open-client-quick-view"]')).toBeTruthy();
    expect(row.querySelector('[data-action="open-client-quick-view"]').dataset.entityId).toBe(
      entity.entity_id
    );
    expect([...table.querySelectorAll('th')].map((th) => th.textContent)).not.toContain('Código');
    expect(row.querySelector('[data-action="edit-entity"]')).toBeTruthy();
  });

  it('no emite alta, edición ni baja en la variante de solo lectura', () => {
    const html = renderClientManagementTableHtml(
      [{ id: '1', entity_id: 'e-1', name: 'Solo lectura', code: 'SL-1', targetDate: '' }],
      MODULE_CONFIG,
      { readOnly: true }
    );
    expect(html).toContain('data-action="open-client-quick-view"');
    expect(html).not.toContain('data-action="edit-entity"');
    expect(html).not.toContain('data-action="archive-entity"');
    expect(html).not.toContain('data-action="delete-entity"');
    expect(html).not.toContain('Nuevo Cliente');
  });
});
