import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initApp } from '../../src/app.js';
import { DEMO_PASSWORD, deactivateUser, listUsers, updateUser } from '../../src/auth.js';
import { can, PERMISSION_MATRIX } from '../../src/auth/permissions.js';
import { DEFAULT_CONFIG, MODULE_CONFIG, setActiveConfig } from '../../src/module-config.js';
import {
  addDocument,
  addEntity,
  deleteEntity,
  loadEntities,
  loadMarketingConfig,
  saveMarketingConfig,
  updateDocument,
  updateEntity,
} from '../../src/storage.js';
import { formatRut } from '../../src/utils/field-formats.js';
import { MESSAGES } from '../../src/utils/messages.js';
import { seedAuth, signIn } from '../helpers/auth-session.js';

let app = null;
let sequence = 0;

function setSearch(search = '') {
  window.history.replaceState({}, '', `${window.location.pathname}${search}`);
}

function mount() {
  document.body.innerHTML = '<div id="app"></div>';
  app = initApp({
    mountElement: document.getElementById('app'),
    rawConfig: MODULE_CONFIG,
    enableAuth: true,
  });
  return app;
}

async function mountAs(username) {
  await signIn(username);
  return mount();
}

function click(selector) {
  const element = document.querySelector(selector);
  expect(element, `No se encontró ${selector}`).toBeTruthy();
  element.click();
}

function submitLogin(username, password) {
  document.querySelector('#login-username').value = username;
  document.querySelector('#login-password').value = password;
  document.querySelector('#login-form').dispatchEvent(new Event('submit', { bubbles: true }));
}

function submitUserForm({ username, password, rank }) {
  const form = document.querySelector('#user-form');
  form.querySelector('[name="username"]').value = username;
  form.querySelector('[name="password"]').value = password;
  form.querySelector('[name="rank"]').value = rank;
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}

function validClient(overrides = {}) {
  sequence += 1;
  return {
    name: `Cliente roles ${sequence}`,
    targetDate: '1990-01-01',
    rut: formatRut(55000000 + sequence),
    canal_contacto: 'llamada',
    contacto_telefono: '+56912345678',
    ...overrides,
  };
}

function expectExactDenial(callback) {
  let thrown;
  try {
    callback();
  } catch (error) {
    thrown = error;
  }
  expect(thrown?.message).toBe(MESSAGES.permissionDenied);
}

beforeEach(() => {
  seedAuth();
  setActiveConfig(MODULE_CONFIG);
  setSearch('');
});

afterEach(() => {
  app?.destroy();
  app = null;
  vi.restoreAllMocks();
  setActiveConfig(DEFAULT_CONFIG);
  setSearch('');
  localStorage.clear();
});

describe('Gestor comercial (Nivel 4)', () => {
  it('inicia sesión con la identidad, rango y menú de gerente', async () => {
    mount();
    submitLogin('camila.ramirez', DEMO_PASSWORD);

    await vi.waitFor(() => expect(app.getState().view).toBe('dashboard'));
    expect(document.querySelector('#current-user').textContent).toBe('camila.ramirez');
    expect(document.querySelector('#current-rank').textContent).toBe('Nivel 4 - Gerente comercial');
    expect(
      document.querySelector('[data-action="navigate"][data-view="users-admin"]')
    ).toBeTruthy();
    expect(document.querySelector('[data-action="logout"]')).toBeTruthy();
  });

  it('tiene acceso total en la matriz y puede eliminar y detener campañas ajenas', async () => {
    await signIn('camila.ramirez');
    const lucia = listUsers().find((user) => user.username === 'lucia.fernandez');
    const entity = addEntity(validClient());
    const campaign = {
      id: 'campaign-primavera',
      name: 'Campaña Primavera 2026',
      stage: 'prospecto',
      event: 'document_created',
      action: 'create_document',
      status: 'activa',
      ownerId: lucia.id,
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    };
    saveMarketingConfig({ salesTeams: [], faq: [], campaigns: [campaign] });

    expect(PERMISSION_MATRIX.n4_manager).toEqual(
      expect.arrayContaining([
        'entity:delete',
        'campaign:stop_any',
        'users:manage',
        'team:manage',
        'summary:view_all',
      ])
    );
    expect(can('n4_manager', 'campaign:stop_any')).toBe(true);
    expect(deleteEntity(entity.id)).toEqual({ deletedDocumentCount: 0 });

    await mountAs('camila.ramirez');
    app.navigate('marketing');
    click('[data-section="campaigns"]');
    click(`[data-action="stop-campaign"][data-id="${campaign.id}"]`);
    expect(loadMarketingConfig().campaigns.find((item) => item.id === campaign.id).status).toBe(
      'detenida'
    );
  });

  it('crea usuarios, rechaza duplicados normalizados y desactiva una sesión activa', async () => {
    await mountAs('camila.ramirez');
    app.navigate('users-admin');
    submitUserForm({ username: 'ana.munoz', password: DEMO_PASSWORD, rank: 'n2_sales' });

    await vi.waitFor(() =>
      expect(document.querySelector('.users-admin-view').textContent).toContain('ana.munoz')
    );
    expect(listUsers().find((user) => user.usernameKey === 'ana.munoz').rank).toBe('n2_sales');

    submitUserForm({ username: ' Pedro.Soto ', password: DEMO_PASSWORD, rank: 'n4_manager' });
    await vi.waitFor(() => expect(document.querySelector('#users-admin-error')).toBeTruthy());
    expect(document.querySelector('#users-admin-error').textContent).toBe(MESSAGES.required);
    expect(listUsers().filter((user) => user.usernameKey === 'pedro.soto')).toHaveLength(1);

    const pedro = listUsers().find((user) => user.username === 'pedro.soto');
    deactivateUser(pedro.id);
    expect(listUsers().find((user) => user.id === pedro.id).active).toBe(false);

    const ana = listUsers().find((user) => user.username === 'ana.munoz');
    updateUser(ana.id, { rank: 'n3_marketing' });
    expect(listUsers().find((user) => user.id === ana.id).rank).toBe('n3_marketing');
  });

  it('cierra la sesión desde el menú del usuario', async () => {
    await mountAs('camila.ramirez');
    click('[data-action="logout"]');

    expect(app.getState().view).toBe('login');
    expect(document.querySelector('#current-user')).toBeNull();
  });
});

describe('Ejecutivo de Marketing (Nivel 3)', () => {
  it('accede a Marketing, captura y chat sin poder borrar entidades ni ver resumen', async () => {
    await signIn('camila.ramirez');
    const entity = addEntity(validClient());
    await mountAs('lucia.fernandez');

    expect(document.querySelector('#current-rank').textContent).toBe(
      'Nivel 3 - Ejecutivo de Marketing'
    );
    expect(document.querySelector('[data-action="navigate"][data-view="users-admin"]')).toBeNull();
    app.navigate('marketing');
    expect(app.getState().view).toBe('marketing');
    expect(can('n3_marketing', 'campaign:create')).toBe(true);
    expect(can('n3_marketing', 'marketing:manage')).toBe(true);
    expect(can('n3_marketing', 'chat:answer')).toBe(true);
    expect(can('n3_marketing', 'team:manage')).toBe(false);

    app.navigate('capture');
    expect(document.querySelector('#capture-form')).toBeTruthy();

    expectExactDenial(() => deleteEntity(entity.id));
    expect(loadEntities().some((item) => item.id === entity.id)).toBe(true);

    app.navigate('summary');
    expect(document.querySelector('#route-notice').textContent).toBe(MESSAGES.accessDenied);
    expect(app.getState().view).toBe('dashboard');
  });
});

describe('Ejecutivo de Ventas (Nivel 2)', () => {
  it('edita solo sus clientes y cambia el estado de sus documentos', async () => {
    const pedro = listUsers().find((user) => user.username === 'pedro.soto');
    const camila = listUsers().find((user) => user.username === 'camila.ramirez');
    await signIn('pedro.soto');

    const own = addEntity(validClient({ ownerId: pedro.id }));
    const other = addEntity(validClient({ ownerId: camila.id }));
    const document = addDocument({ entity_id: own.entity_id, status: 'pendiente' });

    expect(can('n2_sales', 'entity:edit_own', { ownerId: pedro.id, userId: pedro.id })).toBe(true);
    expect(can('n2_sales', 'entity:edit_own', { ownerId: camila.id, userId: pedro.id })).toBe(
      false
    );
    expect(
      can('n2_sales', 'document:transition_own', { ownerId: pedro.id, userId: pedro.id })
    ).toBe(true);

    const updated = updateEntity(
      own.id,
      { name: 'Ferretería Central' },
      {
        customFieldDefs: MODULE_CONFIG.customFields.entity,
      }
    );
    expect(updated.name).toBe('Ferretería Central');
    const closed = updateDocument(document.id, { status: 'cerrado ganado' });
    expect(closed.status).toBe('cerrado ganado');

    expectExactDenial(() => updateEntity(other.id, { name: 'Ajeno' }));
    expectExactDenial(() => deleteEntity(other.id));
    expect(loadEntities().find((item) => item.id === other.id).name).not.toBe('Ajeno');
  });

  it('ve su propio resumen pero no Marketing ni gestión de usuarios', async () => {
    const pedro = listUsers().find((user) => user.username === 'pedro.soto');
    await mountAs('pedro.soto');

    app.navigate('summary');
    expect(app.getState().view).toBe('summary');
    expect(can('n2_sales', 'summary:view_own', { userId: pedro.id, ownerId: pedro.id })).toBe(true);
    expect(can('n2_sales', 'summary:view_all')).toBe(false);

    app.navigate('marketing');
    expect(document.querySelector('#route-notice').textContent).toBe(MESSAGES.accessDenied);
    app.navigate('users-admin');
    expect(document.querySelector('#route-notice').textContent).toBe(MESSAGES.accessDenied);
  });
});

describe('Atención al cliente (Nivel 1) y visitante', () => {
  it('puede buscar, crear documentos y usar el chat, pero no crear clientes', async () => {
    await signIn('camila.ramirez');
    const camila = listUsers().find((user) => user.username === 'camila.ramirez');
    const entity = addEntity(validClient({ ownerId: camila.id }));
    await mountAs('sofia.torres');

    expect(document.querySelector('#current-rank').textContent).toBe(
      'Nivel 1 - Atención al cliente'
    );
    expect(document.querySelector('[data-action="navigate"][data-view="users-admin"]')).toBeNull();
    app.navigate('search');
    expect(app.getState().view).toBe('search');
    expect(can('n1_support', 'chat:answer')).toBe(true);
    expect(can('n1_support', 'document:transition_own')).toBe(false);

    const created = addDocument({
      entity_id: entity.entity_id,
      tipo_interaccion: 'Llamada',
      notes: 'Confirmación de horario de entrega',
    });
    expect(created.notes).toBe('Confirmación de horario de entrega');

    expectExactDenial(() => addEntity(validClient()));
    expectExactDenial(() => deleteEntity(entity.id));

    app.navigate('capture');
    expect(document.querySelector('#capture-form')).toBeTruthy();
  });

  it('bloquea Resumen, Marketing y usuarios con Acceso denegado', async () => {
    await mountAs('sofia.torres');

    for (const view of ['summary', 'marketing', 'users-admin', 'manage-entity']) {
      app.navigate(view);
      expect(document.querySelector('#route-notice').textContent, view).toBe(MESSAGES.accessDenied);
      expect(app.getState().view).toBe('dashboard');
    }
  });

  it('un visitante sin sesión solo ve login y el formulario público', () => {
    mount();

    expect(app.getState().view).toBe('login');
    expect(document.querySelector('#view-root').textContent).toContain('Iniciar sesión');
    app.navigate('capture');
    expect(app.getState().view).toBe('capture');
    expect(document.querySelector('#capture-form')).toBeTruthy();
    app.navigate('dashboard');
    expect(app.getState().view).toBe('login');
  });
});
