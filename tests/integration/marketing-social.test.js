import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { initApp } from '../../src/app.js';
import { MODULE_CONFIG, setActiveConfig } from '../../src/module-config.js';
import { addEntity } from '../../src/storage.js';
import { formatRut } from '../../src/seed.js';

const CAMPAIGN_NAME = 'Campaña Redes';
const SOCIAL_CONFIG = {
  ...MODULE_CONFIG,
  customFields: {
    ...MODULE_CONFIG.customFields,
    document: [
      ...MODULE_CONFIG.customFields.document,
      { key: 'nota', type: 'text', label: 'Nota' },
    ],
  },
};

let app;
let entity;
let sequence = 0;

function storedDocuments() {
  return JSON.parse(localStorage.getItem('erp_documents') || '[]');
}

function socialItems() {
  return [...document.querySelectorAll('.marketing-social .social-list .list-item')];
}

function socialTitles() {
  return socialItems().map((item) => item.querySelector('.list-item-title').textContent);
}

function fillSocialForm(values = {}) {
  const form = document.querySelector('#social-form');
  const fields = {
    entity_id: entity.entity_id,
    plataforma: 'Instagram',
    startDate: '2026-11-20',
    tipo_interaccion: 'Comentario',
    nota: 'Me gustó la publicación',
    enlace: 'https://instagram.com/p/ejemplo',
    campaña: CAMPAIGN_NAME,
    ...values,
  };
  for (const [name, value] of Object.entries(fields)) {
    form.querySelector(`[name="${name}"]`).value = value;
  }
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}

function openSocialSection() {
  document.querySelector('[data-action="navigate"][data-view="marketing"]').click();
  const tab = document.querySelector('[data-action="marketing-section"][data-section="social"]');
  tab.click();
  expect(
    document
      .querySelector('[data-action="marketing-section"][data-section="social"]')
      .getAttribute('aria-selected')
  ).toBe('true');
  expect(document.querySelector('.marketing-social h2').textContent).toBe('Redes sociales');
}

describe('Interacciones en Redes sociales en Marketing (T100)', () => {
  beforeEach(() => {
    setActiveConfig(SOCIAL_CONFIG);
    localStorage.setItem(
      'erp_marketing_config',
      JSON.stringify({
        salesTeams: [],
        faq: [],
        campaigns: [
          {
            id: 'camp_social',
            name: CAMPAIGN_NAME,
            stage: 'prospecto',
            startDate: '2026-11-01',
            endDate: '2026-11-30',
          },
        ],
      })
    );
    sequence += 1;
    entity = addEntity({
      name: `Cliente Social ${sequence}`,
      code: `SOC-${sequence}`,
      targetDate: '1980-05-05',
      rut: formatRut(`1111111${sequence}`),
      canal_contacto: 'correo',
      contacto_correo: `social${sequence}@ejemplo.cl`,
      consentimiento: true,
      consentimiento_fecha: '2026-11-20T12:00:00.000Z',
      consentimiento_version: '2026-11-23',
    });
    document.body.innerHTML = '<div id="app"></div>';
    app = initApp(document.getElementById('app'), { rawConfig: SOCIAL_CONFIG });
    openSocialSection();
  });

  afterEach(() => {
    app?.destroy();
  });

  it('abre la sección vacía y registra una interacción vinculada a la entidad con canal redes', () => {
    expect(document.querySelector('.marketing-social .empty-state').textContent).toBe(
      'Aún no hay interacciones en redes sociales.'
    );
    expect(storedDocuments()).toEqual([]);
    expect(
      [...document.querySelectorAll('#social-form [name]')].map((field) => field.name)
    ).toEqual([
      'entity_id',
      'plataforma',
      'startDate',
      'tipo_interaccion',
      'nota',
      'enlace',
      'campaña',
    ]);
    expect(
      [...document.querySelectorAll('#social-form [name="campaña"] option')].map(
        (option) => option.value
      )
    ).toContain(CAMPAIGN_NAME);

    fillSocialForm();

    const documents = storedDocuments();
    expect(documents).toHaveLength(1);
    expect(documents[0]).toMatchObject({
      entity_id: entity.entity_id,
      plataforma: 'Instagram',
      startDate: '2026-11-20',
      tipo_interaccion: 'Comentario',
      nota: 'Me gustó la publicación',
      enlace: 'https://instagram.com/p/ejemplo',
      campaña: CAMPAIGN_NAME,
      canal: 'redes',
      status: 'pendiente',
    });
    expect(JSON.parse(localStorage.getItem('erp_documents'))[0].canal).toBe('redes');

    const item = socialItems()[0];
    expect(item.querySelector('.list-item-title').textContent).toBe('Instagram · Comentario');
    expect(item.textContent).toContain('2026-11-20');
    expect(item.textContent).toContain('Me gustó la publicación');
    expect(item.querySelector('a').getAttribute('href')).toBe('https://instagram.com/p/ejemplo');
    expect(document.querySelector('#social-form [name="entity_id"]').value).toBe('');
  });

  it('ordena por fecha, edita una interacción y deja el estado vacío al eliminarlas', () => {
    fillSocialForm({
      plataforma: 'Instagram',
      startDate: '2026-11-20',
      tipo_interaccion: 'Comentario',
      nota: 'Tarde',
      enlace: 'https://instagram.com/p/tarde',
    });
    fillSocialForm({
      plataforma: 'Twitter',
      startDate: '2026-11-05',
      tipo_interaccion: 'Mensaje',
      nota: 'Temprano',
      enlace: 'https://twitter.com/p/temprano',
    });
    fillSocialForm({
      plataforma: 'YouTube',
      startDate: '2026-11-12',
      tipo_interaccion: 'Me gusta',
      nota: 'Medio',
      enlace: 'https://youtube.com/p/medio',
    });

    expect(socialTitles()).toEqual([
      'Twitter · Mensaje',
      'YouTube · Me gusta',
      'Instagram · Comentario',
    ]);

    const edited = storedDocuments().find((doc) => doc.nota === 'Temprano');
    document.querySelector(`[data-action="edit-social"][data-id="${edited.id}"]`).click();
    const form = document.querySelector('#social-form');
    expect(form.querySelector('[name="entity_id"]').value).toBe(entity.entity_id);
    expect(form.querySelector('[name="plataforma"]').value).toBe('Twitter');
    expect(form.querySelector('[name="startDate"]').value).toBe('2026-11-05');
    expect(form.querySelector('[name="tipo_interaccion"]').value).toBe('Mensaje');
    expect(form.querySelector('[name="nota"]').value).toBe('Temprano');
    expect(form.querySelector('[name="enlace"]').value).toBe('https://twitter.com/p/temprano');
    expect(form.querySelector('[name="campaña"]').value).toBe(CAMPAIGN_NAME);
    expect(form.querySelector('button[type="submit"]').textContent).toBe('Guardar interacción');

    form.querySelector('[name="startDate"]').value = '2026-11-25';
    form.querySelector('[name="tipo_interaccion"]').value = 'Compartido';
    form.querySelector('[name="nota"]').value = 'Reagendado';
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    expect(storedDocuments().find((doc) => doc.id === edited.id)).toMatchObject({
      entity_id: entity.entity_id,
      startDate: '2026-11-25',
      tipo_interaccion: 'Compartido',
      nota: 'Reagendado',
      canal: 'redes',
    });
    expect(storedDocuments()).toHaveLength(3);
    expect(socialTitles()).toEqual([
      'YouTube · Me gusta',
      'Instagram · Comentario',
      'Twitter · Compartido',
    ]);
    expect(document.querySelector('#social-form button[type="submit"]').textContent).toBe(
      'Registrar interacción'
    );

    document.querySelector(`[data-action="delete-social"][data-id="${edited.id}"]`).click();
    expect(storedDocuments().some((doc) => doc.id === edited.id)).toBe(false);
    expect(socialItems()).toHaveLength(2);

    for (const doc of [...storedDocuments()]) {
      document.querySelector(`[data-action="delete-social"][data-id="${doc.id}"]`).click();
    }
    expect(storedDocuments()).toEqual([]);
    expect(localStorage.getItem('erp_documents')).toBe('[]');
    expect(document.querySelector('.marketing-social .empty-state').textContent).toBe(
      'Aún no hay interacciones en redes sociales.'
    );
  });

  it('refleja las interacciones registradas en la ficha de la entidad', () => {
    fillSocialForm({
      startDate: '2026-11-20',
      nota: 'Comentario en publicación',
      enlace: 'https://instagram.com/p/publicacion',
    });
    fillSocialForm({
      plataforma: 'Twitter',
      startDate: '2026-11-05',
      tipo_interaccion: 'Mensaje',
      nota: 'Mensaje directo',
      enlace: 'https://twitter.com/p/directo',
    });

    document.querySelector('[data-action="navigate"][data-view="search"]').click();
    document
      .querySelector(`[data-action="view-entity"][data-entity-id="${entity.entity_id}"]`)
      .click();

    expect(document.querySelector('#entity-detail').dataset.entityId).toBe(entity.entity_id);
    const history = document.querySelector('#entity-history');
    expect([...history.querySelectorAll('.list-item-date')].map((el) => el.textContent)).toEqual([
      '2026-11-05',
      '2026-11-20',
    ]);
    expect(history.textContent).toContain('Mensaje directo');
    expect(history.textContent).toContain('Comentario en publicación');
    expect(history.textContent).toContain('Plataforma: Twitter');
    expect(history.textContent).toContain('Tipo de interacción: Mensaje');
    expect(history.textContent).toContain(`Campaña: ${CAMPAIGN_NAME}`);
    expect(history.textContent).toContain('Canal: redes');
    expect(history.textContent).toContain('pendiente');
  });
});
