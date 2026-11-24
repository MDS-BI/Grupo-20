import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { initApp } from '../../src/app.js';
import { MODULE_CONFIG, setActiveConfig } from '../../src/module-config.js';
import {
  addDocument,
  addEntity,
  loadDocuments,
  loadEntities,
  loadMarketingConfig,
  saveMarketingConfig,
  updateEntityStage,
} from '../../src/storage.js';
import { formatRut } from '../../src/seed.js';

const STAGE = 'en_recontacto';
const FORM_FIELDS = [
  'name',
  'stage',
  'startDate',
  'endDate',
  'action',
  'executive',
  'targetStage',
  'notes',
];
const FORM_VALUES = {
  name: 'Campaña T112',
  stage: STAGE,
  action: 'create_document',
  executive: 'Ana',
  targetStage: 'en_proceso',
  notes: 'Seguimiento T112 por campaña',
};

let app;
let sequence = 0;

function dateOffset(days) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const START_DATE = dateOffset(-1);
const END_DATE = dateOffset(1);

function defaultFormValues() {
  return { ...FORM_VALUES, startDate: START_DATE, endDate: END_DATE };
}

function mount() {
  window.history.replaceState({}, '', '/');
  document.body.innerHTML = '<div id="app"></div>';
  setActiveConfig(MODULE_CONFIG);
  app = initApp(document.getElementById('app'), { rawConfig: MODULE_CONFIG });
  return app;
}

function openCampaigns() {
  app.navigate('marketing');
  document.querySelector('[data-action="marketing-section"][data-section="campaigns"]').click();
  expect(
    document
      .querySelector('[data-action="marketing-section"][data-section="campaigns"]')
      .getAttribute('aria-selected')
  ).toBe('true');
  expect(document.querySelector('.marketing-campaigns')).toBeTruthy();
}

function openEntityDetail(entity) {
  app.navigate('search');
  const button = document.querySelector(
    `[data-action="view-entity"][data-entity-id="${entity.entity_id}"]`
  );
  expect(button).toBeTruthy();
  button.click();
  expect(document.querySelector('#entity-detail').dataset.entityId).toBe(entity.entity_id);
}

function submitCampaignForm(values = {}) {
  const form = document.querySelector('#campaign-form');
  expect(form).toBeTruthy();
  const fields = { ...defaultFormValues(), ...values };
  for (const field of FORM_FIELDS) {
    const input = form.elements.namedItem(field);
    expect(input, `campo ${field}`).toBeTruthy();
    input.value = fields[field];
  }
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}

function seedCampaign(overrides = {}) {
  const campaign = {
    id: 'camp_t112',
    ...defaultFormValues(),
    status: 'activa',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
  saveMarketingConfig({ salesTeams: [], faq: [], campaigns: [campaign] });
  return campaign;
}

function seedEntity(name, stage = STAGE) {
  sequence += 1;
  const rutDigit = (sequence % 9) + 1;
  return addEntity({
    name,
    code: `T112-${sequence}`,
    targetDate: '1980-05-05',
    rut: formatRut(`1111111${rutDigit}`),
    canal_contacto: 'correo',
    contacto_correo: `t112${sequence}@ejemplo.cl`,
    estado_comercial: stage,
  });
}

function campaignDocuments(campaignId) {
  return loadDocuments().filter((doc) => doc.campaignId === campaignId);
}

beforeEach(() => {
  mount();
});

afterEach(() => {
  app?.destroy();
  setActiveConfig(MODULE_CONFIG);
  window.history.replaceState({}, '', '/');
});

describe('Vista de campañas de Marketing (T112)', () => {
  it('abre la sección Campañas y muestra el estado vacío', () => {
    openCampaigns();

    expect(
      [...document.querySelectorAll('.marketing-campaigns .empty-state')].map(
        (el) => el.textContent
      )
    ).toEqual(['Aún no hay campañas programadas.', 'Todavía no hay ejecuciones de campaña.']);
    expect(document.querySelector('.campaign-list')).toBeNull();
    expect(document.querySelector('.campaign-history')).toBeNull();
    expect(
      [...document.querySelector('#campaign-form').querySelectorAll('[name]')].map((el) => el.name)
    ).toEqual(FORM_FIELDS);
    expect(loadMarketingConfig().campaigns).toEqual([]);
  });

  it('crea una campaña con todos los campos y la persiste en erp_marketing_config', () => {
    openCampaigns();
    submitCampaignForm();

    const campaigns = loadMarketingConfig().campaigns;
    expect(campaigns).toHaveLength(1);
    expect(campaigns[0]).toMatchObject({ ...defaultFormValues(), status: 'activa' });
    expect(campaigns[0].id).toMatch(/^camp-/);
    expect(Number.isNaN(Date.parse(campaigns[0].createdAt))).toBe(false);
    expect(JSON.parse(localStorage.getItem('erp_marketing_config')).campaigns).toEqual(campaigns);

    const item = document.querySelector('.campaign-list .list-item');
    expect(item.textContent).toContain(FORM_VALUES.name);
    expect(item.textContent).toContain(`${STAGE} · ${START_DATE} a ${END_DATE} · activa`);
    expect(item.querySelector('[data-action="edit-campaign"]').dataset.id).toBe(campaigns[0].id);
    expect(item.querySelector('[data-action="stop-campaign"]').dataset.id).toBe(campaigns[0].id);
  });

  it('precarga el formulario al editar y guarda los cambios sin alterar id ni estado', () => {
    openCampaigns();
    submitCampaignForm();
    const original = loadMarketingConfig().campaigns[0];

    document.querySelector('[data-action="edit-campaign"]').click();
    const form = document.querySelector('#campaign-form');
    expect(form.querySelector('button[type="submit"]').textContent).toContain('Guardar campaña');
    for (const field of FORM_FIELDS) {
      expect(form.elements.namedItem(field).value).toBe(String(defaultFormValues()[field]));
    }

    const changes = {
      name: 'Campaña T112 editada',
      stage: 'en_proceso',
      action: 'assign_executive',
      executive: 'Clara',
      targetStage: 'ganado',
      notes: 'Seguimiento editado',
    };
    submitCampaignForm(changes);

    const campaigns = loadMarketingConfig().campaigns;
    expect(campaigns).toHaveLength(1);
    expect(campaigns[0]).toMatchObject({
      ...changes,
      id: original.id,
      createdAt: original.createdAt,
      status: 'activa',
    });
    expect(document.querySelector('.campaign-list .list-item-title').textContent).toBe(
      changes.name
    );
    expect(document.querySelector('[data-action="cancel-campaign-edit"]')).toBeNull();
  });

  it('detiene la campaña desde el botón y conserva el historial', () => {
    openCampaigns();
    submitCampaignForm();
    const [campaign] = loadMarketingConfig().campaigns;
    const entity = seedEntity('Prospecto T112 detener');

    expect(campaignDocuments(campaign.id)).toHaveLength(1);
    openCampaigns();
    expect(document.querySelectorAll('.campaign-history li')).toHaveLength(1);

    document.querySelector('[data-action="stop-campaign"]').click();

    expect(loadMarketingConfig().campaigns[0]).toMatchObject({
      id: campaign.id,
      status: 'detenida',
    });
    expect(document.querySelector('[data-action="stop-campaign"]').disabled).toBe(true);
    expect(document.querySelectorAll('.campaign-history li')).toHaveLength(1);

    addDocument({
      entity_id: entity.entity_id,
      status: 'pendiente',
      notes: 'Interacción posterior',
    });
    expect(campaignDocuments(campaign.id)).toHaveLength(1);
  });
});

describe('Historial de ejecuciones de campañas (T112)', () => {
  it('registra fecha, campaña y acción al crear un prospecto de la etapa objetivo', () => {
    const campaign = seedCampaign();
    const entity = seedEntity('Prospecto T112 historial');

    const docs = campaignDocuments(campaign.id);
    expect(docs).toHaveLength(1);
    expect(docs[0]).toMatchObject({
      entity_id: entity.entity_id,
      campaignId: campaign.id,
      campaña: campaign.name,
      notes: FORM_VALUES.notes,
      status: 'automatico',
    });
    expect(Number.isNaN(Date.parse(docs[0].createdAt))).toBe(false);

    openCampaigns();
    const [historyItem] = document.querySelectorAll('.campaign-history li');
    expect(historyItem.textContent).toContain(docs[0].createdAt);
    expect(historyItem.textContent).toContain(docs[0].notes);
    expect(historyItem.textContent).toContain(campaign.id);

    openEntityDetail(entity);
    expect(document.querySelector('#entity-detail-title').textContent).toContain(entity.name);
    const historyEntry = document.querySelector(
      `#entity-history [data-document-id="${docs[0].id}"]`
    );
    expect(historyEntry.textContent).toContain(docs[0].notes);
    expect(historyEntry.textContent).toContain('automatico');
  });

  it('ejecuta assign_executive al cambiar la etapa y registra la acción', () => {
    const campaign = seedCampaign({ action: 'assign_executive' });
    const entity = seedEntity('Prospecto T112 etapa', 'prospecto');
    expect(campaignDocuments(campaign.id)).toEqual([]);

    updateEntityStage(entity.id, STAGE);

    const docs = campaignDocuments(campaign.id);
    expect(docs).toHaveLength(1);
    expect(docs[0]).toMatchObject({
      entity_id: entity.entity_id,
      notes: 'Asignar ejecutivo: Ana',
    });
    expect(
      loadEntities().find((item) => item.entity_id === entity.entity_id).ejecutivo_asignado
    ).toBe('Ana');

    openCampaigns();
    expect(document.querySelector('.campaign-history').textContent).toContain(
      'Asignar ejecutivo: Ana'
    );
  });

  it('ejecuta update_stage al crear un documento y registra la acción', () => {
    const campaign = seedCampaign({
      action: 'update_stage',
      targetStage: 'ganado',
      event: 'document_created',
    });
    const entity = seedEntity('Prospecto T112 documento', STAGE);
    expect(campaignDocuments(campaign.id)).toEqual([]);

    addDocument({
      entity_id: entity.entity_id,
      status: 'pendiente',
      notes: 'Llamada de seguimiento',
    });

    const docs = campaignDocuments(campaign.id);
    expect(docs).toHaveLength(1);
    expect(docs[0]).toMatchObject({
      notes: 'Actualizar estado comercial: ganado',
    });
    expect(
      loadEntities().find((item) => item.entity_id === entity.entity_id).estado_comercial
    ).toBe('ganado');

    openCampaigns();
    expect(document.querySelector('.campaign-history').textContent).toContain(
      'Actualizar estado comercial: ganado'
    );
  });

  it('no ejecuta la campaña sobre prospectos de otra etapa', () => {
    const campaign = seedCampaign();

    seedEntity('Prospecto T112 otra etapa', 'prospecto');

    expect(campaignDocuments(campaign.id)).toEqual([]);
    openCampaigns();
    expect(document.querySelector('.marketing-campaigns').textContent).toContain(
      'Todavía no hay ejecuciones de campaña.'
    );
  });
});
