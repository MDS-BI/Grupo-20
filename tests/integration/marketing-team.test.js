import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initApp } from '../../src/app.js';
import { MODULE_CONFIG } from '../../src/module-config.js';
import { addDocument, addEntity, deleteDocument, updateDocument } from '../../src/storage.js';
import { formatRut } from '../../src/seed.js';

const MONTH_START = '2026-11-01';

let app;
let saleIndex;

function mount() {
  document.body.innerHTML = '<div id="app"></div>';
  app = initApp(document.getElementById('app'), { rawConfig: MODULE_CONFIG });
}

function openTeamSection() {
  document.querySelector('[data-action="navigate"][data-view="marketing"]').click();
  const tab = document.querySelector('[data-action="marketing-section"][data-section="team"]');
  tab.click();
  expect(tab.getAttribute('aria-selected')).toBe('true');
  expect(document.querySelector('.marketing-team h2').textContent).toBe(
    'Equipos de ventas y logros'
  );
  expect(document.querySelector('.marketing-view').textContent).not.toContain(
    'Equipo de ventas y logros'
  );
}

function refreshTeamSection() {
  document.querySelector('[data-action="marketing-section"][data-section="team"]').click();
}

function storedTeams() {
  const raw = localStorage.getItem('erp_marketing_config');
  return raw ? JSON.parse(raw).salesTeams : [];
}

function createTeam(name) {
  const form = document.querySelector('#team-form');
  form.querySelector('[name="teamName"]').value = name;
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}

function createMember({ teamId, name, role, active = true }) {
  const form = document.querySelector('#team-member-form');
  form.querySelector('[name="teamId"]').value = teamId;
  form.querySelector('[name="memberName"]').value = name;
  form.querySelector('[name="memberRole"]').value = role;
  form.querySelector('[name="memberActive"]').checked = active;
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}

function teamItem(name) {
  return [...document.querySelectorAll('.team-item')].find(
    (item) => item.querySelector('.list-item-title')?.textContent === name
  );
}

function memberItem(teamName, memberName) {
  const item = teamItem(teamName);
  expect(item).toBeTruthy();
  return [...item.querySelectorAll('.member-item')].find((member) =>
    member.textContent.includes(memberName)
  );
}

function totals() {
  return [...document.querySelectorAll('.team-totals .stat-value')].map((el) => el.textContent);
}

function seedSale(executive, importe, { status = 'cerrado ganado', startDate = MONTH_START } = {}) {
  saleIndex += 1;
  const suffix = String(saleIndex);
  const entity = addEntity({
    name: `Cliente Venta ${suffix}`,
    code: `MKT-TEAM-${suffix}`,
    targetDate: '1980-05-05',
    rut: formatRut(`1111111${suffix}`),
    canal_contacto: 'correo',
    contacto_correo: `venta${suffix}@ejemplo.cl`,
    ejecutivo_asignado: executive,
  });
  return addDocument({
    entity_id: entity.entity_id,
    status,
    importe,
    startDate,
    notes: `Venta ${suffix}`,
  });
}

describe('Equipo de ventas y logros en Marketing (T095)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 15, 12, 0, 0));
    saleIndex = 0;
    mount();
    openTeamSection();
  });

  afterEach(() => {
    app?.destroy();
    vi.useRealTimers();
  });

  it('abre la sección con estado vacío y crea y elimina el primer equipo y su integrante', () => {
    expect(document.querySelector('.marketing-team .empty-state').textContent).toBe(
      'Aún no hay equipos de ventas registrados.'
    );
    expect(totals()).toEqual(['$0.00', '$0.00']);
    expect(document.querySelector('#team-form')).toBeTruthy();
    expect(document.querySelector('#team-member-form')).toBeTruthy();
    expect(storedTeams()).toEqual([]);

    createTeam('Equipo Norte');
    expect(localStorage.getItem('erp_marketing_config')).toBeTruthy();
    expect(storedTeams()).toHaveLength(1);
    expect(teamItem('Equipo Norte')).toBeTruthy();
    expect(document.querySelector('.team-item .empty-state').textContent).toBe(
      'Este equipo aún no tiene integrantes.'
    );

    const teamId = storedTeams()[0].id;
    createMember({ teamId, name: 'Ana Torres', role: 'Ejecutiva', active: true });
    expect(storedTeams()[0].members).toEqual([
      expect.objectContaining({ name: 'Ana Torres', role: 'Ejecutiva', active: true }),
    ]);
    expect(memberItem('Equipo Norte', 'Ana Torres').textContent).toContain(
      'Ana Torres · Ejecutiva · Activo'
    );
    expect(document.querySelector('.member-list .empty-state')).toBeNull();

    const memberId = storedTeams()[0].members[0].id;
    document
      .querySelector(
        `[data-action="delete-member"][data-team-id="${teamId}"][data-id="${memberId}"]`
      )
      .click();
    expect(storedTeams()[0].members).toEqual([]);
    expect(document.querySelector('.team-item .empty-state').textContent).toBe(
      'Este equipo aún no tiene integrantes.'
    );

    document.querySelector(`[data-action="delete-team"][data-id="${teamId}"]`).click();
    expect(storedTeams()).toEqual([]);
    expect(document.querySelector('.marketing-team .empty-state').textContent).toBe(
      'Aún no hay equipos de ventas registrados.'
    );
  });

  it('edita equipos e integrantes con nombre, cargo y Activo/Inactivo y elimina equipos', () => {
    createTeam('Equipo Alfa');
    createTeam('Equipo Beta');
    expect(storedTeams().map((team) => team.name)).toEqual(['Equipo Alfa', 'Equipo Beta']);
    expect(
      [...document.querySelectorAll('#team-member-form [name="teamId"] option')].map(
        (option) => option.value
      )
    ).toEqual(['', storedTeams()[0].id, storedTeams()[1].id]);

    const firstId = storedTeams()[0].id;
    document.querySelector(`[data-action="edit-team"][data-id="${firstId}"]`).click();
    expect(document.querySelector('#team-form [name="teamName"]').value).toBe('Equipo Alfa');
    expect(document.querySelector('#team-form button[type="submit"]').textContent).toBe(
      'Guardar equipo'
    );
    document.querySelector('#team-form [name="teamName"]').value = 'Equipo Alfa Norte';
    document
      .querySelector('#team-form')
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(storedTeams()[0]).toMatchObject({ id: firstId, name: 'Equipo Alfa Norte' });
    expect(teamItem('Equipo Alfa Norte')).toBeTruthy();
    expect(teamItem('Equipo Alfa')).toBeUndefined();

    createMember({ teamId: firstId, name: 'Ana Torres', role: 'Ejecutiva', active: true });
    const memberId = storedTeams()[0].members[0].id;
    expect(memberItem('Equipo Alfa Norte', 'Ana Torres').textContent).toContain(
      'Ana Torres · Ejecutiva · Activo'
    );
    const editMemberButton = document.querySelector(
      `[data-action="edit-member"][data-team-id="${firstId}"][data-id="${memberId}"]`
    );
    expect(editMemberButton).toBeTruthy();
    editMemberButton.click();
    expect(document.querySelector('#team-member-form [name="teamId"]').value).toBe(firstId);
    expect(document.querySelector('#team-member-form [name="memberName"]').value).toBe(
      'Ana Torres'
    );
    expect(document.querySelector('#team-member-form [name="memberRole"]').value).toBe('Ejecutiva');
    expect(document.querySelector('#team-member-form [name="memberActive"]').checked).toBe(true);
    document.querySelector('#team-member-form [name="memberRole"]').value = 'Gerente comercial';
    document.querySelector('#team-member-form [name="memberActive"]').checked = false;
    document
      .querySelector('#team-member-form')
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(storedTeams()[0].members).toEqual([
      expect.objectContaining({
        id: memberId,
        name: 'Ana Torres',
        role: 'Gerente comercial',
        active: false,
      }),
    ]);
    expect(memberItem('Equipo Alfa Norte', 'Ana Torres').textContent).toContain(
      'Ana Torres · Gerente comercial · Inactivo'
    );

    document.querySelector(`[data-action="delete-team"][data-id="${storedTeams()[1].id}"]`).click();
    expect(storedTeams().map((team) => team.name)).toEqual(['Equipo Alfa Norte']);
    expect(teamItem('Equipo Beta')).toBeUndefined();
    document.querySelector(`[data-action="delete-team"][data-id="${firstId}"]`).click();
    expect(storedTeams()).toEqual([]);
  });

  it('conserva equipos e integrantes en erp_marketing_config al remontar la aplicación', () => {
    createTeam('Equipo Persistente');
    const teamId = storedTeams()[0].id;
    createMember({ teamId, name: 'Berta Ruiz', role: 'Ejecutiva', active: false });
    const before = localStorage.getItem('erp_marketing_config');

    app.destroy();
    mount();
    openTeamSection();

    expect(localStorage.getItem('erp_marketing_config')).toBe(before);
    expect(teamItem('Equipo Persistente')).toBeTruthy();
    expect(memberItem('Equipo Persistente', 'Berta Ruiz').textContent).toContain(
      'Berta Ruiz · Ejecutiva · Inactivo'
    );
  });

  it('calcula el real y el objetivo mensuales desde documentos Cerrado ganado del mes del ejecutivo', () => {
    createTeam('Equipo Norte');
    const teamId = storedTeams()[0].id;
    createMember({ teamId, name: 'Ana Torres', role: 'Ejecutiva', active: true });
    createMember({ teamId, name: 'Luis Pérez', role: 'Soporte', active: false });

    const firstSale = seedSale('Ana Torres', 100);
    seedSale('Ana Torres', 250);
    seedSale('Luis Pérez', 900);
    seedSale('Otro Ejecutivo', 500);
    seedSale('Ana Torres', 777, { startDate: '2026-10-15' });
    seedSale('Ana Torres', 888, { status: 'cerrado perdido' });
    refreshTeamSection();

    expect(totals()).toEqual(['$350.00', '$700.00']);
    expect(teamItem('Equipo Norte').querySelector('.team-metric').textContent).toBe(
      'Real $350.00 · Objetivo $700.00'
    );
    expect(memberItem('Equipo Norte', 'Ana Torres').textContent).toContain(
      'Real $350.00 · Objetivo $700.00'
    );
    expect(memberItem('Equipo Norte', 'Luis Pérez').textContent).toContain(
      'Real $0.00 · Objetivo $0.00'
    );

    updateDocument(firstSale.id, { importe: 150 });
    refreshTeamSection();
    expect(totals()).toEqual(['$400.00', '$800.00']);
    expect(memberItem('Equipo Norte', 'Ana Torres').textContent).toContain(
      'Real $400.00 · Objetivo $800.00'
    );

    deleteDocument(firstSale.id);
    refreshTeamSection();
    expect(totals()).toEqual(['$250.00', '$500.00']);
    expect(memberItem('Equipo Norte', 'Ana Torres').textContent).toContain(
      'Real $250.00 · Objetivo $500.00'
    );
  });

  it('muestra real y objetivo solo como cálculo, sin campos para capturarlos', () => {
    createTeam('Equipo Norte');
    const teamId = storedTeams()[0].id;
    createMember({ teamId, name: 'Ana Torres', role: 'Ejecutiva', active: true });
    seedSale('Ana Torres', 120);
    refreshTeamSection();

    const controls = [
      ...document.querySelectorAll(
        '.marketing-team form input, .marketing-team form select, .marketing-team form textarea'
      ),
    ]
      .map((control) => control.name)
      .sort();
    expect(controls).toEqual(['memberActive', 'memberName', 'memberRole', 'teamId', 'teamName']);
    expect(document.querySelector('.marketing-team').innerHTML).not.toMatch(
      /name="[^"]*(real|objetivo|goal|meta)/i
    );

    const stored = localStorage.getItem('erp_marketing_config');
    for (const key of ['realMonthly', 'monthlyGoal', '"real"', '"objetivo"', '"goal"']) {
      expect(stored).not.toContain(key);
    }

    expect(totals()).toEqual(['$120.00', '$240.00']);
    expect(
      memberItem('Equipo Norte', 'Ana Torres').querySelectorAll('input, select, textarea')
    ).toHaveLength(0);
  });
});
