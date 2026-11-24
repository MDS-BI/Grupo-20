import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { initApp } from '../../src/app.js';
import { DEFAULT_CONFIG, MODULE_CONFIG, setActiveConfig } from '../../src/module-config.js';
import {
  addDocument,
  addEntity,
  loadDocuments,
  loadEntities,
  saveMarketingConfig,
  updateEntityStage,
} from '../../src/storage.js';
import { formatRut } from '../../src/utils/field-formats.js';
import { MARKETING_STAGE_LABELS, MARKETING_STAGES } from '../../src/utils/marketing-stages.js';
import { signIn } from '../helpers/auth-session.js';

const BASE_CONFIG = {
  ...MODULE_CONFIG,
  marketing: {
    ...MODULE_CONFIG.marketing,
    automationRules: [],
    campaigns: [],
  },
};

let app = null;
let sequence = 0;

function validClient(overrides = {}) {
  sequence += 1;
  return {
    name: `Prospecto ${sequence}`,
    targetDate: '1990-01-01',
    rut: formatRut(66000000 + sequence),
    canal_contacto: 'llamada',
    contacto_telefono: '+56912345678',
    ...overrides,
  };
}

function mount(config = BASE_CONFIG) {
  app = initApp({ mountElement: document.body, rawConfig: config, enableAuth: true });
  return app;
}

function openPerformance() {
  document
    .querySelector('[data-section="performance"]')
    .dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

beforeEach(async () => {
  await signIn('camila.ramirez');
  setActiveConfig(BASE_CONFIG);
});

afterEach(() => {
  app?.destroy();
  app = null;
  setActiveConfig(DEFAULT_CONFIG);
  localStorage.clear();
});

describe('Conversión de prospectos a Cliente ganado', () => {
  it('no expone la etapa ganada como selector en Marketing y usa la etiqueta visible', () => {
    mount();
    app.navigate('marketing');

    expect(document.querySelector('#view-root [name="estado_comercial"]')).toBeNull();
    expect(document.querySelector('#view-root [data-action*="stage"]')).toBeNull();
    expect(MARKETING_STAGES.at(-2)).toBe('ganado');
    expect(MARKETING_STAGE_LABELS.ganado).toBe('Cliente ganado');

    openPerformance();
    openCampaignForm();
    const stageSelect = document.querySelector('#campaign-form [name="stage"]');
    expect(stageSelect.querySelector('option[value="ganado"]').textContent).toBe('Cliente ganado');
  });

  it('conserva identidad, campos y documentos al promover manualmente a ganado', () => {
    const prospect = addEntity(
      validClient({ estado_comercial: 'prospecto', rubro: 'Dependiente' }),
      { customFieldDefs: BASE_CONFIG.customFields.entity }
    );
    const interaction = addDocument({
      entity_id: prospect.entity_id,
      notes: 'Primer contacto',
      status: 'pendiente',
    });
    const previousUpdate = prospect.updatedAt;

    const converted = updateEntityStage(prospect.id, 'ganado');

    expect(converted.id).toBe(prospect.id);
    expect(converted.entity_id).toBe(prospect.entity_id);
    expect(converted.rut).toBe(prospect.rut);
    expect(converted.rubro).toBe('Dependiente');
    expect(converted.estado_comercial).toBe('ganado');
    expect(converted.estado_comercial).not.toBe('cerrado ganado');
    expect(converted.updatedAt).not.toBe(previousUpdate);
    expect(loadDocuments().some((doc) => doc.id === interaction.id)).toBe(true);
    expect(interaction.status).toBe('pendiente');
  });

  it('registra la conversión por campaña con documento de auditoría', () => {
    const campaign = {
      id: 'campaign-conversion',
      name: 'Campaña de conversión',
      stage: 'en_proceso',
      event: 'document_created',
      action: 'update_stage',
      targetStage: 'ganado',
      status: 'activa',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    };
    const config = {
      ...BASE_CONFIG,
      marketing: { ...BASE_CONFIG.marketing, campaigns: [campaign] },
    };
    setActiveConfig(config);
    saveMarketingConfig({ salesTeams: [], faq: [], campaigns: [campaign] });

    const prospect = addEntity(validClient({ estado_comercial: 'en_proceso' }), {
      customFieldDefs: config.customFields.entity,
    });
    addDocument({ entity_id: prospect.entity_id, notes: 'Disparador de campaña' });

    const converted = loadEntities().find((entity) => entity.id === prospect.id);
    const docs = loadDocuments().filter((doc) => doc.entity_id === prospect.entity_id);
    expect(converted.estado_comercial).toBe('ganado');
    expect(docs.some((doc) => doc.campaignId === campaign.id && doc.notes.includes('ganado'))).toBe(
      true
    );
  });

  it('distingue Cliente ganado de Cerrado ganado en el rendimiento', () => {
    const entity = addEntity(validClient({ estado_comercial: 'ganado' }), {
      customFieldDefs: BASE_CONFIG.customFields.entity,
    });
    addDocument({ entity_id: entity.entity_id, status: 'cerrado ganado', importe: 250 });
    addDocument({ entity_id: entity.entity_id, status: 'ganado', importe: 999 });

    mount();
    app.navigate('marketing');
    openPerformance();

    expect(document.querySelector('.stage-conversions').textContent).toContain('Cliente ganado: 1');
    const wonCard = [...document.querySelectorAll('.performance-cards .stat-card')].find((card) =>
      card.textContent.includes('Ventas ganadas')
    );
    expect(wonCard.querySelector('.stat-value').textContent).toBe('1');
  });
});

function openCampaignForm() {
  document
    .querySelector('[data-section="campaigns"]')
    .dispatchEvent(new MouseEvent('click', { bubbles: true }));
}
