import { afterEach, describe, it, expect } from 'vitest';
import { initApp } from '../../src/app.js';
import { DEFAULT_CONFIG, setActiveConfig } from '../../src/module-config.js';
import { addEntity, loadEntities } from '../../src/storage.js';

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

function mount(rawConfig) {
  document.body.innerHTML = '<div id="app"></div>';
  return initApp(document.getElementById('app'), { rawConfig });
}

afterEach(() => {
  setActiveConfig(DEFAULT_CONFIG);
});

describe('Valores históricos de fecha de nacimiento (US2)', () => {
  it('conserva un valor fuera de rango, lo muestra y exige corrección al editar', () => {
    setActiveConfig(DEFAULT_CONFIG);
    const legacy = addEntity({ name: 'Cliente Antiguo', code: 'ANT-1', targetDate: '1900-05-05' });

    const app = mount(CLIENT_CONFIG);
    app.navigate('search');
    expect(document.body.textContent).toContain('Fecha de nacimiento: 1900-05-05');

    document.querySelector('[data-action="view-entity"]').click();
    expect(document.querySelector('#entity-detail').textContent).toContain('Fecha de nacimiento: 1900-05-05');

    app.navigate('search');
    document.querySelector('[data-action="edit-entity"]').click();
    const dateInput = document.querySelector('#field-targetDate');
    expect(dateInput.value).toBe('1900-05-05');

    document.querySelector('#field-name').value = 'Cliente Antiguo Actualizado';
    document.querySelector('#entity-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    expect(document.querySelector('#error-targetDate').textContent).toContain('Fecha de nacimiento');
    expect(loadEntities().find((e) => e.id === legacy.id).targetDate).toBe('1900-05-05');

    document.querySelector('#field-targetDate').value = '1950-05-05';
    document.querySelector('#entity-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    const updated = loadEntities().find((e) => e.id === legacy.id);
    expect(updated.targetDate).toBe('1950-05-05');
    expect(updated.name).toBe('Cliente Antiguo Actualizado');
    app.destroy();
  });
});
