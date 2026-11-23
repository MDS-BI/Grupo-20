import { describe, it, expect, beforeEach } from 'vitest';
import { initApp } from '../../src/app.js';
import { MODULE_CONFIG, setActiveConfig } from '../../src/module-config.js';
import { addEntity, loadEntities } from '../../src/storage.js';

function mount() {
  document.body.innerHTML = '<div id="app"></div>';
  return initApp(document.getElementById('app'), { rawConfig: {} });
}

function createEntity(name, code) {
  document.querySelector('[data-action="navigate"][data-view="manage-entity"]').click();
  document.getElementById('field-name').value = name;
  document.getElementById('field-code').value = code;
  document.getElementById('entity-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}

function addDocumentToSelectedEntity(notes, startDate) {
  document.querySelector('[data-action="navigate"][data-view="manage-document"]').click();
  const select = document.getElementById('document-entity-select');
  select.value = select.querySelector('option:not([value=""])').value;
  select.dispatchEvent(new Event('change', { bubbles: true }));
  document.getElementById('field-notes').value = notes;
  document.getElementById('field-startDate').value = startDate;
  document.getElementById('document-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}

describe('Ficha de entidad con historial ordenado (H3)', () => {
  beforeEach(() => {
    mount();
  });

  it('muestra los datos de la entidad y su historial ordenado por fecha', () => {
    createEntity('Cliente Uno', 'CL-1');
    addDocumentToSelectedEntity('Segunda interacción', '2026-03-01');
    addDocumentToSelectedEntity('Primera interacción', '2026-01-01');

    document.querySelector('[data-action="navigate"][data-view="search"]').click();
    document.querySelector('[data-action="view-entity"]').click();

    const notesInOrder = Array.from(document.querySelectorAll('.list-item-notes')).map((el) => el.textContent);
    expect(notesInOrder).toEqual(['Primera interacción', 'Segunda interacción']);
  });

  it('refleja las ediciones hechas en la pantalla de gestión', () => {
    createEntity('Cliente Uno', 'CL-1');
    document.querySelector('[data-action="navigate"][data-view="search"]').click();
    document.querySelector('[data-action="view-entity"]').click();
    expect(document.querySelector('.entity-detail-header h2').textContent).toBe('Cliente Uno');

    document.querySelector('[data-action="navigate"][data-view="search"]').click();
    document.querySelector('[data-action="edit-entity"]').click();
    document.getElementById('field-name').value = 'Cliente Uno Renombrado';
    document.getElementById('entity-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    document.querySelector('[data-action="navigate"][data-view="search"]').click();
    document.querySelector('[data-action="view-entity"]').click();
    expect(document.querySelector('.entity-detail-header h2').textContent).toBe('Cliente Uno Renombrado');
  });

  it('no muestra campos retirados en la ficha del perfil cliente', () => {
    setActiveConfig(MODULE_CONFIG);
    const entity = addEntity({
      name: 'Cliente Retirados',
      code: 'RET-1',
      category: 'Vieja',
      description: 'Descripción vieja',
      targetDate: '1975-01-01',
      rut: '11.111.111-1',
      canal_contacto: 'correo',
      contacto_correo: 'retirados@example.com',
      pedidos: 777,
    });

    document.body.innerHTML = '<div id="app"></div>';
    const app = initApp(document.getElementById('app'));
    app.navigate('search');
    document.getElementById('search-input').value = 'retirados';
    document.getElementById('search-input').dispatchEvent(new Event('input', { bubbles: true }));
    document.querySelector('[data-action="view-entity"]').click();

    const info = document.querySelector('#entity-detail-info').textContent;
    expect(info).not.toContain('RET-1');
    expect(info).not.toContain('Vieja');
    expect(info).not.toContain('Descripción vieja');
    expect(info).not.toContain('777');
    expect(info).toContain('retirados@example.com');
    expect(loadEntities().find((item) => item.id === entity.id).code).toBe('RET-1');
  });
});
