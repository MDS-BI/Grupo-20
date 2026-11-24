import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { initApp } from '../../src/app.js';
import { MODULE_CONFIG, setActiveConfig } from '../../src/module-config.js';
import {
  addDocument,
  addEntity,
  loadDocuments,
  loadEntities,
  saveMarketingConfig,
} from '../../src/storage.js';
import { formatRut } from '../../src/seed.js';
import { computeMarketingPerformance } from '../../src/utils/marketing-performance.js';

const TEST_CONFIG = {
  ...MODULE_CONFIG,
  marketing: { ...MODULE_CONFIG.marketing, automationRules: [], faq: [], campaigns: [] },
};

const CAMPAIGNS = [
  {
    id: 'camp-a',
    name: 'Campaña A',
    stage: 'prospecto',
    startDate: '2026-11-01',
    endDate: '2026-11-30',
    status: 'detenida',
  },
  {
    id: 'camp-b',
    name: 'Campaña B',
    stage: 'en_proceso',
    startDate: '2026-11-01',
    endDate: '2026-11-30',
    status: 'detenida',
  },
  {
    id: 'camp-empty',
    name: 'Campaña sin registros',
    stage: 'ganado',
    startDate: '2026-11-01',
    endDate: '2026-11-30',
    status: 'detenida',
  },
];

const ENTITY_FIELDS = [
  { key: 'estado_comercial', type: 'select' },
  { key: 'campaña', type: 'select' },
  { key: 'campaignId', type: 'text' },
  { key: 'rut', type: 'text' },
  { key: 'canal_contacto', type: 'select' },
  { key: 'contacto_correo', type: 'text' },
];

const DOCUMENT_FIELDS = [
  { key: 'importe', type: 'number' },
  { key: 'canal', type: 'text' },
  { key: 'respuesta', type: 'text' },
  { key: 'campaña', type: 'select' },
  { key: 'campaignId', type: 'text' },
];

const LABELS = [
  'Prospectos capturados',
  'Tasa de conversión',
  'Interacciones registradas',
  'Consultas respondidas',
  'Ventas ganadas',
];

const STAGE_LINES = [
  'Prospecto: 1',
  'En proceso: 0',
  'En recontacto: 0',
  'Cliente ganado: 1',
  'Perdido: 0',
];

let app;
let sequence = 0;

function mount() {
  window.history.replaceState({}, '', '/');
  document.body.innerHTML = '<div id="app"></div>';
  setActiveConfig(TEST_CONFIG);
  app = initApp(document.getElementById('app'), { rawConfig: TEST_CONFIG });
  return app;
}

function seedEntity(name, stage, attribution = {}) {
  sequence += 1;
  return addEntity(
    {
      name,
      code: `T118-${sequence}`,
      targetDate: '1980-05-05',
      rut: formatRut(`1111111${(sequence % 9) + 1}`),
      canal_contacto: 'correo',
      contacto_correo: `t118${sequence}@ejemplo.cl`,
      estado_comercial: stage,
      ...attribution,
    },
    { customFieldDefs: ENTITY_FIELDS }
  );
}

function seedDocument(entity, data) {
  return addDocument(
    { entity_id: entity.entity_id, ...data },
    { customFieldDefs: DOCUMENT_FIELDS }
  );
}

function seedData() {
  saveMarketingConfig({ salesTeams: [], faq: [], campaigns: CAMPAIGNS });
  const a1 = seedEntity('Prospecto A1', 'prospecto', { campaña: 'camp-a' });
  const a2 = seedEntity('Prospecto A2', 'ganado', { campaignId: 'camp-a' });
  const b1 = seedEntity('Prospecto B1', 'en_recontacto', { campaña: 'camp-b' });
  const noCampaign = seedEntity('Prospecto sin campaña', 'perdido');

  const documents = [
    seedDocument(a1, { status: 'contactado', campaña: 'camp-a' }),
    seedDocument(a1, {
      status: 'pendiente',
      canal: 'chat',
      respuesta: 'Hola',
      campaignId: 'camp-a',
    }),
    seedDocument(a2, { status: 'cerrado ganado', importe: 100, campaña: 'camp-a' }),
    seedDocument(b1, { status: 'cerrado ganado', importe: 50, campaignId: 'camp-b' }),
    seedDocument(noCampaign, { status: 'pendiente', canal: 'chat', respuesta: 'Gracias' }),
  ];
  return { a1, a2, b1, noCampaign, documents };
}

function openPerformance() {
  app.navigate('marketing');
  const tab = document.querySelector(
    '[data-action="marketing-section"][data-section="performance"]'
  );
  expect(tab).toBeTruthy();
  tab.click();
  const active = document.querySelector(
    '[data-action="marketing-section"][data-section="performance"]'
  );
  expect(active.getAttribute('aria-selected')).toBe('true');
  const root = document.querySelector('.marketing-performance');
  expect(root).toBeTruthy();
  return root;
}

function selectCampaign(id) {
  const select = document.querySelector('#performance-campaign');
  expect(select).toBeTruthy();
  select.value = id;
  select.dispatchEvent(new Event('change', { bubbles: true }));
  const root = document.querySelector('.marketing-performance');
  expect(document.querySelector('#performance-campaign').value).toBe(id);
  return root;
}

function cardValues(root) {
  const cards = [...root.querySelectorAll('.performance-cards .stat-card')];
  expect(cards.map((card) => card.querySelector('.stat-label').textContent)).toEqual(LABELS);
  return cards.map((card) => card.querySelector('.stat-value').textContent);
}

function stageLines(root) {
  return [...root.querySelectorAll('.stage-conversions li')].map((item) =>
    item.textContent.replace(/\s+/g, ' ').trim()
  );
}

function derivedValues(campaignId) {
  const result = computeMarketingPerformance({
    entities: loadEntities(),
    documents: loadDocuments(),
    campaigns: JSON.parse(localStorage.getItem('erp_marketing_config')).campaigns,
    campaignId,
  });
  return [
    String(result.totalProspects),
    `${result.conversionRate.toFixed(1)}%`,
    String(result.interactions),
    String(result.answeredQueries),
    String(result.wonSales),
  ];
}

beforeEach(() => {
  sequence = 0;
  mount();
});

afterEach(() => {
  app?.destroy();
  setActiveConfig(MODULE_CONFIG);
  window.history.replaceState({}, '', '/');
});

describe('Rendimiento de campañas en Marketing (T118)', () => {
  it('abre la sección y ofrece todas las campañas y la opción Sin campaña', () => {
    seedData();

    const root = openPerformance();

    expect(document.querySelector('.marketing-performance h2').textContent).toBe(
      'Rendimiento de campañas'
    );
    expect(
      [...root.querySelectorAll('#performance-campaign option')].map((option) => [
        option.value,
        option.textContent,
      ])
    ).toEqual([
      ['all', 'Todas las campañas'],
      ['none', 'Sin campaña'],
      ['camp-a', 'Campaña A'],
      ['camp-b', 'Campaña B'],
      ['camp-empty', 'Campaña sin registros'],
    ]);
    expect(cardValues(root)).toEqual(['4', '25.0%', '5', '2', '2']);
    expect(cardValues(root)).toEqual(derivedValues('all'));
  });

  it('muestra tarjetas y conversiones derivadas de entidades y documentos de la campaña seleccionada', () => {
    seedData();

    const root = selectCampaignInOpenSection('camp-a');

    expect(cardValues(root)).toEqual(['2', '50.0%', '3', '1', '1']);
    expect(cardValues(root)).toEqual(derivedValues('camp-a'));
    expect(stageLines(root)).toEqual(STAGE_LINES);
  });

  it('atribuye a Sin campaña solo los registros sin campaña o campaignId', () => {
    seedData();
    openPerformance();

    const root = selectCampaign('none');

    expect(cardValues(root)).toEqual(['1', '0.0%', '1', '1', '0']);
    expect(cardValues(root)).toEqual(derivedValues('none'));
    expect(stageLines(root)).toEqual([
      'Prospecto: 0',
      'En proceso: 0',
      'En recontacto: 0',
      'Cliente ganado: 0',
      'Perdido: 1',
    ]);
  });

  it('muestra ceros y un mensaje claro para una campaña sin registros', () => {
    seedData();
    openPerformance();

    const root = selectCampaign('camp-empty');

    expect(root.querySelector('.empty-state').textContent).toContain(
      'Sin registros para esta campaña.'
    );
    expect(cardValues(root)).toEqual(['0', '0.0%', '0', '0', '0']);
    expect(cardValues(root)).toEqual(derivedValues('camp-empty'));
    expect(stageLines(root).every((line) => line.endsWith(': 0'))).toBe(true);
  });

  it('actualiza las tarjetas sin recargar tras crear registros vinculados a la campaña', () => {
    const { a1 } = seedData();
    const initial = selectCampaignInOpenSection('camp-a');
    expect(cardValues(initial)).toEqual(['2', '50.0%', '3', '1', '1']);

    seedEntity('Prospecto A3 ganado', 'ganado', { campaignId: 'camp-a' });
    seedDocument(a1, { status: 'cerrado ganado', importe: 200, campaignId: 'camp-a' });

    const other = selectCampaign('none');
    expect(cardValues(other)).toEqual(['1', '0.0%', '1', '1', '0']);

    const updated = selectCampaign('camp-a');
    expect(cardValues(updated)).toEqual(['3', '66.7%', '4', '1', '2']);
    expect(cardValues(updated)).toEqual(derivedValues('camp-a'));
    expect(stageLines(updated)).toEqual([
      'Prospecto: 1',
      'En proceso: 0',
      'En recontacto: 0',
      'Cliente ganado: 2',
      'Perdido: 0',
    ]);
    expect(JSON.parse(localStorage.getItem('erp_marketing_config')).campaigns).toEqual(CAMPAIGNS);
  });
});

function selectCampaignInOpenSection(id) {
  openPerformance();
  return selectCampaign(id);
}
