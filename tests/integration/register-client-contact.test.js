import { describe, it, expect, beforeEach } from 'vitest';
import { initApp } from '../../src/app.js';
import { loadEntities } from '../../src/storage.js';

function qs(id) {
  return document.getElementById(id);
}

let app;

function navigate(view) {
  app.navigate(view);
}

function openForm() {
  navigate('manage-entity');
}

function fillBase({ channel, name = 'Cliente Uno', rut = '11.111.111-1' } = {}) {
  qs('field-name').value = name;
  qs('field-targetDate').value = '1980-05-05';
  qs('field-rut').value = rut;
  qs('field-canal_contacto').value = channel;
  qs('field-canal_contacto').dispatchEvent(new Event('change', { bubbles: true }));
}

function submit() {
  qs('entity-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}

const CHANNELS = [
  {
    channel: 'llamada',
    field: 'contacto_telefono',
    valid: '+56912345678',
    invalid: '123',
    placeholder: 'Ej: +56 9 1234 5678',
  },
  {
    channel: 'correo',
    field: 'contacto_correo',
    valid: 'ana@example.com',
    invalid: 'no-correo',
    placeholder: 'Ej: nombre@ejemplo.cl',
  },
  {
    channel: 'reunion',
    field: 'contacto_lugar',
    valid: 'Sala A',
    invalid: '',
    placeholder: 'Ej: Sala 2 o enlace',
  },
  {
    channel: 'whatsapp',
    field: 'contacto_whatsapp',
    valid: '+56987654321',
    invalid: 'abc',
    placeholder: 'Ej: +56 9 1234 5678',
  },
];

const CONTACT_FIELDS = CHANNELS.map(({ field }) => field);

describe('Campos condicionales por canal (T041)', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
    app = initApp(document.getElementById('app'));
  });

  it('muestra solo la casilla del canal elegido', () => {
    openForm();
    fillBase({ channel: 'correo' });

    expect(qs('field-contacto_correo')).toBeTruthy();
    for (const field of CONTACT_FIELDS.filter((key) => key !== 'contacto_correo')) {
      expect(qs(`field-${field}`)).toBeNull();
    }
  });

  it.each(CHANNELS)(
    'valida y guarda solo el contacto de $channel',
    ({ channel, field, valid, invalid, placeholder }) => {
      openForm();
      fillBase({ channel });
      expect(qs(`field-${field}`)).toBeTruthy();
      expect(qs(`field-${field}`).getAttribute('placeholder')).toBe(placeholder);

      qs(`field-${field}`).value = invalid;
      submit();
      expect(qs(`error-${field}`).textContent).toBeTruthy();

      qs(`field-${field}`).value = valid;
      submit();

      const entity = loadEntities()[0];
      expect(entity[field]).toBe(valid);
      for (const key of CONTACT_FIELDS.filter((item) => item !== field)) {
        expect(entity[key]).toBeUndefined();
      }
    }
  );
});
