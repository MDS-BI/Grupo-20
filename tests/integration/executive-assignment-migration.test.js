import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initApp } from '../../src/app.js';
import { seedAuth } from '../helpers/auth-session.js';
import { signIn } from '../helpers/auth-session.js';
import { createUser, deactivateUser, DEMO_PASSWORD, listUsers } from '../../src/auth.js';
import {
  loadEntities,
  loadDocuments,
  loadMarketingConfig,
  saveDocuments,
  saveEntities,
  saveMarketingConfig,
} from '../../src/storage.js';
import { formatRut } from '../../src/utils/field-formats.js';
import { localTodayISO } from '../../src/utils/entity-date.js';

let app;
let camila;
let lucia;
let sofia;
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

function openDetail(name) {
  app.navigate('search');
  const input = document.querySelector('#search-input');
  input.value = name;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  click('#search-results [data-action="view-entity"]');
}

function legacyEntity(id, name, ejecutivo, index) {
  return {
    id,
    entity_id: `CLI-MIG-${index}`,
    name,
    code: `MIG-${index}`,
    targetDate: '1980-05-05',
    rut: formatRut(16000000 + index),
    canal_contacto: 'llamada',
    contacto_telefono: '+56 9 1234 5678',
    ejecutivo_asignado: ejecutivo,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

describe('Migración de Ejecutivo Asignado', () => {
  beforeEach(async () => {
    seedAuth();
    camila = listUsers().find((user) => user.usernameKey === 'gerente');
    lucia = listUsers().find((user) => user.usernameKey === 'marketing');
    sofia = listUsers().find((user) => user.usernameKey === 'atencion');
    pedro = listUsers().find((user) => user.usernameKey === 'ventas');
    ana = listUsers().find((user) => user.usernameKey === 'ana.munoz');
    if (!ana) {
      ana = await createUser({ username: 'ana.munoz', password: DEMO_PASSWORD, rank: 'n2_sales' });
    }
    saveEntities([]);
    saveDocuments([]);
    saveMarketingConfig({ ...loadMarketingConfig(), salesTeams: [] });
    setSearch('');
  });

  afterEach(() => {
    app?.destroy();
    app = null;
    setSearch('');
  });

  it('migra texto libre a userId de usuarios activos N2/N4 al cargar la aplicación', async () => {
    saveEntities([
      legacyEntity('ent-mig-1', 'Comercial Andina SpA', 'ventas', 1),
      legacyEntity('ent-mig-2', 'Ferretería Central', 'ana.munoz', 2),
      legacyEntity('ent-mig-3', 'Transportes del Norte Ltda.', 'gerente', 3),
      legacyEntity('ent-mig-4', 'Cliente sin ejecutivo', 'María González', 4),
    ]);
    await signIn('gerente');
    mount();

    await vi.waitFor(() =>
      expect(loadEntities().find((entity) => entity.id === 'ent-mig-1').ejecutivo_asignado).toBe(
        pedro.id
      )
    );
    expect(loadEntities().find((entity) => entity.id === 'ent-mig-2').ejecutivo_asignado).toBe(
      ana.id
    );
    expect(loadEntities().find((entity) => entity.id === 'ent-mig-3').ejecutivo_asignado).toBe(
      camila.id
    );
    expect(loadEntities().find((entity) => entity.id === 'ent-mig-4').ejecutivo_asignado).toBe(
      'Sin asignar'
    );
  });

  it('el select de Ejecutivo Asignado ofrece solo usuarios activos N2/N4', async () => {
    await signIn('gerente');
    mount();
    app.navigate('manage-entity');

    const select = document.querySelector('#field-ejecutivo_asignado');
    expect(select?.tagName, 'El ejecutivo asignado debe ser un select').toBe('SELECT');
    const values = [...select.options].map((option) => option.value);
    expect(values).toContain(pedro.id);
    expect(values).toContain(ana.id);
    expect(values).toContain(camila.id);
    expect(values).not.toContain(lucia.id);
    expect(values).not.toContain(sofia.id);
  });

  it('desactivar ana.munoz muestra Sin asignar y la retira del select', async () => {
    saveEntities([legacyEntity('ent-mig-5', 'Ferretería Central', ana.id, 5)]);
    await signIn('gerente');
    mount();
    deactivateUser(ana.id);

    openDetail('Ferretería Central');
    expect(document.querySelector('.entity-detail').textContent).toContain('Sin asignar');

    app.navigate('manage-entity');
    const select = document.querySelector('#field-ejecutivo_asignado');
    expect([...select.options].map((option) => option.value)).not.toContain(ana.id);
  });

  it('conserva las ventas históricas de ana.munoz en el integrante vinculado', async () => {
    const entity = legacyEntity('ent-mig-6', 'Ferretería Central', ana.id, 6);
    saveEntities([entity]);
    saveDocuments([
      {
        id: 'doc-mig-ana',
        entity_id: entity.entity_id,
        type: 'Cerrado ganado',
        status: 'cerrado ganado',
        importe: 250000,
        startDate: localTodayISO(),
        notes: 'Venta histórica ana',
        assignedUserIdAtSale: ana.id,
        createdAt: '2026-11-01T00:00:00.000Z',
        updatedAt: '2026-11-01T00:00:00.000Z',
      },
    ]);
    const config = loadMarketingConfig();
    saveMarketingConfig({
      ...config,
      salesTeams: [
        {
          id: 'team-mig',
          name: 'Equipo Norte',
          members: [
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
    await signIn('gerente');
    mount();
    deactivateUser(ana.id);

    app.navigate('marketing');
    click('[data-action="marketing-section"][data-section="team"]');

    const teamHtml = document.querySelector('.marketing-team').textContent;
    expect(teamHtml).toContain('Ana Muñoz');
    expect(teamHtml).toContain('Real $250000.00');
    expect(loadDocuments().find((doc) => doc.id === 'doc-mig-ana').assignedUserIdAtSale).toBe(
      ana.id
    );

    openDetail('Ferretería Central');
    expect(document.querySelector('.entity-detail').textContent).toContain('Sin asignar');
  });
});
