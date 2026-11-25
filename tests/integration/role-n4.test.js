import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { initApp } from '../../src/app.js';
import { signIn, seedAuth } from '../helpers/auth-session.js';
import { listUsers, logout } from '../../src/auth.js';
import {
  addDocument,
  addEntity,
  loadEntities,
  loadMarketingConfig,
  saveMarketingConfig,
} from '../../src/storage.js';
import { assertPermission, can } from '../../src/auth/permissions.js';
import { MESSAGES } from '../../src/utils/messages.js';
import { formatRut } from '../../src/utils/field-formats.js';
import { localTodayISO } from '../../src/utils/entity-date.js';

let app;

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

function entityData(name, index) {
  return {
    name,
    code: `N4-${index}`,
    targetDate: '1980-05-05',
    rut: formatRut(11000000 + index),
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

describe('Permisos de Nivel 4 - Gerente comercial', () => {
  beforeEach(() => {
    seedAuth();
    setSearch('');
  });

  afterEach(() => {
    app?.destroy();
    app = null;
    setSearch('');
  });

  it('puede eliminar el cliente Comercial Andina SpA', async () => {
    await signIn('gerente');
    const entity = addEntity(entityData('Comercial Andina SpA', 1));
    mount();

    app.navigate('search');
    click(`[data-action="edit-entity"][data-id="${entity.id}"]`);
    click(`[data-action="delete-entity"][data-id="${entity.id}"]`);

    expect(loadEntities().some((item) => item.id === entity.id)).toBe(false);
  });

  it('puede ver el resumen completo de pendientes del equipo', async () => {
    await signIn('gerente');
    const first = addEntity(entityData('Comercial Andina SpA', 2));
    const second = addEntity(entityData('Ferretería Central', 3));
    addDocument({
      entity_id: first.entity_id,
      status: 'pendiente',
      notes: 'Pendiente N4 A',
      importe: 100,
    });
    addDocument({
      entity_id: first.entity_id,
      status: 'pendiente',
      notes: 'Pendiente N4 B',
      importe: 200,
    });
    addDocument({
      entity_id: second.entity_id,
      status: 'pendiente',
      notes: 'Pendiente N4 C',
      importe: 300,
    });
    mount();

    app.navigate('summary');

    expect(document.querySelector('.commercial-summary')).toBeTruthy();
    const text = document.querySelector('.commercial-summary').textContent;
    expect(text).toContain('Comercial Andina SpA');
    expect(text).toContain('Ferretería Central');
    const values = [...document.querySelectorAll('.commercial-summary .stat-card .stat-value')].map(
      (element) => element.textContent
    );
    expect(values[2]).toBe('3');
  });

  it('puede crear y editar equipos e integrantes', async () => {
    await signIn('gerente');
    mount();
    app.navigate('marketing');

    const teamForm = document.querySelector('#team-form');
    teamForm.querySelector('[name="teamName"]').value = 'Equipo Norte';
    teamForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    const team = loadMarketingConfig().salesTeams.find((item) => item.name === 'Equipo Norte');
    expect(team).toBeTruthy();
    expect(document.querySelector('.team-list').textContent).toContain('Equipo Norte');

    const memberForm = document.querySelector('#team-member-form');
    memberForm.querySelector('[name="teamId"]').value = team.id;
    memberForm.querySelector('[name="memberName"]').value = 'María González';
    memberForm.querySelector('[name="memberRole"]').value = 'Ejecutivo de Ventas';
    memberForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    expect(document.querySelector('.member-list').textContent).toContain('María González');
    expect(document.querySelector('[data-action="edit-team"]')).toBeTruthy();
    expect(document.querySelector('[data-action="delete-member"]')).toBeTruthy();
  });

  it('puede detener una campaña creada por otra persona', async () => {
    await signIn('gerente');
    const ana = listUsers().find((user) => user.usernameKey === 'ana.munoz') || {
      id: 'user-ana-munoz',
    };
    const campaign = {
      id: 'camp-n4-foreign',
      name: 'Campaña Primavera 2026',
      stage: 'prospecto',
      startDate: localTodayISO(),
      endDate: futureDate(),
      status: 'activa',
      createdByUserId: ana.id,
      action: 'create_document',
    };
    saveMarketingConfig({
      ...loadMarketingConfig(),
      campaigns: [
        ...loadMarketingConfig().campaigns.filter((item) => item.id !== campaign.id),
        campaign,
      ],
    });
    mount();

    app.navigate('marketing');
    click('[data-action="marketing-section"][data-section="campaigns"]');
    click(`[data-action="stop-campaign"][data-id="${campaign.id}"]`);

    expect(loadMarketingConfig().campaigns.find((item) => item.id === campaign.id).status).toBe(
      'detenida'
    );
    expect(document.querySelector('.campaign-list').textContent).toContain('detenida');
  });

  it('puede abrir Gestionar usuarios desde el menú de usuario', async () => {
    await signIn('gerente');
    mount();

    click('[data-action="navigate"][data-view="users-admin"]');

    expect(document.querySelector('.users-admin-view')).toBeTruthy();
    expect(app.getState().view).toBe('users-admin');
  });

  it('no ofrece controles para editar la matriz de permisos', async () => {
    await signIn('gerente');
    mount();
    app.navigate('users-admin');

    const html = document.getElementById('app').innerHTML;
    expect(html).toContain('La matriz de permisos se define en el código');
    expect(document.querySelector('[data-action*="permission"]')).toBeNull();
    expect(
      document.querySelector('input[name^="permission"], select[name^="permission"]')
    ).toBeNull();
    expect(document.getElementById('app').textContent).not.toContain('Editar matriz');
  });

  it('rechaza permissions:edit desde la capa de datos con el mensaje exacto', async () => {
    await signIn('gerente');
    mount();

    expect(can('n4_manager', 'permissions:edit')).toBe(false);
    expect(() => assertPermission('n4_manager', 'permissions:edit')).toThrow(
      MESSAGES.permissionDenied
    );

    const storage = await import('../../src/storage.js');
    const names = [
      'savePermissions',
      'savePermissionMatrix',
      'updatePermissionMatrix',
      'setPermissions',
    ];
    const writer = names
      .map((name) => storage[name])
      .find((candidate) => typeof candidate === 'function');
    expect(writer, 'storage.js debe exponer una escritura de permisos protegida').toBeTypeOf(
      'function'
    );
    expect(() => writer({ n1_support: ['entity:delete'] })).toThrow(MESSAGES.permissionDenied);
    expect(localStorage.getItem('erp_permissions')).toBeNull();
  });

  it('como visitante no puede actuar sobre la capa de datos', async () => {
    await signIn('gerente');
    logout();
    mount();

    expect(document.querySelector('.login-view')).toBeTruthy();
    expect(() => addEntity(entityData('Cliente Visitante', 4))).toThrow(MESSAGES.permissionDenied);
    expect(loadEntities().some((item) => item.name === 'Cliente Visitante')).toBe(false);
  });
});
