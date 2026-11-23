import { describe, it, expect, beforeEach } from 'vitest';
import { initApp } from '../../src/app.js';
import { MODULE_CONFIG, setActiveConfig } from '../../src/module-config.js';
import { addEntity } from '../../src/storage.js';

let app;

function mount() {
  document.body.innerHTML = '<div id="app"></div>';
  app = initApp(document.getElementById('app'), { rawConfig: {} });
  return app;
}

function createEntity(name, code) {
  app.navigate('manage-entity');
  document.getElementById('field-name').value = name;
  document.getElementById('field-code').value = code;
  document.getElementById('entity-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}

describe('Buscar y encontrar entidades (H3/H9)', () => {
  beforeEach(() => {
    mount();
  });

  it('muestra solo las entidades coincidentes a medida que se escribe', () => {
    createEntity('Acme Corp', 'AC-1');
    createEntity('Globex', 'GL-1');

    document.querySelector('[data-action="navigate"][data-view="search"]').click();
    const input = document.getElementById('search-input');
    input.value = 'acme';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    const results = document.querySelectorAll('#search-results .list-item');
    expect(results).toHaveLength(1);
    expect(results[0].textContent).toContain('Acme Corp');
  });

  it('muestra un estado vacío claro cuando no hay coincidencias', () => {
    createEntity('Acme Corp', 'AC-1');
    document.querySelector('[data-action="navigate"][data-view="search"]').click();
    const input = document.getElementById('search-input');
    input.value = 'no-existe-en-ningun-registro';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(document.querySelector('#search-results .empty-state')).toBeTruthy();
  });

  it('mantiene el foco del campo de búsqueda al escribir (no se re-renderiza el input completo)', () => {
    createEntity('Acme Corp', 'AC-1');
    document.querySelector('[data-action="navigate"][data-view="search"]').click();
    const input = document.getElementById('search-input');
    input.focus();
    input.value = 'a';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(document.activeElement).toBe(input);
  });
});

describe('Búsqueda del perfil cliente (T048)', () => {
  beforeEach(() => {
    setActiveConfig(MODULE_CONFIG);
    addEntity({
      name: 'Ana Comercial',
      code: 'CLI-777',
      category: 'CategoriaSecreta',
      description: 'DescripcionSecreta',
      targetDate: '1985-07-14',
      rut: '11.111.111-1',
      canal_contacto: 'correo',
      contacto_correo: 'ana@example.com',
    });
    document.body.innerHTML = '<div id="app"></div>';
    initApp(document.getElementById('app'));
  });

  function search(term) {
    document.querySelector('[data-action="navigate"][data-view="search"]').click();
    const input = document.getElementById('search-input');
    input.value = term;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    return document.querySelector('#search-results').textContent;
  }

  it('no encuentra clientes por campos ocultos', () => {
    expect(search('CLI-777')).toContain('No hay');
    expect(search('CategoriaSecreta')).toContain('No hay');
    expect(search('DescripcionSecreta')).toContain('No hay');
  });

  it('encuentra clientes por campos visibles', () => {
    expect(search('Ana')).toContain('Ana Comercial');
    expect(search('1985-07-14')).toContain('Ana Comercial');
    expect(search('11.111.111-1')).toContain('Ana Comercial');
    expect(search('ana@example.com')).toContain('Ana Comercial');
  });
});
