import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { initApp } from '../../src/app.js';
import { signIn, seedAuth } from '../helpers/auth-session.js';
import { createUser, DEMO_PASSWORD, listUsers } from '../../src/auth.js';
import {
  addDocument,
  addEntity,
  deleteEntity,
  loadEntities,
  loadDocuments,
  loadMarketingConfig,
  saveEntities,
  saveMarketingConfig,
  updateEntity,
} from '../../src/storage.js';
import { MESSAGES } from '../../src/utils/messages.js';
import { formatRut } from '../../src/utils/field-formats.js';
import { localTodayISO } from '../../src/utils/entity-date.js';
import { computeSalesTeamMetrics } from '../../src/utils/sales-team-metrics.js';

let app;
let pedro;
let ana;

function setSearch(search = '') {
  window.history.replaceState({}, '', `${window.location.pathname}${search}`);
}

function mount() {
  document.body.innerHTML = '<div id="app"></div>';
  app = initApp(document.getElementById('app'));
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

function entityData(name, index, ejecutivoAsignado = pedro.id) {
  return {
    name,
    code: `N2-${index}`,
    targetDate: '1980-05-05',
    rut: formatRut(13000000 + index),
    canal_contacto: 'llamada',
    contacto_telefono: '+56 9 1234 5678',
    ejecutivo_asignado: ejecutivoAsignado,
    ownerId: ejecutivoAsignado,
  };
}

function setEntityField(name, value) {
  const field = document.querySelector(`#entity-form [name="${name}"]`);
  expect(field, `No se encontró el campo ${name}`).toBeTruthy();
  field.value = value;
  return field;
}

describe('Permisos de Nivel 2 - Ejecutivo de Ventas', () => {
  beforeEach(async () => {
    seedAuth();
    pedro = listUsers().find((user) => user.usernameKey === 'ventas');
    ana = listUsers().find((user) => user.usernameKey === 'ana.munoz');
    if (!ana) {
      ana = await createUser({ username: 'ana.munoz', password: DEMO_PASSWORD, rank: 'n2_sales' });
    }
    setSearch('');
  });

  afterEach(() => {
    app?.destroy();
    app = null;
    setSearch('');
  });

  it('puede crear Ferretería Central consigo mismo como Ejecutivo Asignado', async () => {
    await signIn('ventas');
    mount();
    app.navigate('manage-entity');

    setEntityField('name', 'Ferretería Central');
    setEntityField('rut', formatRut(13000100));
    setEntityField('targetDate', '1980-05-05');
    const canal = setEntityField('canal_contacto', 'llamada');
    canal.dispatchEvent(new Event('change', { bubbles: true }));
    setEntityField('contacto_telefono', '+56 9 1234 5678');

    const executive = document.querySelector('#field-ejecutivo_asignado');
    expect(executive?.tagName, 'El ejecutivo asignado debe ser un select').toBe('SELECT');
    expect(
      [...executive.options].some(
        (option) => option.value === pedro.id && option.textContent.includes('ventas')
      )
    ).toBe(true);
    executive.value = pedro.id;
    submit('#entity-form');

    const created = loadEntities().find((entity) => entity.name === 'Ferretería Central');
    expect(created).toBeTruthy();
    expect(created.ejecutivo_asignado).toBe(pedro.id);
  });

  it('puede editar sus propios clientes desde la interfaz', async () => {
    const entity = addEntity(entityData('Ferretería Central', 1));
    await signIn('ventas');
    mount();
    app.navigate('search');
    click(`[data-action="edit-entity"][data-id="${entity.id}"]`);

    setEntityField('name', 'Ferretería Central Actualizada');
    submit('#entity-form');

    expect(loadEntities().find((item) => item.id === entity.id).name).toBe(
      'Ferretería Central Actualizada'
    );
  });

  it('puede registrar y cambiar el estado de las interacciones de sus clientes', async () => {
    const entity = addEntity(entityData('Ferretería Central', 2));
    await signIn('ventas');
    mount();
    app.navigate('manage-document');

    const selector = document.querySelector('#document-entity-select');
    selector.value = entity.entity_id;
    selector.dispatchEvent(new Event('change', { bubbles: true }));

    const form = document.querySelector('#document-form');
    form.querySelector('[name="type"]').value = 'Llamada';
    form.querySelector('[name="notes"]').value = 'Seguimiento pedro';
    submit('#document-form');

    let created = loadDocuments().find((doc) => doc.notes === 'Seguimiento pedro');
    expect(created).toBeTruthy();
    expect(created.status).toBe('pendiente');

    click(`[data-action="edit-document"][data-id="${created.id}"]`);
    const editForm = document.querySelector('#document-form');
    editForm.querySelector('[name="status"]').value = 'cerrado ganado';
    submit('#document-form');

    created = loadDocuments().find((doc) => doc.id === created.id);
    expect(created.status).toBe('cerrado ganado');
  });

  it('ve solo sus pendientes en el resumen, sin los clientes de ana.munoz', async () => {
    const own = addEntity(entityData('Ferretería Central', 3, pedro.id));
    const other = addEntity(entityData('Transportes del Norte Ltda.', 4, ana.id));
    addDocument({
      entity_id: own.entity_id,
      status: 'pendiente',
      notes: 'Pendiente pedro',
      importe: 100,
    });
    addDocument({
      entity_id: other.entity_id,
      status: 'pendiente',
      notes: 'Pendiente ana',
      importe: 900,
    });
    await signIn('ventas');
    mount();

    app.navigate('summary');

    const summary = document.querySelector('.commercial-summary');
    expect(summary).toBeTruthy();
    expect(summary.textContent).toContain('Ferretería Central');
    expect(summary.textContent).not.toContain('Transportes del Norte Ltda.');
    const values = [...summary.querySelectorAll('.stat-card .stat-value')].map(
      (element) => element.textContent
    );
    expect(values[2]).toBe('1');
  });

  it('ve únicamente su real y objetivo mensuales en Equipo de ventas y logros', async () => {
    const own = addEntity(entityData('Ferretería Central', 5, pedro.id));
    const other = addEntity(entityData('Transportes del Norte Ltda.', 6, ana.id));
    addDocument({
      entity_id: own.entity_id,
      status: 'cerrado ganado',
      importe: 1250,
      startDate: localTodayISO(),
      notes: 'Venta pedro',
      assignedUserIdAtSale: pedro.id,
    });
    addDocument({
      entity_id: other.entity_id,
      status: 'cerrado ganado',
      importe: 99000,
      startDate: localTodayISO(),
      notes: 'Venta ana',
      assignedUserIdAtSale: ana.id,
    });
    const config = loadMarketingConfig();
    saveMarketingConfig({
      ...config,
      salesTeams: [
        {
          id: 'team-n2',
          name: 'Equipo Norte',
          members: [
            {
              id: 'member-pedro',
              name: 'Pedro Soto',
              role: 'Ejecutivo de Ventas',
              active: true,
              userId: pedro.id,
            },
            {
              id: 'member-ana',
              name: 'Ana Muñoz',
              role: 'Ejecutivo de Ventas',
              active: true,
              userId: ana.id,
            },
          ],
        },
      ],
    });
    await signIn('ventas');
    mount();

    app.navigate('marketing');
    expect(document.querySelector('#route-notice').textContent).toBe(MESSAGES.accessDenied);
    expect(document.querySelector('.marketing-team')).toBeNull();

    const teamConfig = loadMarketingConfig();
    const ownTeam = {
      ...teamConfig.salesTeams[0],
      members: teamConfig.salesTeams[0].members.filter((member) => member.userId === pedro.id),
    };
    const metrics = computeSalesTeamMetrics({
      teams: [ownTeam],
      entities: loadEntities(),
      documents: loadDocuments(),
    });
    const ownMember = metrics.teams[0].members[0];
    expect(ownMember.name).toBe('Pedro Soto');
    expect(ownMember.realMonthly).toBe(1250);
    expect(ownMember.monthlyGoal).toBeGreaterThan(0);
    expect(metrics.totals.realMonthly).toBe(1250);
  });

  it('no ofrece controles para eliminar Transportes del Norte Ltda.', async () => {
    addEntity(entityData('Transportes del Norte Ltda.', 7, ana.id));
    await signIn('ventas');
    mount();
    app.navigate('search');

    const rows = [...document.querySelectorAll('#search-results li')];
    const row = rows.find((item) => item.textContent.includes('Transportes del Norte Ltda.'));
    expect(row?.querySelector('[data-action="delete-entity"]')).toBeNull();
  });

  it('la capa de datos rechaza eliminar Transportes del Norte Ltda.', async () => {
    const entity = addEntity(entityData('Transportes del Norte Ltda.', 8, ana.id));
    await signIn('ventas');
    mount();

    expect(() => deleteEntity(entity.id)).toThrow(MESSAGES.permissionDenied);
    expect(loadEntities().some((item) => item.id === entity.id)).toBe(true);
  });

  it('no puede editar clientes de ana.munoz desde la interfaz', async () => {
    const entity = addEntity(entityData('Transportes del Norte Ltda.', 9, ana.id));
    await signIn('ventas');
    mount();
    app.navigate('search');

    expect(
      document.querySelector(`[data-action="edit-entity"][data-id="${entity.id}"]`),
      'N2 no debe ver el botón para editar clientes de ana.munoz'
    ).toBeNull();
    expect(() => updateEntity(entity.id, { name: 'Modificado por pedro' })).toThrow(
      MESSAGES.permissionDenied
    );
    expect(document.querySelector('#entity-form')).toBeNull();
  });

  it('la capa de datos rechaza editar clientes de ana.munoz', async () => {
    const entity = addEntity(entityData('Transportes del Norte Ltda.', 10, ana.id));
    await signIn('ventas');
    mount();

    expect(() => updateEntity(entity.id, { name: 'Modificado por pedro' })).toThrow(
      MESSAGES.permissionDenied
    );
  });

  it('la capa de datos rechaza escritura directa con el mensaje exacto', async () => {
    await signIn('ventas');
    mount();
    const created = addEntity(entityData('Cliente directo N2', 11));
    expect(created.ownerId).toBe(pedro.id);
    const afterCreate = localStorage.getItem('erp_entities');

    expect(() => saveEntities([])).toThrow(MESSAGES.permissionDenied);
    expect(localStorage.getItem('erp_entities')).toBe(afterCreate);
  });
});
