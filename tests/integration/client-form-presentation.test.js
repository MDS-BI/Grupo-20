import { describe, it, expect, beforeEach } from 'vitest';
import { initApp } from '../../src/app.js';
import { loadEntities } from '../../src/storage.js';

function qs(id) {
  return document.getElementById(id);
}

function navigate(view) {
  document.querySelector(`[data-action="navigate"][data-view="${view}"]`).click();
}

function openForm() {
  navigate('manage-entity');
}

function chooseChannel(channel) {
  qs('field-canal_contacto').value = channel;
  qs('field-canal_contacto').dispatchEvent(new Event('change', { bubbles: true }));
}

function submit() {
  qs('entity-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}

const ACTIVITY_OPTIONS = [
  'Dependiente',
  'Independiente Formal',
  'Independiente Informal',
  'Jubilado',
  'Dueño/a de casa',
  'Estudiante',
  'FFAA',
  'Rentista',
  'Jubilado - FFAA',
  'Cesante',
];

const CHANNEL_LABELS = ['Llamada', 'Correo', 'Reunión', 'WhatsApp'];

describe('Presentación del formulario de clientes (T064)', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
    initApp(document.getElementById('app'));
  });

  it('muestra «Nuevo Cliente» en el formulario y en la acción rápida', () => {
    expect(document.querySelector('[data-action="quick-new-entity"]').textContent).toContain('Nuevo Cliente');
    openForm();
    expect(document.querySelector('h2').textContent).toContain('Nuevo Cliente');
    expect(document.querySelector('h2').textContent).not.toContain('Nueva cliente');
  });

  it('ordena las casillas con la adicional del canal junto a «Canal de Contacto»', () => {
    openForm();
    chooseChannel('llamada');

    const ids = [...document.querySelectorAll('#entity-form .form-field input, #entity-form .form-field select')]
      .map((element) => element.id)
      .filter(Boolean);

    expect(ids).toEqual([
      'field-name',
      'field-rut',
      'field-targetDate',
      'field-canal_contacto',
      'field-contacto_telefono',
      'field-rubro',
      'field-ejecutivo_asignado',
    ]);
  });

  it('muestra pistas grises y opciones con etiquetas legibles', () => {
    openForm();
    chooseChannel('llamada');

    expect(qs('field-rut').getAttribute('placeholder')).toBe('Ej: 11.111.111-1');
    expect(qs('field-contacto_telefono').getAttribute('placeholder')).toBe('Ej: +56 9 1234 5678');
    expect([...qs('field-canal_contacto').options].slice(1).map((option) => option.textContent)).toEqual(CHANNEL_LABELS);
    expect([...qs('field-rubro').options].slice(1).map((option) => option.textContent)).toEqual(ACTIVITY_OPTIONS);
  });

  it('no persiste las pistas como valores capturados', () => {
    openForm();
    qs('field-name').value = 'Cliente Presentación';
    qs('field-targetDate').value = '1980-05-05';
    qs('field-rut').value = '11.111.111-1';
    chooseChannel('llamada');
    qs('field-contacto_telefono').value = '+56912345678';
    qs('field-rubro').value = 'Dependiente';
    qs('field-ejecutivo_asignado').value = 'Ana';
    submit();

    const entity = loadEntities()[0];
    expect(entity.rut).toBe('11.111.111-1');
    expect(entity.contacto_telefono).toBe('+56912345678');
    expect(Object.values(entity)).not.toContain('Ej: 11.111.111-1');
    expect(Object.values(entity)).not.toContain('Ej: +56 9 1234 5678');
  });
});
