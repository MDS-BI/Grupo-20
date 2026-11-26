import { describe, expect, it } from 'vitest';
import { PERMISSION_MATRIX, ROLES, assertPermission, can } from '../../src/auth/permissions.js';

const CANONICAL_ACTIONS = [
  'panel:view',
  'search:view',
  'entity:view_any',
  'entity:view_own',
  'entity:create',
  'entity:edit_any',
  'entity:edit_own',
  'entity:delete',
  'document:create',
  'document:read',
  'document:edit_any',
  'document:edit_own',
  'document:transition_own',
  'document:delete',
  'summary:view_all',
  'summary:view_own',
  'marketing:view',
  'marketing:manage',
  'postventa:view',
  'postventa:view_own',
  'postventa:create',
  'postventa:transition',
  'team:view_all',
  'team:view_own',
  'team:manage',
  'chat:view',
  'chat:answer',
  'chat:create_query',
  'campaign:create',
  'campaign:view',
  'campaign:edit_own',
  'campaign:stop_own',
  'campaign:stop_any',
  'users:manage',
  'permissions:view',
  'permissions:edit',
];

const DENIAL_MESSAGE = 'No tienes permiso para realizar esta acción';

const PERMISSION_CASES = [
  [
    'panel:view',
    {},
    { n4_manager: true, n3_marketing: true, n2_sales: true, n1_support: true, visitor: false },
  ],
  [
    'search:view',
    {},
    { n4_manager: true, n3_marketing: true, n2_sales: true, n1_support: true, visitor: false },
  ],
  [
    'entity:create',
    {},
    { n4_manager: true, n3_marketing: false, n2_sales: true, n1_support: false, visitor: false },
  ],
  [
    'entity:edit_any',
    {},
    { n4_manager: true, n3_marketing: false, n2_sales: false, n1_support: false, visitor: false },
  ],
  [
    'entity:delete',
    {},
    { n4_manager: true, n3_marketing: false, n2_sales: false, n1_support: false, visitor: false },
  ],
  [
    'document:create',
    {},
    { n4_manager: true, n3_marketing: true, n2_sales: true, n1_support: true, visitor: false },
  ],
  [
    'document:edit_any',
    {},
    { n4_manager: true, n3_marketing: true, n2_sales: false, n1_support: false, visitor: false },
  ],
  [
    'summary:view_all',
    {},
    { n4_manager: true, n3_marketing: false, n2_sales: false, n1_support: false, visitor: false },
  ],
  [
    'marketing:view',
    {},
    { n4_manager: true, n3_marketing: true, n2_sales: false, n1_support: false, visitor: false },
  ],
  [
    'marketing:manage',
    {},
    { n4_manager: true, n3_marketing: true, n2_sales: false, n1_support: false, visitor: false },
  ],
  [
    'team:manage',
    {},
    { n4_manager: true, n3_marketing: false, n2_sales: false, n1_support: false, visitor: false },
  ],
  [
    'chat:view',
    {},
    { n4_manager: true, n3_marketing: true, n2_sales: false, n1_support: true, visitor: false },
  ],
  [
    'chat:answer',
    {},
    { n4_manager: true, n3_marketing: true, n2_sales: false, n1_support: true, visitor: false },
  ],
  [
    'chat:create_query',
    {},
    { n4_manager: true, n3_marketing: true, n2_sales: true, n1_support: true, visitor: true },
  ],
  [
    'campaign:create',
    {},
    { n4_manager: true, n3_marketing: true, n2_sales: false, n1_support: false, visitor: false },
  ],
  [
    'campaign:view',
    {},
    { n4_manager: true, n3_marketing: true, n2_sales: false, n1_support: false, visitor: false },
  ],
  [
    'campaign:stop_any',
    {},
    { n4_manager: true, n3_marketing: false, n2_sales: false, n1_support: false, visitor: false },
  ],
  [
    'users:manage',
    {},
    { n4_manager: true, n3_marketing: false, n2_sales: false, n1_support: false, visitor: false },
  ],
  [
    'permissions:view',
    {},
    { n4_manager: true, n3_marketing: false, n2_sales: false, n1_support: false, visitor: false },
  ],
];

describe('Matriz única de permisos', () => {
  it('expone los rangos canónicos y solo acciones del catálogo', () => {
    expect([...ROLES].sort()).toEqual(
      ['n1_support', 'n2_sales', 'n3_marketing', 'n4_manager', 'visitor'].sort()
    );
    expect(Object.keys(PERMISSION_MATRIX).sort()).toEqual([...ROLES].sort());
    expect(CANONICAL_ACTIONS).toContain('permissions:edit');

    for (const role of ROLES) {
      for (const action of PERMISSION_MATRIX[role]) {
        expect(CANONICAL_ACTIONS, `${role} declare la acción ${action}`).toContain(action);
      }
      expect(PERMISSION_MATRIX[role]).not.toContain('permissions:edit');
    }
  });

  it.each(PERMISSION_CASES)('%s respeta el rango', (action, context, expectedByRole) => {
    for (const role of ROLES) {
      expect(can(role, action, context), `${role} / ${action}`).toBe(expectedByRole[role]);
    }
  });

  it('deniega por defecto rangos, acciones y contexto desconocidos', () => {
    expect(can('Sistema', 'panel:view')).toBe(false);
    expect(can('desconocido', 'panel:view')).toBe(false);
    expect(can(undefined, 'panel:view')).toBe(false);
    expect(can('n4_manager', 'accion:inexistente')).toBe(false);
    expect(ROLES).not.toContain('Sistema');
  });

  it('nunca permite editar la matriz, ni siquiera para N4 o Sistema', () => {
    for (const role of [...ROLES, 'Sistema']) {
      expect(can(role, 'permissions:edit', { actor: 'Sistema' })).toBe(false);
    }
    expect(() => assertPermission('n4_manager', 'permissions:edit')).toThrow(DENIAL_MESSAGE);
  });

  it('lanza el mensaje exacto de denegación y confirma las acciones permitidas', () => {
    expect(() => assertPermission('visitor', 'panel:view')).toThrow(DENIAL_MESSAGE);
    expect(() => assertPermission('n2_sales', 'users:manage')).toThrow(DENIAL_MESSAGE);
    expect(assertPermission('n4_manager', 'panel:view')).toBe(true);
  });
});

describe('Acciones con contexto de propiedad', () => {
  const OWN_CASES = [
    ['entity:edit_own', 'ownerId', 'n2_sales'],
    ['document:edit_own', 'ownerId', 'n2_sales'],
    ['document:transition_own', 'ownerId', 'n2_sales'],
    ['summary:view_own', 'ownerId', 'n2_sales'],
    ['team:view_own', 'ownerId', 'n2_sales'],
    ['campaign:edit_own', 'campaignOwnerId', 'n3_marketing'],
    ['campaign:stop_own', 'campaignOwnerId', 'n3_marketing'],
  ];

  it.each(OWN_CASES)('%s solo se permite con el contexto propio', (action, ownerKey, role) => {
    expect(can(role, action, { userId: 'user-ana', [ownerKey]: 'user-ana' })).toBe(true);
    expect(can(role, action, { userId: 'user-ana' })).toBe(false);
    expect(can(role, action, { [ownerKey]: 'user-ana' })).toBe(false);
    expect(can(role, action, { userId: 'user-ana', [ownerKey]: 'user-bruno' })).toBe(false);
    expect(() => assertPermission(role, action, { userId: 'user-ana' })).toThrow(DENIAL_MESSAGE);
  });

  it('no sustituye campaignOwnerId por ownerId en campañas', () => {
    expect(
      can('n3_marketing', 'campaign:stop_own', { userId: 'user-ana', campaignOwnerId: 'user-ana' })
    ).toBe(true);
    expect(
      can('n3_marketing', 'campaign:stop_own', { userId: 'user-ana', ownerId: 'user-ana' })
    ).toBe(false);
  });

  it('aplica las reglas de propiedad también a N4', () => {
    expect(can('n4_manager', 'entity:edit_own', { userId: 'user-ana', ownerId: 'user-ana' })).toBe(
      true
    );
    expect(
      can('n4_manager', 'entity:edit_own', { userId: 'user-ana', ownerId: 'user-bruno' })
    ).toBe(false);
    expect(() => assertPermission('n4_manager', 'entity:edit_own', {})).toThrow(DENIAL_MESSAGE);
  });
});
