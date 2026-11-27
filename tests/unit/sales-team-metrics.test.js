import { afterEach, describe, expect, it, vi } from 'vitest';
import { computeSalesTeamMetrics } from '../../src/utils/sales-team-metrics.js';
import { createUser, deactivateUser, listUsers, updateUser } from '../../src/auth.js';
import { seedAuth } from '../helpers/auth-session.js';

afterEach(() => {
  vi.restoreAllMocks();
});

function sampleTeams() {
  return [
    {
      id: 'equipo-1',
      name: 'Ventas Norte',
      members: [
        { id: 'ana', name: 'Ana', role: 'Ejecutiva', active: true },
        { id: 'bruno', name: 'Bruno', role: 'Ejecutivo', active: true },
      ],
    },
  ];
}

function sampleEntities() {
  return [
    { entity_id: 'e1', ejecutivo_asignado: 'Ana' },
    { entity_id: 'e2', ejecutivo_asignado: 'Bruno' },
    { entity_id: 'e3', ejecutivo_asignado: 'Ana' },
  ];
}

function deepFreeze(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

describe('Métricas del equipo de ventas (T094/T096)', () => {
  it('suma las ventas cerradas del mes por ejecutivo', () => {
    const now = new Date(2026, 0, 15);
    const documents = [
      {
        id: 'd1',
        entity_id: 'e1',
        status: 'cerrado ganado',
        startDate: '2026-01-02',
        importe: 100,
      },
      { id: 'd2', entity_id: 'e1', status: 'CERRADO GANADO', startDate: '2026-01-14', importe: 50 },
      {
        id: 'd3',
        entity_id: 'e2',
        status: 'Cerrado Ganado',
        startDate: '2026-01-15',
        importe: 200,
      },
      {
        id: 'd4',
        entity_id: 'e3',
        status: 'cerrado perdido',
        startDate: '2026-01-03',
        importe: 999,
      },
      {
        id: 'd5',
        entity_id: 'e3',
        status: 'cerrado ganado',
        startDate: '2025-12-31',
        importe: 777,
      },
      {
        id: 'd6',
        entity_id: 'e3',
        status: 'cerrado ganado',
        startDate: '2026-02-01',
        importe: 888,
      },
      {
        id: 'd7',
        entity_id: 'desconocida',
        status: 'cerrado ganado',
        startDate: '2026-01-05',
        importe: 500,
      },
      {
        id: 'd8',
        entity_id: 'e1',
        status: 'cerrado ganado',
        startDate: '2026-01-06',
        importe: 'abc',
      },
    ];

    const result = computeSalesTeamMetrics({
      teams: sampleTeams(),
      entities: sampleEntities(),
      documents,
      now,
    });

    expect(result.teams).toHaveLength(1);
    expect(result.teams[0].members.map((member) => [member.name, member.realMonthly])).toEqual([
      ['Ana', 150],
      ['Bruno', 200],
    ]);
    expect(result.totals.realMonthly).toBe(350);
  });

  it('proyecta el objetivo mensual con dos decimales', () => {
    const now = new Date(2026, 0, 10);
    const entities = [...sampleEntities(), { entity_id: 'e4', ejecutivo_asignado: 'Bruno' }];
    const documents = [
      { entity_id: 'e1', status: 'cerrado ganado', startDate: '2026-01-04', importe: 1000 },
      { entity_id: 'e4', status: 'cerrado ganado', startDate: '2026-01-05', importe: 33.33 },
    ];

    const result = computeSalesTeamMetrics({
      teams: sampleTeams(),
      entities,
      documents,
      now,
    });

    expect(result.teams[0].members.map((member) => member.monthlyGoal)).toEqual([3100, 103.32]);
    expect(result.teams[0].realMonthly).toBe(1033.33);
    expect(result.teams[0].monthlyGoal).toBe(3203.32);
    expect(result.totals).toEqual({ realMonthly: 1033.33, monthlyGoal: 3203.32 });
  });

  it('devuelve ceros sin ventas y cuando no hay días transcurridos', () => {
    const now = new Date(2026, 1, 14);
    const empty = computeSalesTeamMetrics({
      teams: sampleTeams(),
      entities: sampleEntities(),
      now,
    });
    expect(
      empty.teams[0].members.every((member) => member.realMonthly === 0 && member.monthlyGoal === 0)
    ).toBe(true);
    expect(empty.teams[0]).toMatchObject({ realMonthly: 0, monthlyGoal: 0 });
    expect(empty.totals).toEqual({ realMonthly: 0, monthlyGoal: 0 });

    const noDays = computeSalesTeamMetrics({
      teams: sampleTeams(),
      entities: sampleEntities(),
      documents: [
        { entity_id: 'e1', status: 'cerrado ganado', startDate: '2026-01-02', importe: 500 },
      ],
      now: {
        getDate: () => 0,
        getFullYear: () => 2026,
        getMonth: () => 0,
      },
    });
    expect(noDays.totals.realMonthly).toBe(500);
    expect(noDays.teams[0].monthlyGoal).toBe(0);
    expect(noDays.totals.monthlyGoal).toBe(0);
  });

  it('agrupa por equipo e ignora a los integrantes inactivos en los totales', () => {
    const now = new Date(2026, 0, 10);
    const teams = [
      {
        id: 'equipo-1',
        name: 'Ventas Norte',
        members: [
          { id: 'ana', name: 'Ana', role: 'Ejecutiva', active: true },
          { id: 'bruno', name: 'Bruno', role: 'Ejecutivo', active: false },
        ],
      },
      {
        id: 'equipo-2',
        name: 'Ventas Sur',
        members: [{ id: 'carlos', name: 'Carlos', role: 'Ejecutivo', active: true }],
      },
    ];
    const entities = [...sampleEntities(), { entity_id: 'e4', ejecutivo_asignado: 'Carlos' }];
    const documents = [
      { entity_id: 'e1', status: 'cerrado ganado', startDate: '2026-01-02', importe: 100 },
      { entity_id: 'e2', status: 'cerrado ganado', startDate: '2026-01-03', importe: 900 },
      { entity_id: 'e4', status: 'cerrado ganado', startDate: '2026-01-04', importe: 50 },
    ];

    const result = computeSalesTeamMetrics({ teams, entities, documents, now });

    expect(result.teams.map((team) => [team.id, team.name, team.realMonthly])).toEqual([
      ['equipo-1', 'Ventas Norte', 100],
      ['equipo-2', 'Ventas Sur', 50],
    ]);
    expect(result.teams[0].members[1]).toEqual({
      id: 'bruno',
      name: 'Bruno',
      role: 'Ejecutivo',
      active: false,
      realMonthly: 0,
      monthlyGoal: 0,
    });
    expect(result.teams.map((team) => team.monthlyGoal)).toEqual([310, 155]);
    expect(result.totals).toEqual({ realMonthly: 150, monthlyGoal: 465 });
  });

  it('usa member.executive como alternativa al nombre del integrante', () => {
    const result = computeSalesTeamMetrics({
      teams: [
        {
          id: 'equipo-1',
          name: 'Ventas Norte',
          members: [
            { id: 'ana', name: 'Ana Torres', executive: 'Ana', role: 'Ejecutiva', active: true },
          ],
        },
      ],
      entities: sampleEntities(),
      documents: [
        { entity_id: 'e1', status: 'cerrado ganado', startDate: '2026-01-02', importe: 75 },
      ],
      now: new Date(2026, 0, 10),
    });
    expect(result.teams[0].members[0].realMonthly).toBe(75);
  });

  it('no muta las entradas ni persiste datos', () => {
    const args = deepFreeze({
      teams: sampleTeams(),
      entities: sampleEntities(),
      documents: [
        { entity_id: 'e1', status: 'cerrado ganado', startDate: '2026-01-02', importe: 100 },
      ],
    });
    const before = JSON.stringify(args);
    const setItem = vi.spyOn(localStorage, 'setItem');

    const result = computeSalesTeamMetrics({ ...args, now: new Date(2026, 0, 10) });

    expect(JSON.stringify(args)).toBe(before);
    expect(result.teams).not.toBe(args.teams);
    expect(result.teams[0].members).not.toBe(args.teams[0].members);
    expect(Object.keys(result).sort()).toEqual(['teams', 'totals']);
    expect(setItem).not.toHaveBeenCalled();
  });
});

describe('Atribución histórica de ventas (FR-077 a FR-079)', () => {
  const now = new Date(2026, 0, 15);

  function teamWith(userId, active = true) {
    return [
      {
        id: 'equipo-norte',
        name: 'Ventas Norte',
        members: [{ id: 'miembro-ana', name: 'Ana Muñoz', role: 'Ejecutiva', active, userId }],
      },
    ];
  }

  function entitiesWith(executive) {
    return [{ entity_id: 'venta-1', ejecutivo_asignado: executive }];
  }

  function wonSale(extra = {}) {
    return {
      entity_id: 'venta-1',
      status: 'cerrado ganado',
      startDate: '2026-01-05',
      importe: 200,
      ...extra,
    };
  }

  it('vincula integrantes por userId y atribuye el ejecutivo_asignado vigente', () => {
    const result = computeSalesTeamMetrics({
      teams: teamWith('user-ana'),
      entities: entitiesWith('user-ana'),
      documents: [wonSale()],
      now,
    });

    expect(result.teams[0].members[0].realMonthly).toBe(200);
    expect(result.totals.realMonthly).toBe(200);
    expect(result.teams[0].monthlyGoal).toBe(413.33);
  });

  it('usa assignedUserIdAtSale antes que el ejecutivo asignado vigente', () => {
    const result = computeSalesTeamMetrics({
      teams: [
        {
          id: 'equipo-norte',
          name: 'Ventas Norte',
          members: [
            {
              id: 'miembro-ana',
              name: 'Ana Muñoz',
              role: 'Ejecutiva',
              active: true,
              userId: 'user-ana',
            },
            {
              id: 'miembro-bruno',
              name: 'Bruno Díaz',
              role: 'Ejecutivo',
              active: true,
              userId: 'user-bruno',
            },
          ],
        },
      ],
      entities: entitiesWith('user-bruno'),
      documents: [wonSale({ assignedUserIdAtSale: 'user-ana', importe: 300 })],
      now,
    });

    expect(result.teams[0].members.map((member) => [member.name, member.realMonthly])).toEqual([
      ['Ana Muñoz', 300],
      ['Bruno Díaz', 0],
    ]);
    expect(result.totals.realMonthly).toBe(300);
  });

  it('conserva las ventas históricas tras cambiar el rango o desactivar al ejecutivo', async () => {
    seedAuth();
    const ana = await createUser({
      username: 'ana.munoz',
      rank: 'n2_sales',
    });
    const teams = teamWith(ana.id);
    const entities = entitiesWith('Sin asignar');
    const documents = [wonSale({ assignedUserIdAtSale: ana.id, importe: 450 })];

    expect(
      computeSalesTeamMetrics({ teams, entities, documents, now }).teams[0].members[0].realMonthly
    ).toBe(450);

    updateUser(ana.id, { rank: 'n1_support' });
    expect(
      computeSalesTeamMetrics({ teams, entities, documents, now }).teams[0].members[0].realMonthly
    ).toBe(450);

    deactivateUser(ana.id);
    expect(
      computeSalesTeamMetrics({ teams, entities, documents, now }).teams[0].members[0].realMonthly
    ).toBe(450);
    expect(documents[0].assignedUserIdAtSale).toBe(ana.id);
    expect(listUsers().find((user) => user.id === ana.id).active).toBe(false);
  });

  it('excluye ventas de entidades archivadas', () => {
    const archivedEntities = [
      { entity_id: 'venta-1', ejecutivo_asignado: 'user-ana', archivedAt: '2026-01-10' },
    ];
    const result = computeSalesTeamMetrics({
      teams: teamWith('user-ana'),
      entities: archivedEntities,
      documents: [wonSale()],
      now,
    });
    expect(result.totals.realMonthly).toBe(0);
    expect(result.teams[0].members[0].realMonthly).toBe(0);
  });

  it('excluye a los integrantes inactivos incluso cuando la venta conserva su userId', () => {
    const result = computeSalesTeamMetrics({
      teams: teamWith('user-ana', false),
      entities: entitiesWith('user-ana'),
      documents: [wonSale({ assignedUserIdAtSale: 'user-ana' })],
      now,
    });

    expect(result.teams[0].members[0].realMonthly).toBe(0);
    expect(result.teams[0].realMonthly).toBe(0);
    expect(result.totals.realMonthly).toBe(0);
  });
});
