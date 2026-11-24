import { MESSAGES } from '../utils/messages.js';

export const ROLES = Object.freeze([
  'n4_manager',
  'n3_marketing',
  'n2_sales',
  'n1_support',
  'visitor',
]);

const ALL_ACTIONS = Object.freeze([
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
]);

export const PERMISSION_MATRIX = Object.freeze({
  n4_manager: Object.freeze(ALL_ACTIONS.filter((action) => action !== 'permissions:edit')),
  n3_marketing: Object.freeze([
    'panel:view',
    'search:view',
    'entity:view_any',
    'document:create',
    'document:read',
    'document:edit_any',
    'marketing:view',
    'marketing:manage',
    'team:view_all',
    'chat:view',
    'chat:answer',
    'chat:create_query',
    'campaign:create',
    'campaign:view',
    'campaign:edit_own',
    'campaign:stop_own',
  ]),
  n2_sales: Object.freeze([
    'panel:view',
    'search:view',
    'entity:view_any',
    'entity:create',
    'entity:edit_own',
    'document:create',
    'document:read',
    'document:edit_own',
    'document:transition_own',
    'summary:view_own',
    'team:view_own',
    'chat:create_query',
  ]),
  n1_support: Object.freeze([
    'panel:view',
    'search:view',
    'entity:view_any',
    'document:read',
    'document:create',
    'chat:view',
    'chat:answer',
    'chat:create_query',
  ]),
  visitor: Object.freeze(['chat:create_query']),
});

const VIEW_ACTIONS = Object.freeze({
  dashboard: 'panel:view',
  search: 'search:view',
  summary: 'summary:view_all',
  marketing: 'marketing:view',
  'users-admin': 'users:manage',
});

function ownershipSatisfied(action, context) {
  if (!action.endsWith('_own')) return true;
  if (context.actor === 'Sistema') return true;
  const key = action.startsWith('campaign:') ? 'campaignOwnerId' : 'ownerId';
  return Boolean(context.userId) && context[key] === context.userId;
}

export function can(role, action, context = {}) {
  if (action === 'permissions:edit') return false;
  const allowed = PERMISSION_MATRIX[role];
  if (!allowed || !allowed.includes(action)) return false;
  return ownershipSatisfied(action, context);
}

export function assertPermission(role, action, context = {}) {
  if (!can(role, action, context)) throw new Error(MESSAGES.permissionDenied);
  return true;
}

export function actionForView(view, context = {}) {
  if (view === 'summary' && context.role === 'n2_sales') return 'summary:view_own';
  if (view === 'summary' && context.role === 'n4_manager') return 'summary:view_all';
  if (view === 'manage')
    return context.manageTab === 'document' ? 'document:create' : 'entity:create';
  if (view === 'capture') return null;
  return VIEW_ACTIONS[view] || null;
}
