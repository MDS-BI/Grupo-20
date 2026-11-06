import { describe, it, expect, beforeEach } from 'vitest';
import { initApp } from '../../src/app.js';

function mount(rawConfig) {
  document.body.innerHTML = '<div id="app"></div>';
  return initApp(document.getElementById('app'), { rawConfig });
}

const SALES_CONFIG = {
  moduleName: 'Ventas',
  labels: {
    entity: 'Cliente',
    entityPlural: 'Clientes',
    document: 'Pedido de Venta',
    documentPlural: 'Pedidos de Venta',
  },
};

describe('Reetiquetar pantallas desde la configuración (H7)', () => {
  it('usa los términos configurados en el panel, la barra lateral y los formularios', () => {
    mount(SALES_CONFIG);
    expect(document.querySelector('.module-name').textContent).toBe('Ventas');
    expect(document.body.textContent).toContain('Clientes');

    document.querySelector('[data-action="navigate"][data-view="manage-entity"]').click();
    expect(document.querySelector('[for="field-name"]').textContent).toContain('Cliente');

    document.querySelector('[data-action="navigate"][data-view="manage-document"]').click();
    expect(document.body.textContent).toContain('Pedido de Venta');
  });

  it('no cambia el comportamiento de navegación tras remapear etiquetas', () => {
    mount(SALES_CONFIG);
    document.querySelector('[data-action="navigate"][data-view="manage-entity"]').click();
    expect(document.querySelector('.manage-view')).toBeTruthy();
    document.querySelector('[data-action="navigate"][data-view="search"]').click();
    expect(document.querySelector('.search-view')).toBeTruthy();
  });

  it('usa los términos predeterminados Entidad/Documento cuando no hay mapeos', () => {
    mount(null);
    expect(document.body.textContent).toContain('Entidades');
  });
});
