import { describe, expect, it } from 'vitest';
import { PERMISSION_MATRIX, ROLES, assertPermission, can } from '../../src/auth/permissions.js';

const DENIAL_MESSAGE = 'No tienes permiso para realizar esta acción';
const POSTVENTA_ACTIONS = [
  'postventa:view',
  'postventa:view_own',
  'postventa:create',
  'postventa:transition',
];

describe('Acciones canónicas de Postventa (T196)', () => {
  it('incorpora las cuatro acciones a la matriz de N4 y al catálogo de rangos', () => {
    for (const action of POSTVENTA_ACTIONS) {
      expect(PERMISSION_MATRIX.n4_manager, action).toContain(action);
    }
    expect([...ROLES].sort()).toEqual([
      'n1_support',
      'n2_sales',
      'n3_marketing',
      'n4_manager',
      'visitor',
    ]);
  });

  it('N4 y N1 crean y cambian cualquier estado sin document:edit_any para N1', () => {
    for (const role of ['n4_manager', 'n1_support']) {
      expect(can(role, 'postventa:view')).toBe(true);
      expect(can(role, 'postventa:create')).toBe(true);
      expect(can(role, 'postventa:transition')).toBe(true);
    }
    expect(can('n1_support', 'postventa:view_own')).toBe(false);
    expect(can('n1_support', 'document:edit_any')).toBe(false);
  });

  it('N2 solo consulta sus propios tickets con ownerId', () => {
    expect(can('n2_sales', 'postventa:view_own', { userId: 'user-ana', ownerId: 'user-ana' })).toBe(
      true
    );
    expect(can('n2_sales', 'postventa:view_own', { userId: 'user-ana' })).toBe(false);
    expect(
      can('n2_sales', 'postventa:view_own', { userId: 'user-ana', ownerId: 'user-bruno' })
    ).toBe(false);
    expect(can('n2_sales', 'postventa:view')).toBe(false);
    expect(can('n2_sales', 'postventa:create')).toBe(false);
    expect(can('n2_sales', 'postventa:transition')).toBe(false);
  });

  it('N4 también respeta el contexto propio de postventa:view_own', () => {
    expect(
      can('n4_manager', 'postventa:view_own', { userId: 'user-ana', ownerId: 'user-ana' })
    ).toBe(true);
    expect(
      can('n4_manager', 'postventa:view_own', { userId: 'user-ana', ownerId: 'user-bruno' })
    ).toBe(false);
  });

  it('N3 y visitantes son denegados por defecto con el mensaje exacto', () => {
    for (const role of ['n3_marketing', 'visitor']) {
      for (const action of POSTVENTA_ACTIONS) {
        expect(can(role, action, { userId: 'user-ana', ownerId: 'user-ana' })).toBe(false);
        expect(() =>
          assertPermission(role, action, { userId: 'user-ana', ownerId: 'user-ana' })
        ).toThrow(DENIAL_MESSAGE);
      }
    }
  });
});
