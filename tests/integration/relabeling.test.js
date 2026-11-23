import { afterEach, describe, it, expect } from 'vitest';
import { initApp } from '../../src/app.js';
import { setActiveConfig, DEFAULT_CONFIG } from '../../src/module-config.js';
import { renderEntityFormHtml } from '../../src/components/entity-form.js';
import { renderEntityListHtml } from '../../src/components/entity-list.js';
import { renderEntityDetailHtml } from '../../src/components/entity-detail.js';
import { renderSearchBarHtml } from '../../src/components/search-bar.js';

function mount(rawConfig) {
  document.body.innerHTML = '<div id="app"></div>';
  return initApp(document.getElementById('app'), { rawConfig });
}

afterEach(() => {
  setActiveConfig(DEFAULT_CONFIG);
});

const SALES_CONFIG = {
  moduleName: 'Ventas',
  labels: {
    entity: 'Cliente',
    entityPlural: 'Clientes',
    document: 'Pedido de Venta',
    documentPlural: 'Pedidos de Venta',
  },
};

const CLIENT_CONFIG = {
  moduleName: 'CRM Comercial',
  labels: {
    entity: 'Cliente',
    entityPlural: 'Clientes',
    document: 'Interacción',
    documentPlural: 'Interacciones',
  },
  entityDate: { label: 'Fecha de nacimiento', min: '1910-01-01', max: 'localToday' },
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

  it('muestra "Fecha de nacimiento" en formulario, lista, ficha y búsqueda del cliente', () => {
    setActiveConfig(CLIENT_CONFIG);
    const entity = {
      id: 'e1',
      entity_id: 'ent-1',
      name: 'Ana',
      code: 'A-1',
      targetDate: '1985-07-14',
      documents: [],
    };
    expect(renderEntityFormHtml(CLIENT_CONFIG, entity)).toContain('Fecha de nacimiento');
    expect(renderEntityFormHtml(CLIENT_CONFIG, entity)).not.toContain('Fecha objetivo');
    expect(renderEntityListHtml([entity], CLIENT_CONFIG)).toContain('Fecha de nacimiento: 1985-07-14');
    expect(renderEntityDetailHtml(CLIENT_CONFIG, entity, [])).toContain('Fecha de nacimiento: 1985-07-14');
    expect(renderSearchBarHtml(CLIENT_CONFIG)).toContain('Fecha de nacimiento');
  });
});
