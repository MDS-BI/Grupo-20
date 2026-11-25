import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initApp } from '../../src/app.js';
import { logout } from '../../src/auth.js';
import { stopCampaign } from '../../src/utils/marketing-campaigns.js';
import { answerFaq } from '../../src/utils/marketing-chat.js';
import { can } from '../../src/auth/permissions.js';
import { MODULE_CONFIG } from '../../src/module-config.js';
import { seedAuth, signIn } from '../helpers/auth-session.js';
import {
  addDocument,
  addEntity,
  deleteEntity,
  loadEntities,
  loadDocuments,
  loadMarketingConfig,
  saveEntities,
  saveMarketingConfig,
} from '../../src/storage.js';
import { MESSAGES } from '../../src/utils/messages.js';
import { formatRut } from '../../src/utils/field-formats.js';
import { localTodayISO } from '../../src/utils/entity-date.js';

let app;

function setSearch(search = '') {
  window.history.replaceState({}, '', `${window.location.pathname}${search}`);
}

function mount(rawConfig) {
  document.body.innerHTML = '<div id="app"></div>';
  app = initApp({ mountElement: document.getElementById('app'), rawConfig });
  return app;
}

function click(selector) {
  const element = document.querySelector(selector);
  expect(element, `No se encontró ${selector}`).toBeTruthy();
  element.click();
}

function submit(selector) {
  const form = document.querySelector(selector);
  expect(form, `No se encontró ${selector}`).toBeTruthy();
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}

function entityData(name, index) {
  return {
    name,
    code: `N3-${index}`,
    targetDate: '1980-05-05',
    rut: formatRut(12000000 + index),
    canal_contacto: 'llamada',
    contacto_telefono: '+56 9 1234 5678',
  };
}

function futureDate(days = 30) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function openDetail(name) {
  app.navigate('search');
  const input = document.querySelector('#search-input');
  input.value = name;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  click('#search-results [data-action="view-entity"]');
}

function fillCapture(name, rut) {
  const form = document.querySelector('#capture-form');
  form.querySelector('[name="name"]').value = name;
  form.querySelector('[name="rut"]').value = rut;
  form.querySelector('[name="targetDate"]').value = '1980-05-05';
  const canal = form.querySelector('[name="canal_contacto"]');
  canal.value = 'llamada';
  canal.dispatchEvent(new Event('change', { bubbles: true }));
  const fresh = document.querySelector('#capture-form');
  fresh.querySelector('[name="contacto_telefono"]').value = '+56 9 1234 5678';
  fresh.querySelector('[name="consentimiento"]').checked = true;
  fresh.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}

describe('Permisos de Nivel 3 - Ejecutivo de Marketing', () => {
  beforeEach(() => {
    seedAuth();
    setSearch('');
  });

  afterEach(() => {
    app?.destroy();
    app = null;
    setSearch('');
  });

  it('puede capturar el prospecto Visita 2026-11-23 con consentimiento', async () => {
    setSearch('?view=capture');
    logout();
    mount();
    fillCapture('Visita 2026-11-23', formatRut(12000100));

    await vi.waitFor(() => expect(document.querySelector('#capture-confirmation')).toBeTruthy());
    expect(document.querySelector('#capture-confirmation').textContent).toBe(
      'Prospecto registrado correctamente.'
    );
    expect(loadEntities().some((entity) => entity.name === 'Visita 2026-11-23')).toBe(true);

    await signIn('marketing');
    app.navigate('search');
    const input = document.querySelector('#search-input');
    input.value = 'Visita 2026-11-23';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    expect(app.getState().role).toBe('n3_marketing');
    expect(document.querySelector('#search-results').textContent).toContain('Visita 2026-11-23');
  });

  it('puede registrar una interacción de Instagram', async () => {
    const entity = addEntity(entityData('Comercial Andina SpA', 1));
    const rawConfig = structuredClone(MODULE_CONFIG);
    rawConfig.customFields.document.push({ key: 'nota', type: 'text', label: 'Nota' });
    await signIn('marketing');
    mount(rawConfig);
    app.navigate('marketing');
    click('[data-action="marketing-section"][data-section="social"]');

    const form = document.querySelector('#social-form');
    form.querySelector('[name="entity_id"]').value = entity.entity_id;
    form.querySelector('[name="plataforma"]').value = 'Instagram';
    form.querySelector('[name="tipo_interaccion"]').value = 'Comentario';
    form.querySelector('[name="startDate"]').value = localTodayISO();
    form.querySelector('[name="nota"]').value = 'Consulta por Instagram';
    submit('#social-form');

    expect(
      loadDocuments().some(
        (doc) =>
          doc.entity_id === entity.entity_id &&
          doc.plataforma === 'Instagram' &&
          doc.nota === 'Consulta por Instagram'
      )
    ).toBe(true);
    expect(document.querySelector('.social-list').textContent).toContain('Instagram · Comentario');
  });

  it('puede registrar una consulta del chat y resolver la FAQ desde configuración', async () => {
    const entity = addEntity(entityData('Visita 2026-11-23', 2));
    const pregunta = MODULE_CONFIG.marketing.faq[1].pregunta;
    await signIn('marketing');
    mount();
    app.navigate('marketing');
    click('[data-action="marketing-section"][data-section="chat"]');

    const form = document.querySelector('#chat-form');
    form.querySelector('[name="entity_id"]').value = entity.entity_id;
    form.querySelector('[name="mensaje"]').value = pregunta;
    form.querySelector('[name="consentimiento"]').checked = true;
    submit('#chat-form');

    await vi.waitFor(() => expect(document.querySelector('.chat-response')).toBeTruthy());
    const messages = loadDocuments().filter((doc) => doc.canal === 'chat');
    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({
      entity_id: entity.entity_id,
      mensaje: pregunta,
      tipo_interaccion: 'consulta',
      status: 'pendiente',
    });
    expect(answerFaq(pregunta, MODULE_CONFIG)).toBe(MODULE_CONFIG.marketing.faq[1].respuesta);
    expect(document.querySelector('.chat-response').textContent).toBe(
      'No se pudo registrar el mensaje.'
    );
  });

  it('puede crear y consultar la Campaña Primavera 2026', async () => {
    await signIn('marketing');
    mount();
    app.navigate('marketing');
    click('[data-action="marketing-section"][data-section="campaigns"]');

    const form = document.querySelector('#campaign-form');
    form.querySelector('[name="name"]').value = 'Campaña Primavera 2026';
    form.querySelector('[name="stage"]').value = 'prospecto';
    form.querySelector('[name="startDate"]').value = localTodayISO();
    form.querySelector('[name="endDate"]').value = futureDate();
    submit('#campaign-form');

    expect(document.querySelector('.campaign-list').textContent).toContain(
      'Campaña Primavera 2026'
    );
    expect(
      loadMarketingConfig().campaigns.some((campaign) => campaign.name === 'Campaña Primavera 2026')
    ).toBe(true);

    click('[data-action="marketing-section"][data-section="performance"]');
    expect(document.querySelector('.marketing-performance')).toBeTruthy();
  });

  it('puede ver fichas y leer el equipo sin controles de gestión', async () => {
    const entity = addEntity(entityData('Comercial Andina SpA', 3));
    addDocument({
      entity_id: entity.entity_id,
      status: 'cerrado ganado',
      importe: 1250,
      startDate: localTodayISO(),
      notes: 'Venta del mes',
      assignedUserIdAtSale: 'user-ventas',
    });
    const config = loadMarketingConfig();
    saveMarketingConfig({
      ...config,
      salesTeams: [
        {
          id: 'team-n3',
          name: 'Equipo Norte',
          members: [
            {
              id: 'member-n3',
              name: 'Pedro Soto',
              role: 'Ejecutivo de Ventas',
              active: true,
              userId: 'user-ventas',
            },
          ],
        },
      ],
    });
    await signIn('marketing');
    mount();

    openDetail('Comercial Andina SpA');
    expect(document.querySelector('#entity-detail-title').textContent).toBe('Comercial Andina SpA');

    app.navigate('marketing');
    expect(document.querySelector('.team-totals').textContent).toContain('Real mensual');
    expect(document.querySelector('.member-list').textContent).toContain('Real $1250.00');
    expect(document.querySelector('#team-form')).toBeNull();
    expect(document.querySelector('#team-member-form')).toBeNull();
    expect(document.querySelector('[data-action="delete-team"]')).toBeNull();
  });

  it('no ofrece control para eliminar clientes', async () => {
    const entity = addEntity(entityData('Comercial Andina SpA', 4));
    await signIn('marketing');
    mount();
    app.navigate('search');

    expect(
      document.querySelector(`[data-action="delete-entity"][data-id="${entity.id}"]`),
      'N3 no debe ver el botón de eliminar cliente'
    ).toBeNull();
  });

  it('la capa de datos rechaza eliminar clientes', async () => {
    const entity = addEntity(entityData('Comercial Andina SpA', 5));
    await signIn('marketing');
    mount();

    expect(() => deleteEntity(entity.id)).toThrow(MESSAGES.permissionDenied);
    expect(loadEntities().some((item) => item.id === entity.id)).toBe(true);
  });

  it('no ofrece controles para abrir el resumen', async () => {
    await signIn('marketing');
    mount();
    app.navigate('summary');

    expect(document.querySelector('#route-notice')).toBeTruthy();
    expect(document.querySelector('#route-notice').textContent).toBe(MESSAGES.accessDenied);
    expect(document.querySelector('.commercial-summary')).toBeNull();
    expect(document.querySelector('.dashboard')).toBeTruthy();
  });

  it('no puede crear integrantes desde la interfaz (team:manage no autorizado)', async () => {
    await signIn('marketing');
    mount();
    app.navigate('marketing');

    expect(
      document.querySelector('#team-member-form'),
      'N3 no debe ver el formulario de integrantes'
    ).toBeNull();
    expect(can('n3_marketing', 'team:manage')).toBe(false);
    expect(() => saveMarketingConfig({ ...loadMarketingConfig() })).not.toThrow();
  });

  it('no puede detener una campaña ajena', async () => {
    const campaign = {
      id: 'camp-n3-foreign',
      name: 'Campaña de otro usuario',
      stage: 'prospecto',
      startDate: localTodayISO(),
      endDate: futureDate(),
      status: 'activa',
      createdByUserId: 'user-ana-munoz',
      action: 'create_document',
    };
    saveMarketingConfig({ ...loadMarketingConfig(), campaigns: [campaign] });
    await signIn('marketing');
    mount();
    app.navigate('marketing');
    click('[data-action="marketing-section"][data-section="campaigns"]');

    const stopButton = document.querySelector(
      `[data-action="stop-campaign"][data-id="${campaign.id}"]`
    );
    if (stopButton) {
      stopButton.click();
      expect(document.querySelector('#route-notice')?.textContent).toContain(
        MESSAGES.permissionDenied
      );
    } else {
      expect(stopButton).toBeNull();
    }
    expect(
      stopCampaign(campaign.id, loadMarketingConfig().campaigns).find(
        (item) => item.id === campaign.id
      ).status
    ).toBe('detenida');
    expect(loadMarketingConfig().campaigns.find((item) => item.id === campaign.id).status).toBe(
      'activa'
    );
  });

  it('no puede gestionar usuarios ni modificar entidades por llamada directa', async () => {
    await signIn('marketing');
    mount();

    expect(document.querySelector('[data-action="navigate"][data-view="users-admin"]')).toBeNull();
    app.navigate('users-admin');
    expect(document.querySelector('#route-notice').textContent).toBe(MESSAGES.accessDenied);
    expect(document.querySelector('.users-admin-view')).toBeNull();

    const entitiesBefore = localStorage.getItem('erp_entities');
    expect(() => addEntity(entityData('Cliente N3', 6))).toThrow(MESSAGES.permissionDenied);
    expect(() => saveEntities([])).toThrow(MESSAGES.permissionDenied);
    expect(localStorage.getItem('erp_entities')).toBe(entitiesBefore);
  });
});
