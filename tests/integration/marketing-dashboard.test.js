import { describe, it, expect, beforeEach } from 'vitest';
import { initApp } from '../../src/app.js';
import { MODULE_CONFIG } from '../../src/module-config.js';
import { addEntity, addDocument, updateDocument, deleteDocument } from '../../src/storage.js';
import { formatRut } from '../../src/seed.js';

const DERIVED_KEYS = [
  'entityCount',
  'documentCount',
  'wonDocuments',
  'conversionRate',
  'pipelineTotal',
  'funnel',
  'entityLabel',
  'entityPlural',
  'documentLabel',
  'documentPlural',
  'leadsAnalyzed',
  'openOpportunities',
  'wonClients',
  'lossRate',
  'categories',
];

let app;

function seedEntities() {
  return [1, 2, 3, 4, 5].map((suffix) =>
    addEntity({
      name: `Prospecto ${suffix}`,
      code: `MKT-${suffix}`,
      targetDate: '1980-05-05',
      rut: formatRut(`1111111${suffix}`),
      canal_contacto: 'correo',
      contacto_correo: `p${suffix}@ejemplo.cl`,
    })
  );
}

function seedDocuments(entities) {
  return [
    addDocument({
      entity_id: entities[0].entity_id,
      status: 'prospecto',
      importe: 100,
      notes: 'Primer contacto',
    }),
    addDocument({
      entity_id: entities[1].entity_id,
      status: 'en negociacion',
      importe: 250,
      notes: 'Propuesta enviada',
    }),
    addDocument({
      entity_id: entities[2].entity_id,
      status: 'cerrado ganado',
      notes: 'Venta cerrada',
    }),
    addDocument({
      entity_id: entities[3].entity_id,
      status: 'pendiente',
      notes: 'Seguimiento pendiente',
    }),
  ];
}

function snapshot(selector) {
  const root = document.querySelector(selector);
  return {
    values: [...root.querySelectorAll('.summary-cards .stat-value')].map((el) => el.textContent),
    labels: [...root.querySelectorAll('.summary-cards .stat-label')].map((el) => el.textContent),
    funnel: [...root.querySelectorAll('.commercial-funnel .funnel-row')].map((row) =>
      row.textContent.replace(/\s+/g, ' ').trim()
    ),
    recent: root.querySelector('.recent-interactions').textContent.replace(/\s+/g, ' ').trim(),
  };
}

function comparePanelAndMarketing() {
  app.navigate('dashboard');
  const panel = snapshot('.dashboard');
  app.navigate('marketing');
  expect(snapshot('.marketing-view')).toEqual(panel);
  return panel;
}

function expectNoDerivedKeys() {
  const stored = `${localStorage.getItem('erp_entities') || ''}${localStorage.getItem('erp_documents') || ''}`;
  for (const key of DERIVED_KEYS) expect(stored).not.toContain(`"${key}"`);
}

describe('Panel y Marketing comparten tarjetas y embudo (T086/T133)', () => {
  let entities;
  let documents;

  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
    app = initApp(document.getElementById('app'), { rawConfig: MODULE_CONFIG });
    entities = seedEntities();
    documents = seedDocuments(entities);
    app.navigate('marketing');
  });

  it('muestra las mismas cinco tarjetas, etiquetas, embudo y lista de interacciones', () => {
    const panel = comparePanelAndMarketing();
    expect(panel.labels).toEqual([
      'Clientes',
      'Interacciones',
      'Cerrado ganado',
      'Tasa de conversión',
      'Pipeline (USD)',
    ]);
    expect(panel.values).toEqual(['5', '4', '1', '20%', '$350']);
    expect(panel.funnel).toHaveLength(6);
    expect(panel.recent).toContain('Últimas Interacciones / Próximos Seguimientos');
    expect(panel.recent).toContain('Ver ficha');
  });

  it('no muestra la torta, el selector de etapas ni el estado comercial', () => {
    const html = document.getElementById('app').innerHTML;
    expect(html).not.toContain('Estado comercial de la cartera');
    expect(html).not.toContain('estado_comercial');
    expect(document.querySelector('.marketing-chart')).toBeNull();
    expect(document.querySelector('[data-role="marketing-stage"]')).toBeNull();
  });

  it('permanece sincronizado tras crear, editar y eliminar documentos sin persistir derivados', () => {
    comparePanelAndMarketing();
    expectNoDerivedKeys();

    const created = addDocument({
      entity_id: entities[4].entity_id,
      status: 'cerrado ganado',
      importe: 75,
      notes: 'Venta nueva',
    });
    expect(comparePanelAndMarketing().values).toEqual(['5', '5', '2', '40%', '$350']);
    expectNoDerivedKeys();

    updateDocument(created.id, { status: 'en negociacion', importe: 425 });
    expect(comparePanelAndMarketing().values).toEqual(['5', '5', '1', '20%', '$775']);
    expectNoDerivedKeys();

    deleteDocument(created.id);
    expect(comparePanelAndMarketing().values).toEqual(['5', '4', '1', '20%', '$350']);
    expectNoDerivedKeys();
    expect(documents).toHaveLength(4);
  });

  it('reserva las tres acciones rápidas del panel para el panel (T234)', () => {
    app.navigate('dashboard');
    const actions = [...document.querySelectorAll('.dashboard .quick-actions button')];
    expect(actions.map((button) => button.textContent.trim())).toEqual([
      'Gestionar clientes (editar, archivar, eliminar)',
      'Gestionar interacciones',
      'Buscar registros',
    ]);

    app.navigate('marketing');
    expect(document.querySelector('.marketing-view .quick-actions')).toBeNull();
    expect(document.querySelectorAll('.marketing-view [data-action^="quick-"]')).toHaveLength(0);
    const marketingText = document.querySelector('.marketing-view').textContent;
    expect(marketingText).not.toContain('Gestionar clientes');
    expect(marketingText).not.toContain('Gestionar interacciones');
    expect(marketingText).not.toContain('Buscar registros');
    expect(document.querySelectorAll('.marketing-view .summary-cards .stat-value')).toHaveLength(5);
  });
});
