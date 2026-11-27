import { afterEach, describe, it, expect } from 'vitest';
import { initApp } from '../../src/app.js';
import { DEFAULT_CONFIG, setActiveConfig } from '../../src/module-config.js';
import { addEntity } from '../../src/storage.js';

function mount() {
  document.body.innerHTML = '<div id="app"></div>';
  return initApp(document.getElementById('app'));
}

afterEach(() => {
  setActiveConfig(DEFAULT_CONFIG);
  window.confirm = () => true;
});

describe('Navegación con cambios sin guardar (US4)', () => {
  it('confirma antes de salir por la barra lateral y conserva el borrador al quedarse', () => {
    const app = mount();
    app.navigate('manage-entity');
    const nameInput = document.querySelector('#field-name');
    nameInput.value = 'Borrador sin guardar';

    let message = '';
    window.confirm = (text) => {
      message = text;
      return false;
    };
    document.querySelector('[data-action="navigate"][data-view="dashboard"]').click();
    expect(message).toContain('cambios sin guardar');
    expect(document.querySelector('.manage-view')).toBeTruthy();
    expect(document.querySelector('#field-name').value).toBe('Borrador sin guardar');

    window.confirm = () => true;
    document.querySelector('[data-action="navigate"][data-view="dashboard"]').click();
    expect(document.querySelector('.manage-view')).toBeNull();
    app.destroy();
  });

  it('confirma antes de usar una acción rápida y descarta el borrador al aceptar', () => {
    const app = mount();
    app.navigate('manage-entity');
    document.querySelector('#field-name').value = 'Borrador';
    window.confirm = () => true;

    const quickAction = document.createElement('button');
    quickAction.type = 'button';
    quickAction.dataset.action = 'navigate';
    quickAction.dataset.view = 'manage-document';
    document.getElementById('app').appendChild(quickAction);
    quickAction.click();
    expect(app.getState().manageTab).toBe('document');
    expect(app.getState().entityFormDraft).toBeNull();
    app.destroy();
  });

  it('confirma al cambiar de pestaña con un formulario de documento modificado', () => {
    setActiveConfig(DEFAULT_CONFIG);
    const entity = addEntity({ name: 'Cliente Uno', code: 'CL-1' });
    const app = mount();
    app.navigate('manage-document');
    const select = document.querySelector('#document-entity-select');
    select.value = entity.entity_id;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    document.querySelector('#field-notes').value = 'Nota sin guardar';

    window.confirm = () => false;
    document.querySelector('[data-action="manage-tab"][data-tab="entity"]').click();
    expect(app.getState().manageTab).toBe('document');
    expect(document.querySelector('#field-notes').value).toBe('Nota sin guardar');

    window.confirm = () => true;
    document.querySelector('[data-action="manage-tab"][data-tab="entity"]').click();
    expect(app.getState().manageTab).toBe('entity');
    app.destroy();
  });
});
