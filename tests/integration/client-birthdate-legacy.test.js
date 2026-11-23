import { afterEach, describe, it, expect } from 'vitest';
import { initApp } from '../../src/app.js';
import { DEFAULT_CONFIG, MODULE_CONFIG, setActiveConfig } from '../../src/module-config.js';
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

  it('bloquea la ficha de un cliente heredado incompleto y permite corregirlo', () => {
    setActiveConfig(DEFAULT_CONFIG);
    const legacy = addEntity({
      name: 'Cliente Heredado',
      code: 'ANT-2',
      targetDate: '1980-01-01',
      category: 'Antigua',
      description: 'Texto heredado',
      pedidos: 5,
    });

    const app = mount(MODULE_CONFIG);
    app.navigate('search');
    expect(document.querySelector('#search-results').textContent).toContain('Cliente Heredado');

    document.querySelector('[data-action="view-entity"]').click();
    const blocked = document.querySelector('.entity-detail-blocked');
    expect(blocked).toBeTruthy();
    expect(blocked.textContent).toContain('RUT');
    expect(blocked.textContent).toContain('Canal de Contacto');
    expect(blocked.querySelector('[data-action="edit-entity"]')).toBeTruthy();
    expect(document.querySelector('#entity-history')).toBeNull();

    blocked.querySelector('[data-action="edit-entity"]').click();
    expect(document.getElementById('field-code')).toBeNull();
    document.getElementById('field-rut').value = '11.111.111-1';
    document.getElementById('field-canal_contacto').value = 'llamada';
    document.getElementById('field-canal_contacto').dispatchEvent(new Event('change', { bubbles: true }));
    document.getElementById('field-contacto_telefono').value = '+56912345678';
    document.getElementById('entity-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    app.navigate('search');
    document.querySelector('[data-action="view-entity"]').click();
    expect(document.querySelector('.entity-detail-blocked')).toBeNull();
    expect(document.querySelector('#entity-detail-info').textContent).toContain('1980-01-01');
    expect(document.querySelector('#entity-detail-info').textContent).not.toContain('ANT-2');
    expect(loadEntities().find((e) => e.id === legacy.id).code).toBe('ANT-2');
    app.destroy();
  });
});
