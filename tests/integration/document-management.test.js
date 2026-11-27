import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initApp } from '../../src/app.js';
import { LOST_REASON_OPTIONS } from '../../src/utils/lost-reason.js';
import { addEntity, loadDocuments } from '../../src/storage.js';

const CONFIG = {
  labels: { entity: 'Cliente', document: 'Interacción', documentPlural: 'Interacciones' },
  customFields: {
    entity: [
      {
        key: 'estado_comercial',
        label: 'Estado comercial',
        type: 'text',
        options: ['prospecto', 'ganado'],
      },
    ],
    document: [
      { key: 'motivo_perdida', label: 'Motivo de pérdida', type: 'text' },
      { key: 'automation_key', label: 'Clave de automatización', type: 'text' },
    ],
  },
  documentRules: {
    lostReason: {
      status: 'cerrado perdido',
      entityStateField: 'estado_comercial',
      entityState: 'prospecto',
      customField: 'motivo_perdida',
      options: LOST_REASON_OPTIONS,
    },
  },
  fieldRules: {
    entity: { code: { hidden: true } },
    document: { automation_key: { hidden: true } },
  },
  statusLifecycle: {
    states: ['pendiente', 'cerrado ganado', 'cerrado perdido'],
    transitions: {},
  },
};

let app;

beforeEach(() => {
  document.body.innerHTML = '<div id="app"></div>';
  localStorage.clear();
  globalThis.confirm = vi.fn(() => true);
});

afterEach(() => {
  app?.destroy();
  app = null;
});

function setField(name, value) {
  const field = document.querySelector(`#document-form [name="${name}"]`);
  expect(field, `No se encontró ${name}`).toBeTruthy();
  field.value = value;
  field.dispatchEvent(new Event('input', { bubbles: true }));
  field.dispatchEvent(new Event('change', { bubbles: true }));
}

describe('Gestión de documentos con cierre perdido (T150/T151/T153)', () => {
  it('exige motivo al cerrar perdido y lo muestra en el historial', () => {
    const entity = addEntity({
      name: 'Prospecto Doc',
      code: 'DM-1',
      estado_comercial: 'prospecto',
    });
    app = initApp(document.getElementById('app'), { rawConfig: CONFIG });
    app.navigate('manage-document');
    const select = document.getElementById('document-entity-select');
    select.value = entity.entity_id;
    select.dispatchEvent(new Event('change', { bubbles: true }));

    expect(document.querySelector('#field-automation_key')).toBeNull();
    setField('status', 'cerrado perdido');
    const reason = document.getElementById('field-motivo_perdida');
    expect(reason).toBeTruthy();
    expect(
      [...reason.querySelectorAll('option')].map((option) => option.value).filter(Boolean)
    ).toEqual(LOST_REASON_OPTIONS);

    document
      .getElementById('document-form')
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(loadDocuments()).toHaveLength(0);
    expect(document.body.textContent).toContain('Completa los campos obligatorios.');

    setField('motivo_perdida', 'Eligió competencia');
    document
      .getElementById('document-form')
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(loadDocuments()).toHaveLength(1);
    expect(document.querySelector('.document-list').textContent).toContain('Eligió competencia');
  });
});
