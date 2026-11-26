import { escapeHtml } from './utils/sanitize.js';
import { loadModuleConfig, getLabel, setActiveConfig } from './module-config.js';
import * as storageApi from './storage.js';
import {
  loadEntities,
  loadDocuments,
  addEntity,
  updateEntity,
  deleteEntity,
  archiveEntity,
  restoreEntity,
  EntityHasRecordsError,
  isArchivedEntity,
  countDocumentsForEntity,
  addDocument,
  updateDocument,
  deleteDocument,
  getEntityDocuments,
  searchEntities,
  computeSummary,
  saveEntities,
  loadMarketingConfig,
  saveMarketingConfig,
  listTicketDocuments,
  createTicketDocument,
  changeTicketStatus,
  ValidationError,
} from './storage.js';
import { renderShellHtml } from './components/shell.js';
import { renderDashboardHtml } from './components/dashboard.js';
import {
  renderEntityFormHtml,
  collectEntityFormData,
  buildEntityFormBaseline,
  isEntityFormDirty,
} from './components/entity-form.js';
import {
  renderDocumentFormHtml,
  collectDocumentFormData,
  buildDocumentFormBaseline,
  isDocumentFormDirty,
} from './components/document-form.js';
import { renderEntityListHtml, renderClientManagementTableHtml } from './components/entity-list.js';
import { renderDocumentListHtml } from './components/document-list.js';
import { renderSearchBarHtml } from './components/search-bar.js';
import { renderEntityDetailHtml } from './components/entity-detail.js';
import { renderCommercialSummaryHtml } from './components/commercial-summary.js';
import { renderCaptureFormHtml, collectCaptureFormData } from './components/capture-form.js';
import { createProspectFromCapture, CaptureError } from './utils/capture-prospect.js';
import { renderMarketingHtml } from './components/marketing.js';
import { renderPostventaHtml } from './components/postventa.js';
import { renderTicketFormHtml } from './components/ticket-form.js';
import { renderMarketingChatHtml } from './components/marketing-chat.js';
import { computeDashboardStats, computeMarketingStats } from './utils/marketing-stats.js';
import { computeSalesTeamMetrics } from './utils/sales-team-metrics.js';
import { registerSocialInteraction } from './utils/marketing-social.js';
import {
  answerFaq,
  registerChatMessage,
  markChatAnswered,
  ChatConsentError,
} from './utils/marketing-chat.js';
import { createCampaign, updateCampaign, stopCampaign } from './utils/marketing-campaigns.js';
import { resolveEntityDateRule, watchLocalDayChange } from './utils/entity-date.js';
import { isFieldPotentiallySearchable, resolveFieldRules } from './utils/field-rules.js';
import { MESSAGES } from './utils/messages.js';
import {
  authEnabled,
  createUser,
  deactivateUser,
  getCurrentUser,
  listUsers,
  login,
  listExecutiveUsers,
  logout,
  resolveExecutive,
  setAuthForced,
  touchSession,
  updateUser,
} from './auth.js';
import { actionForView, can } from './auth/permissions.js';
import { renderLoginHtml } from './components/login.js';
import { collectUserData, RANK_OPTIONS, renderUsersAdminHtml } from './components/users-admin.js';

const ROUTE_VIEWS = new Set([
  'capture',
  'marketing',
  'postventa',
  'ticket-form',
  'summary',
  'search',
  'users-admin',
]);
const VIEW_ROUTES = {
  dashboard: '',
  capture: 'capture',
  marketing: 'marketing',
  postventa: 'postventa',
  'ticket-form': 'ticket-form',
  summary: 'summary',
  search: 'search',
  'users-admin': 'users-admin',
};

function routeFromSearch(search) {
  const params = search ?? (typeof window !== 'undefined' ? window.location?.search || '' : '');
  const route = new URLSearchParams(params).get('view');
  if (route === 'panel')
    return { view: 'dashboard', manageTab: 'entity', route: null, legacyPanel: true };
  if (route === 'manage-entity' || route === 'manage-document') {
    return {
      view: 'manage',
      manageTab: route === 'manage-document' ? 'document' : 'entity',
      route,
    };
  }
  if (route && ROUTE_VIEWS.has(route)) {
    return { view: route, manageTab: 'entity', route };
  }
  return { view: 'dashboard', manageTab: 'entity', route: null };
}

function routeUrl(view, manageTab) {
  let route = VIEW_ROUTES[view];
  if (view === 'manage') route = `manage-${manageTab}`;
  if (route === undefined || view === 'detail' || view === 'login') return null;
  const pathname =
    typeof window !== 'undefined' && window.location ? window.location.pathname || '/' : '/';
  return route ? `${pathname}?view=${route}` : pathname;
}

function migrateExecutiveAssignments(executives = [], enabled = false) {
  if (!enabled) return;
  const validIds = new Set(executives.map((user) => user.id));
  const entities = loadEntities();
  let changed = false;
  const migrated = entities.map((entity) => {
    const value = entity.ejecutivo_asignado;
    if (value === undefined || value === null || value === '' || value === 'Sin asignar')
      return entity;
    if (validIds.has(value)) return entity;
    const resolved = resolveExecutive(value);
    const next = resolved ? resolved.id : 'Sin asignar';
    if (next !== value) {
      changed = true;
      return { ...entity, ejecutivo_asignado: next };
    }
    return entity;
  });
  if (changed) saveEntities(migrated);
}

function resolveAuthState() {
  const enabled = authEnabled();
  if (!enabled) return { enabled: false, user: null, role: 'visitor' };
  const user = getCurrentUser();
  return { enabled: true, user, role: user?.rank || 'visitor' };
}

let activePermissionContext = {};

const RANK_LABELS = {
  n4_manager: 'Nivel 4 - Gerente Comercial',
  n3_marketing: 'Nivel 3 - Ejecutivo de Marketing',
  n2_sales: 'Nivel 2 - Ejecutivo de Ventas',
  n1_support: 'Nivel 1 - Atencion al Cliente',
};

function canViewRoute(role, view, manageTab = 'entity') {
  if (view === 'capture') return true;
  if (role === 'visitor') return false;
  if (view === 'detail')
    return (
      can(role, 'search:view') ||
      can(role, 'entity:view_any') ||
      can(role, 'entity:view_own', activePermissionContext)
    );
  if (view === 'marketing') return can(role, 'marketing:manage') || can(role, 'team:manage');
  if (view === 'manage-entity' || view === 'manage-document') {
    manageTab = view === 'manage-document' ? 'document' : 'entity';
    view = 'manage';
  }
  if (view === 'manage') {
    return manageTab === 'document'
      ? can(role, 'document:create') ||
          can(role, 'document:edit_any') ||
          can(role, 'document:edit_own', activePermissionContext)
      : can(role, 'entity:create') ||
          can(role, 'entity:edit_any') ||
          can(role, 'entity:edit_own', activePermissionContext);
  }
  const action = actionForView(view, { role, manageTab });
  return action ? can(role, action, activePermissionContext) : true;
}

export function initApp(rootEl = null, options = {}) {
  let root = rootEl;
  let provided = options;

  if (root && typeof root === 'object' && root.nodeType !== 1) {
    provided = root;
    root = null;
  }
  if (!root || typeof root.addEventListener !== 'function') {
    root = document.getElementById('app') || document.body;
  }
  rootEl = root;

  let configResult;
  if (provided && provided.config && Array.isArray(provided.errors)) {
    configResult = {
      config: provided.config,
      warning: provided.errors.length
        ? `Configuración del módulo inválida; se usan los valores predeterminados. Detalle: ${provided.errors.join(' ')}`
        : null,
    };
  } else {
    configResult = loadModuleConfig(provided?.rawConfig);
  }
  const { config: baseConfig, warning } = configResult;
  const executiveUsers = listExecutiveUsers();
  const executiveOptions = [
    { value: '', label: 'Sin asignar' },
    ...executiveUsers.map((user) => ({ value: user.id, label: user.username })),
  ];
  const config = {
    ...baseConfig,
    customFields: {
      ...(baseConfig.customFields || {}),
      entity: (baseConfig.customFields?.entity || []).map((def) =>
        def.key === 'ejecutivo_asignado'
          ? { ...def, type: 'select', options: executiveOptions }
          : def
      ),
      document: (baseConfig.customFields?.document || []).some((def) => def.key === 'type')
        ? [...(baseConfig.customFields?.document || [])]
        : [
            ...(baseConfig.customFields?.document || []),
            { key: 'type', type: 'text', label: 'Tipo' },
          ],
    },
  };
  const enableAuth = Boolean(provided?.enableAuth);
  migrateExecutiveAssignments(executiveUsers, enableAuth || authEnabled());
  setAuthForced(enableAuth);
  if (typeof storageApi.setStorageAuthEnforced === 'function') {
    storageApi.setStorageAuthEnforced(enableAuth || authEnabled());
  }
  setActiveConfig(config);
  if (typeof document !== 'undefined') document.title = config.moduleName;

  const initialRoute = routeFromSearch();
  const initialAuth = resolveAuthState();
  const initialView =
    initialRoute.view === 'marketing' && !config.marketing ? 'dashboard' : initialRoute.view;

  const state = {
    config,
    warning,
    entities: [],
    documents: [],
    view: initialView,
    routeSync: initialAuth.enabled || initialRoute.route !== null,
    pendingRoute: null,
    routeNotice: null,
    authEnabled: initialAuth.enabled,
    currentUser: initialAuth.user,
    role: initialAuth.role,
    loginError: '',
    usersAdminError: '',
    editingUserId: null,
    captureValues: {},
    captureErrors: {},
    captureSubmitted: false,
    captureEntityId: null,
    marketingConfig: { salesTeams: [], faq: [], campaigns: [] },
    marketingSection: 'team',
    teamFormValues: {},
    memberFormValues: {},
    editingTeamId: null,
    editingMemberId: null,
    socialValues: {},
    editingSocialId: null,
    chatValues: { entity_id: '', mensaje: '', consentimiento: false, campaña: '' },
    chatResponse: '',
    campaignForm: {},
    editingCampaignId: null,
    selectedCampaignId: 'all',
    manageTab: initialRoute.manageTab,
    editingEntityId: null,
    editingDocumentId: null,
    documentEntityId: null,
    detailEntityId: null,
    searchQuery: '',
    clientStatusFilter: 'active',
    entityFormErrors: {},
    documentFormErrors: {},
    entityFormDraft: null,
    documentFormDraft: null,
    entityFormBaseline: null,
    documentFormBaseline: null,
    ticketFormOpen: false,
    ticketClientSearch: '',
    ticketValues: {},
    ticketErrors: {},
    focusSearchOnRender: false,
  };

  function refreshData() {
    state.entities = loadEntities();
    state.documents = loadDocuments();
    state.marketingConfig = loadMarketingConfig();
  }

  function refreshAuth() {
    const auth = resolveAuthState();
    state.authEnabled = auth.enabled;
    state.currentUser = auth.user;
    state.role = auth.role;
    activePermissionContext = auth.user
      ? {
          userId: auth.user.id,
          ownerId: auth.user.id,
          campaignOwnerId: auth.user.id,
        }
      : {};
    if (typeof storageApi.setStorageAuthEnforced === 'function') {
      storageApi.setStorageAuthEnforced(enableAuth || auth.enabled);
    }
    if (auth.user) touchSession();
    return auth;
  }

  function routeFromKey(key) {
    if (key === 'manage-entity' || key === 'manage-document') {
      return {
        view: 'manage',
        manageTab: key === 'manage-document' ? 'document' : 'entity',
        route: key,
      };
    }
    return { view: key, manageTab: 'entity', route: VIEW_ROUTES[key] === undefined ? null : key };
  }

  function routeForState() {
    if (state.view === 'login') return state.pendingRoute || routeFromKey('dashboard');
    if (state.view === 'manage') return routeFromKey(`manage-${state.manageTab}`);
    return routeFromKey(state.view);
  }

  function syncUrl({ replace = false, route: explicitRoute = null } = {}) {
    if (!state.routeSync || typeof window === 'undefined' || !window.history) return;
    const route = explicitRoute || routeForState();
    const url = routeUrl(route.view, route.manageTab);
    if (!url) return;
    const current = `${window.location.pathname}${window.location.search}`;
    if (current === url) return;
    try {
      if (replace) window.history.replaceState({ erpRoute: route.route }, '', url);
      else window.history.pushState({ erpRoute: route.route }, '', url);
    } catch {
      return;
    }
  }

  function applyRoute(
    route,
    { skipDirtyCheck = false, replace = false, fromPopState = false } = {}
  ) {
    if (
      !skipDirtyCheck &&
      hasUnsavedChanges() &&
      !window.confirm(
        'Hay cambios sin guardar en el formulario. ¿Deseas salir y descartar los cambios?'
      )
    ) {
      if (fromPopState) syncUrl({ replace: true });
      return false;
    }
    discardDrafts();
    const target = { ...route };
    if (!config.marketing && target.view === 'marketing') {
      target.view = 'dashboard';
      target.route = null;
    }
    const forceReplace = replace || Boolean(target.legacyPanel);
    refreshAuth();
    if (state.authEnabled && target.view !== 'capture' && !state.currentUser) {
      state.pendingRoute = target;
      state.view = 'login';
      state.manageTab = target.manageTab || 'entity';
      state.routeNotice = null;
      syncUrl({ replace: true, route: target });
      render();
      return true;
    }
    const allowed = canViewRoute(state.role, target.view, target.manageTab);
    if (state.authEnabled && state.currentUser && !allowed) {
      state.pendingRoute = null;
      state.routeNotice = MESSAGES.accessDenied;
      state.view = 'dashboard';
      state.manageTab = 'entity';
      syncUrl({ replace: true });
      render();
      return true;
    }
    state.pendingRoute = null;
    state.routeNotice = null;
    state.view = target.view;
    state.manageTab = target.manageTab || 'entity';
    if (!fromPopState) syncUrl({ replace: forceReplace });
    else if (target.legacyPanel) syncUrl({ replace: true });
    render();
    return true;
  }

  async function handleLoginSubmit(formEl) {
    const values = formValues(formEl);
    try {
      await login(values.username, values.password);
    } catch (error) {
      state.loginError = error instanceof Error ? error.message : MESSAGES.userNotFound;
      render();
      return;
    }
    state.loginError = '';
    refreshAuth();
    applyRoute(state.pendingRoute || routeFromKey('dashboard'), {
      skipDirtyCheck: true,
      replace: true,
    });
  }

  function uiCan(action, context = activePermissionContext) {
    if (!state.authEnabled) return true;
    return can(state.role, action, context);
  }

  function activeNavKey() {
    if (state.view === 'manage') return `manage-${state.manageTab}`;
    if (state.view === 'marketing') return 'marketing';
    return state.view;
  }

  function isEntityOwnedByCurrentUser(entity) {
    const user = state.currentUser;
    if (!user) return false;
    const assigned = entity?.ejecutivo_asignado;
    if (assigned && assigned !== 'Sin asignar') return assigned === user.id;
    return entity?.ownerId === user.id;
  }

  function canEditEntity(entity) {
    if (!state.authEnabled || !state.currentUser) return true;
    if (can(state.role, 'entity:edit_any')) return true;
    return (
      isEntityOwnedByCurrentUser(entity) &&
      can(state.role, 'entity:edit_own', {
        userId: state.currentUser.id,
        ownerId: state.currentUser.id,
      })
    );
  }

  function activeEntities() {
    return state.entities.filter((entity) => !isArchivedEntity(entity));
  }

  function archivedEntities() {
    return state.entities.filter(isArchivedEntity);
  }

  function activeDocuments() {
    const activeIds = new Set(activeEntities().map((entity) => entity.entity_id));
    return state.documents.filter((document) => activeIds.has(document.entity_id));
  }

  function applyPermissionFilters() {
    if (!state.authEnabled || !state.currentUser) return;
    rootEl.querySelectorAll('[data-action="navigate"][data-view]').forEach((button) => {
      const view = button.dataset.view;
      if (!canViewRoute(state.role, view)) {
        button.remove();
        return;
      }
      if (view === 'summary' && state.role === 'n2_sales') button.remove();
      if (view === 'marketing' && state.role === 'n1_support') button.remove();
    });
    rootEl.querySelectorAll('[data-action="quick-new-entity"]').forEach((button) => {
      if (!can(state.role, 'entity:create')) button.remove();
    });
    rootEl.querySelectorAll('[data-action="quick-new-document"]').forEach((button) => {
      if (!can(state.role, 'document:create') || state.role === 'n1_support') button.remove();
    });
    rootEl.querySelectorAll('[data-action="quick-manage"]').forEach((button) => {
      if (!(
        can(state.role, 'entity:create') ||
        can(state.role, 'entity:edit_any') ||
        can(state.role, 'entity:edit_own')
      )) {
        button.remove();
      }
    });
    rootEl.querySelectorAll('[data-action="quick-search"]').forEach((button) => {
      if (!canViewRoute(state.role, 'search')) button.remove();
    });
    rootEl.querySelectorAll('[data-action="edit-entity"]').forEach((button) => {
      const entity = state.entities.find((item) => item.id === button.dataset.id);
      if (!canEditEntity(entity)) button.remove();
    });
    if (!can(state.role, 'entity:delete')) {
      rootEl
        .querySelectorAll(
          '[data-action="archive-entity"], [data-action="restore-entity"], [data-action="delete-entity"]'
        )
        .forEach((button) => button.remove());
    }
    if (!can(state.role, 'document:create')) {
      rootEl.querySelectorAll('[data-action="edit-document"]').forEach((button) => button.remove());
    }
    if (!can(state.role, 'document:delete')) {
      rootEl
        .querySelectorAll('[data-action="delete-document"]')
        .forEach((button) => button.remove());
    }
    if (
      !can(state.role, 'document:transition_own') &&
      !can(state.role, 'document:edit_any') &&
      !can(state.role, 'document:edit_own')
    ) {
      rootEl.querySelectorAll('#document-form [name="status"]').forEach((field) => {
        field.disabled = true;
      });
    }
    if (!can(state.role, 'team:manage')) {
      rootEl
        .querySelectorAll(
          '#team-form, #team-member-form, [data-action="edit-team"], [data-action="delete-team"], [data-action="cancel-team-edit"], [data-action="edit-member"], [data-action="delete-member"], [data-action="cancel-member-edit"]'
        )
        .forEach((el) => el.remove());
    }
    const canStopOwnRole = state.currentUser
      ? can(state.role, 'campaign:stop_own', {
          userId: state.currentUser.id,
          campaignOwnerId: state.currentUser.id,
        })
      : false;
    if (!can(state.role, 'campaign:stop_any') && !canStopOwnRole) {
      rootEl.querySelectorAll('[data-action="stop-campaign"]').forEach((el) => el.remove());
    }
  }

  function applyExecutiveLabels() {
    const activeIds = new Set(listExecutiveUsers().map((user) => user.id));
    rootEl
      .querySelectorAll('.entity-detail-custom[data-field="ejecutivo_asignado"]')
      .forEach((element) => {
        const label = element.textContent.split(':')[0];
        const value = element.textContent.slice(label.length + 1).trim();
        if (value && !activeIds.has(value)) element.textContent = `${label}: Sin asignar`;
      });
  }

  function customFieldKeys(kind) {
    const rules = resolveFieldRules(state.config, kind);
    return (state.config.customFields?.[kind] || [])
      .map((def) => def.key)
      .filter((key) => isFieldPotentiallySearchable(rules, key));
  }

  // -- View renderers --------------------------------------------------

  function renderDashboardView() {
    const stats = computeDashboardStats({
      entities: activeEntities(),
      documents: activeDocuments(),
      config: state.config,
    });
    return renderDashboardHtml(state.config, stats);
  }

  function renderManageView() {
    const entityLabel = getLabel(state.config, 'entity');
    const entityPlural = getLabel(state.config, 'entityPlural');
    const documentLabel = getLabel(state.config, 'document');
    const tabsHtml = `
      <div class="tabs" role="tablist">
        <button type="button" role="tab" data-action="manage-tab" data-tab="entity"
          class="tab-button${state.manageTab === 'entity' ? ' active' : ''}"
          aria-selected="${state.manageTab === 'entity'}">${escapeHtml(entityLabel)}</button>
        <button type="button" role="tab" data-action="manage-tab" data-tab="document"
          class="tab-button${state.manageTab === 'document' ? ' active' : ''}"
          aria-selected="${state.manageTab === 'document'}">${escapeHtml(documentLabel)}</button>
      </div>`;

    let content;
    if (state.manageTab === 'entity') {
      const editing = state.editingEntityId
        ? state.entities.find((e) => e.id === state.editingEntityId)
        : null;
      const values = state.entityFormDraft || editing || {};
      const archived = state.clientStatusFilter === 'archived';
      const clients = archived ? archivedEntities() : activeEntities();
      const statusFilterHtml = `
        <div class="tabs client-status-filter" role="tablist" aria-label="Estado del ${escapeHtml(entityLabel.toLowerCase())}">
          <button type="button" role="tab" data-action="client-status-filter" data-status="active"
            class="tab-button${archived ? '' : ' active'}" aria-selected="${!archived}">
            Activos (${activeEntities().length})
          </button>
          <button type="button" role="tab" data-action="client-status-filter" data-status="archived"
            class="tab-button${archived ? ' active' : ''}" aria-selected="${archived}">
            Archivados (${archivedEntities().length})
          </button>
        </div>`;
      content = `
        <section class="client-management" aria-labelledby="client-management-heading">
          <h2 id="client-management-heading">Gestión de ${escapeHtml(entityPlural.toLowerCase())}</h2>
          ${statusFilterHtml}
          ${renderClientManagementTableHtml(clients, state.config, { archived, entityLabel })}
        </section>
        <section class="client-form-section">
          <h2>${editing ? 'Editar' : 'Nuevo'} ${escapeHtml(editing ? entityLabel.toLowerCase() : entityLabel)}</h2>
          ${renderEntityFormHtml(state.config, values, state.entityFormErrors)}
          ${
            editing
              ? `<div class="record-actions">
                  <button type="button" data-action="${isArchivedEntity(editing) ? 'restore-entity' : 'archive-entity'}" data-id="${escapeHtml(editing.id)}">${isArchivedEntity(editing) ? '↩️ Restaurar' : '🗄️ Archivar'} ${escapeHtml(entityLabel.toLowerCase())}</button>
                  <button type="button" data-action="delete-entity" data-id="${escapeHtml(editing.id)}">🗑️ Eliminar ${escapeHtml(entityLabel.toLowerCase())}</button>
                </div>`
              : ''
          }
        </section>
      `;
    } else {
      const availableEntities = activeEntities();
      const options = availableEntities
        .map(
          (e) =>
            `<option value="${escapeHtml(e.entity_id)}" ${e.entity_id === state.documentEntityId ? 'selected' : ''}>${escapeHtml(e.name)} (${escapeHtml(e.code)})</option>`
        )
        .join('');
      const editingDoc = state.editingDocumentId
        ? state.documents.find((d) => d.id === state.editingDocumentId)
        : null;
      const docValues = state.documentFormDraft || editingDoc || {};
      const docsForEntity = state.documentEntityId
        ? getEntityDocuments(state.documentEntityId, state.documents)
        : [];
      content = `
        <h2>${editingDoc ? 'Editar' : 'Nuevo'} ${escapeHtml(documentLabel.toLowerCase())}</h2>
        <div class="form-field">
          <label for="document-entity-select">${escapeHtml(entityLabel)}</label>
          <select id="document-entity-select" ${availableEntities.length === 0 ? 'disabled' : ''}>
            <option value="">-- Selecciona --</option>
            ${options}
          </select>
        </div>
        ${
          availableEntities.length === 0
            ? `<p class="empty-state">Crea una ${escapeHtml(entityLabel.toLowerCase())} primero.</p>`
            : ''
        }
        ${state.documentEntityId ? renderDocumentFormHtml(state.config, docValues, state.documentFormErrors) : ''}
        ${
          editingDoc
            ? `<button type="button" data-action="delete-document" data-id="${escapeHtml(editingDoc.id)}">Eliminar ${escapeHtml(documentLabel.toLowerCase())}</button>`
            : ''
        }
        ${
          state.documentEntityId
            ? `<h3>${escapeHtml(documentLabel)}s de esta ${escapeHtml(entityLabel.toLowerCase())}</h3>${renderDocumentListHtml(docsForEntity, state.config)}`
            : ''
        }
      `;
    }
    return `<div class="manage-view">${tabsHtml}${content}</div>`;
  }

  function currentSearchResults() {
    const entities =
      state.clientStatusFilter === 'archived' ? archivedEntities() : activeEntities();
    return searchEntities(state.searchQuery, {
      entities,
      documents: state.documents,
      customFieldKeys: customFieldKeys('entity'),
      documentCustomFieldKeys: customFieldKeys('document'),
    });
  }

  function renderSearchView() {
    const archived = state.clientStatusFilter === 'archived';
    const filterHtml = `
      <div class="tabs client-status-filter" role="tablist" aria-label="Estado del cliente">
        <button type="button" role="tab" data-action="client-status-filter" data-status="active"
          class="tab-button${archived ? '' : ' active'}" aria-selected="${!archived}">
          Activos (${activeEntities().length})
        </button>
        <button type="button" role="tab" data-action="client-status-filter" data-status="archived"
          class="tab-button${archived ? ' active' : ''}" aria-selected="${archived}">
          Archivados (${archivedEntities().length})
        </button>
      </div>`;
    return `
      <div class="search-view">
        ${renderSearchBarHtml(state.config, state.searchQuery)}
        ${filterHtml}
        <div id="search-results-list">
          <div id="search-results">${renderEntityListHtml(currentSearchResults(), state.config, { archived })}</div>
        </div>
      </div>
    `;
  }

  function renderDetailView() {
    const entity = state.entities.find((e) => e.entity_id === state.detailEntityId) || null;
    const docs = entity ? getEntityDocuments(entity.entity_id, state.documents) : [];
    return renderEntityDetailHtml(state.config, entity, docs);
  }

  function renderSummaryView() {
    const ownerId =
      !uiCan('summary:view_all') && state.currentUser?.id ? state.currentUser.id : null;
    const summary = computeSummary({
      entities: activeEntities(),
      documents: activeDocuments(),
      statusLifecycle: state.config.statusLifecycle,
      ownerId,
    });
    return `<h1>Resumen</h1>${renderCommercialSummaryHtml(state.config, summary)}`;
  }

  function renderMarketingView() {
    const visibleEntities = activeEntities();
    const visibleDocuments = activeDocuments();
    const stats = computeMarketingStats({
      entities: visibleEntities,
      documents: visibleDocuments,
      config: state.config,
    });
    let teams = (state.marketingConfig.salesTeams || []).map((team) => ({
      ...team,
      members: team.members || [],
    }));
    if (state.role === 'n2_sales' && state.currentUser?.id) {
      const userId = state.currentUser.id;
      teams = teams
        .map((team) => ({
          ...team,
          members: (team.members || []).filter((member) => member.userId === userId),
        }))
        .filter((team) => team.members.length > 0);
    }
    const metricsTeams = teams.map((team) => ({
      ...team,
      members: (team.members || []).map((member) => ({
        ...member,
        executive: member.userId || member.executive,
      })),
    }));
    const metricsEntities = visibleEntities.map((entity) => {
      const saleDoc = visibleDocuments.find(
        (d) =>
          d.entity_id === entity.entity_id &&
          d.assignedUserIdAtSale &&
          String(d.status || '').toLowerCase() === 'cerrado ganado'
      );
      return saleDoc ? { ...entity, ejecutivo_asignado: saleDoc.assignedUserIdAtSale } : entity;
    });
    const metrics = computeSalesTeamMetrics({
      teams: metricsTeams,
      entities: metricsEntities,
      documents: visibleDocuments,
    });
    const allowedSections = new Set(['team', 'social', 'chat', 'campaigns', 'performance']);
    const section = allowedSections.has(state.marketingSection) ? state.marketingSection : 'team';
    const canManageTeam = uiCan('team:manage');
    const canManageCampaigns = uiCan('marketing:manage');
    return renderMarketingHtml(state.config, stats, {
      entities: visibleEntities,
      documents: visibleDocuments,
      marketingConfig: state.marketingConfig,
      section,
      team: {
        teams,
        metrics,
        editingTeamId: canManageTeam ? state.editingTeamId : null,
        editingMemberId: canManageTeam ? state.editingMemberId : null,
        teamFormValues: canManageTeam ? state.teamFormValues : {},
        memberFormValues: canManageTeam ? state.memberFormValues : {},
        readOnly: !canManageTeam,
      },
      social: { values: state.socialValues, editingId: state.editingSocialId },
      chat: {
        selectedEntityId: state.chatValues.entity_id,
        campaignId: state.chatValues.campaña,
        consent: state.chatValues.consentimiento,
        message: state.chatValues.mensaje,
        response: state.chatResponse,
      },
      campaigns: {
        campaignForm: state.campaignForm,
        editingCampaignId: state.editingCampaignId,
        readOnly: !canManageCampaigns,
      },
      selectedCampaignId: state.selectedCampaignId,
      currentUserId: state.currentUser?.id || null,
      canStopAnyCampaign: uiCan('campaign:stop_any'),
      role: state.role,
      authEnabled: state.authEnabled,
    });
  }

  function visibleTicketDocuments() {
    const context = { documents: state.documents, entities: state.entities };
    if (!state.authEnabled || !state.currentUser) return listTicketDocuments(context);
    return listTicketDocuments({ ...context, user: state.currentUser });
  }

  function renderPostventaView() {
    return renderPostventaHtml(state.config, {
      tickets: visibleTicketDocuments(),
      clients: activeEntities(),
      canCreate: uiCan('postventa:create'),
      canTransition: uiCan('postventa:transition'),
    });
  }

  function renderTicketFormView() {
    return `<h1>Nuevo Ticket</h1>${renderTicketFormHtml(state.config, {
      clients: activeEntities(),
      formValues: state.ticketValues,
      formErrors: state.ticketErrors,
      ticketClientSearch: state.ticketClientSearch,
    })}`;
  }

  function renderUsersAdminView() {
    const users = listUsers();
    const editing = state.editingUserId
      ? users.find((user) => user.id === state.editingUserId)
      : null;
    return renderUsersAdminHtml({ users, error: state.usersAdminError, editing });
  }

  function renderCurrentView() {
    switch (state.view) {
      case 'login':
        return renderLoginHtml(state.loginError);
      case 'users-admin':
        return renderUsersAdminView();
      case 'marketing':
        return renderMarketingView();
      case 'postventa':
        return renderPostventaView();
      case 'ticket-form':
        return renderTicketFormView();
      case 'capture':
        return `${renderCaptureFormHtml(state.config, state.captureValues, state.captureErrors, state.captureSubmitted)}${
          state.config.marketing
            ? renderMarketingChatHtml({
                messages: state.captureEntityId
                  ? getEntityDocuments(state.captureEntityId, state.documents)
                  : [],
                faq: state.marketingConfig.faq || [],
                entities: state.captureEntityId
                  ? state.entities.filter((entity) => entity.entity_id === state.captureEntityId)
                  : [],
                selectedEntityId: state.captureEntityId || '',
                campaignId: state.chatValues.campaña,
                consent: state.chatValues.consentimiento,
                message: state.chatValues.mensaje,
                response: state.chatResponse,
                publicView: true,
              })
            : ''
        }`;
      case 'manage':
        return renderManageView();
      case 'search':
        return renderSearchView();
      case 'detail':
        return renderDetailView();
      case 'summary':
        return renderSummaryView();
      case 'dashboard':
      default:
        return renderDashboardView();
    }
  }

  // -- Main render -------------------------------------------------------

  function render() {
    refreshData();
    const executiveUsers = listExecutiveUsers();
    migrateExecutiveAssignments(executiveUsers, state.authEnabled);
    const executiveField = state.config.customFields?.entity?.find(
      (def) => def.key === 'ejecutivo_asignado'
    );
    if (executiveField) {
      executiveField.options = [
        { value: '', label: 'Sin asignar' },
        ...executiveUsers.map((user) => ({ value: user.id, label: user.username })),
      ];
    }
    const warningHtml = `<div id="config-warning" class="config-warning" role="alert" ${state.warning ? '' : 'hidden'}>${state.warning ? escapeHtml(state.warning) : ''}</div>`;
    const noticeHtml = state.routeNotice
      ? `<div id="route-notice" class="config-warning" role="alert">${escapeHtml(state.routeNotice)}</div>`
      : '';
    const userHtml =
      state.authEnabled && state.currentUser
        ? `<div class="user-meta"><span id="current-user">${escapeHtml(state.currentUser.username)}</span><span id="current-rank">${escapeHtml(RANK_LABELS[state.currentUser.rank] || state.currentUser.rank || '')}</span>${canViewRoute(state.role, 'users-admin') ? '<button type="button" data-action="navigate" data-view="users-admin">Gestionar usuarios</button>' : ''}<button type="button" data-action="logout">Cerrar sesión</button></div>`
        : '';
    const bareStandalone =
      state.view === 'login' || state.view === 'capture' || state.view === 'ticket-form';
    const wrappedStandalone = bareStandalone && enableAuth;
    rootEl.innerHTML = bareStandalone
      ? `${warningHtml}${noticeHtml}${wrappedStandalone ? `<main id="view-root">${renderCurrentView()}</main>` : renderCurrentView()}`
      : `${warningHtml}${noticeHtml}${userHtml}${renderShellHtml(state.config, activeNavKey())}`;
    const accent = state.config.theme?.accentColor || '#2563eb';
    rootEl.style.setProperty('--accent-color', state.config.theme?.accentColor || '');
    if (typeof document !== 'undefined' && document.documentElement?.style) {
      document.documentElement.style.setProperty('--accent', accent);
      document.documentElement.style.setProperty('--accent-color', accent);
    }
    const viewRoot = rootEl.querySelector('#view-root');
    if (viewRoot && !bareStandalone) viewRoot.innerHTML = renderCurrentView();

    applyPermissionFilters();
    applyExecutiveLabels();

    if (state.view === 'manage' && state.manageTab === 'entity') {
      const editing = state.editingEntityId
        ? state.entities.find((e) => e.id === state.editingEntityId)
        : null;
      state.entityFormBaseline = buildEntityFormBaseline(state.config, editing || {});
    } else if (state.view === 'manage' && state.manageTab === 'document') {
      const editingDoc = state.editingDocumentId
        ? state.documents.find((d) => d.id === state.editingDocumentId)
        : null;
      state.documentFormBaseline = buildDocumentFormBaseline(state.config, editingDoc || {});
    }

    if (state.focusSearchOnRender) {
      state.focusSearchOnRender = false;
      rootEl.querySelector('#search-input')?.focus();
    }
  }

  function updateSearchResults() {
    const resultsEl = rootEl.querySelector('#search-results');
    if (!resultsEl) return;
    resultsEl.innerHTML = renderEntityListHtml(currentSearchResults(), state.config, {
      archived: state.clientStatusFilter === 'archived',
    });
    applyPermissionFilters();
  }

  // -- Navigation ----------------------------------------------------------

  function hasUnsavedChanges() {
    if (state.view !== 'manage') return false;
    if (state.manageTab === 'entity') {
      const editing = state.editingEntityId
        ? state.entities.find((e) => e.id === state.editingEntityId)
        : null;
      const values = state.entityFormDraft || editing || {};
      return isEntityFormDirty(
        rootEl.querySelector('#entity-form'),
        state.config,
        state.entityFormBaseline,
        values
      );
    }
    return isDocumentFormDirty(
      rootEl.querySelector('#document-form'),
      state.config,
      state.documentFormBaseline
    );
  }

  function confirmDiscardChanges() {
    return window.confirm(
      'Hay cambios sin guardar en el formulario. ¿Deseas salir y descartar los cambios?'
    );
  }

  function discardDrafts() {
    state.entityFormDraft = null;
    state.documentFormDraft = null;
    state.entityFormErrors = {};
    state.documentFormErrors = {};
  }

  function navigate(key, { skipDirtyCheck = false, replace = false } = {}) {
    return applyRoute(routeFromKey(key), { skipDirtyCheck, replace });
  }

  // -- Actions ---------------------------------------------------------

  function onEntityFormSubmit(formEl) {
    const editing = state.editingEntityId
      ? state.entities.find((e) => e.id === state.editingEntityId)
      : null;
    const values = state.entityFormDraft || editing || {};
    const data = collectEntityFormData(formEl, state.config, values);
    try {
      if (state.editingEntityId) {
        updateEntity(state.editingEntityId, data, {
          customFieldDefs: state.config.customFields.entity,
        });
      } else {
        addEntity(data, { customFieldDefs: state.config.customFields.entity });
      }
      state.entityFormErrors = {};
      state.entityFormDraft = null;
      state.editingEntityId = null;
      render();
    } catch (err) {
      if (err?.message === MESSAGES.permissionDenied) {
        state.entityFormErrors = { _form: MESSAGES.permissionDenied };
        state.entityFormDraft = data;
        render();
        return;
      }
      if (!(err instanceof ValidationError)) throw err;
      state.entityFormErrors = err.errors;
      state.entityFormDraft = data;
      render();
    }
  }

  function onDocumentFormSubmit(formEl) {
    const data = {
      ...collectDocumentFormData(formEl, state.config),
      entity_id: state.documentEntityId,
    };
    const editingDocument = state.editingDocumentId
      ? state.documents.find((doc) => doc.id === state.editingDocumentId)
      : null;
    const statusField = formEl.querySelector('[name="status"]');
    if (
      state.authEnabled &&
      editingDocument &&
      statusField &&
      String(statusField.value || '') !== String(editingDocument.status || '') &&
      !canChangeDocumentStatus(editingDocument)
    ) {
      showPermissionDenied();
      return;
    }
    const interactionType = String(data.type || data.tipo_interaccion || '');
    if (state.role === 'n1_support' && /reuni/i.test(interactionType)) {
      showPermissionDenied();
      return;
    }
    try {
      if (state.editingDocumentId) {
        updateDocument(state.editingDocumentId, data, {
          customFieldDefs: state.config.customFields.document,
          statusLifecycle: state.config.statusLifecycle,
        });
      } else {
        addDocument(data, {
          customFieldDefs: state.config.customFields.document,
          statusLifecycle: state.config.statusLifecycle,
        });
      }
      state.documentFormErrors = {};
      state.documentFormDraft = null;
      state.editingDocumentId = null;
      render();
    } catch (err) {
      if (err?.message === MESSAGES.permissionDenied) {
        state.documentFormErrors = { _form: MESSAGES.permissionDenied };
        state.documentFormDraft = data;
        render();
        return;
      }
      if (!(err instanceof ValidationError)) throw err;
      state.documentFormErrors = err.errors;
      state.documentFormDraft = data;
      render();
    }
  }

  function canChangeDocumentStatus(doc) {
    const ownerId =
      doc?.ownerId ||
      state.entities.find((entity) => entity.entity_id === doc?.entity_id)?.ownerId ||
      doc?.assignedUserIdAtSale ||
      '';
    const context = { userId: state.currentUser?.id, ownerId };
    return (
      can(state.role, 'document:edit_any') ||
      can(state.role, 'document:edit_own', context) ||
      can(state.role, 'document:transition_own', context)
    );
  }

  function showPermissionDenied() {
    state.routeNotice = MESSAGES.permissionDenied;
    render();
  }

  function onTicketFormSubmit(formEl) {
    const values = formValues(formEl);
    state.ticketValues = values;
    try {
      createTicketDocument(values);
      state.ticketErrors = {};
      state.ticketValues = {};
      state.ticketFormOpen = false;
      state.ticketClientSearch = '';
      refreshData();
      if (state.view === 'ticket-form') {
        applyRoute(routeFromKey('postventa'), { skipDirtyCheck: true, replace: true });
      } else {
        render();
      }
    } catch (err) {
      if (err?.message === MESSAGES.permissionDenied) return showPermissionDenied();
      state.ticketErrors = err?.errors || { _form: MESSAGES.required };
      render();
    }
  }

  function onTicketStatusChange(selectEl) {
    const ticketId = selectEl.dataset.ticketId;
    const noteEl = rootEl.querySelector(`[data-ticket-note="${ticketId}"]`);
    try {
      changeTicketStatus(ticketId, selectEl.value, noteEl?.value || '');
      state.ticketErrors = {};
      refreshData();
      render();
    } catch (err) {
      if (err?.message === MESSAGES.permissionDenied) return showPermissionDenied();
      state.ticketErrors = err?.errors || { _form: MESSAGES.required };
      render();
    }
  }

  function onTicketClientSearch(inputEl) {
    const formEl = inputEl.closest('#ticket-form');
    if (formEl) state.ticketValues = { ...state.ticketValues, ...formValues(formEl) };
    state.ticketClientSearch = inputEl.value;
    render();
  }

  function onArchiveEntity(id) {
    const entity = state.entities.find((e) => e.id === id);
    if (!entity || isArchivedEntity(entity)) return;
    try {
      archiveEntity(id);
    } catch (err) {
      if (err?.message === MESSAGES.permissionDenied) return showPermissionDenied();
      throw err;
    }
    if (state.editingEntityId === id) state.editingEntityId = null;
    render();
  }

  function onRestoreEntity(id) {
    const entity = state.entities.find((e) => e.id === id);
    if (!entity || !isArchivedEntity(entity)) return;
    try {
      restoreEntity(id);
    } catch (err) {
      if (err?.message === MESSAGES.permissionDenied) return showPermissionDenied();
      throw err;
    }
    if (state.editingEntityId === id) state.editingEntityId = null;
    render();
  }

  function onDeleteEntity(id) {
    const entity = state.entities.find((e) => e.id === id);
    if (!entity) return;
    const label = getLabel(state.config, 'entity').toLowerCase();
    const recordCount = countDocumentsForEntity(entity.entity_id, state.documents);
    if (recordCount > 0) {
      const message = `No se puede eliminar este ${label} porque tiene ${recordCount} registros vinculados. ¿Deseas archivarlo para conservar su historial?`;
      if (window.confirm(message)) onArchiveEntity(id);
      return;
    }
    if (!window.confirm(`¿Eliminar este ${label}?`)) return;
    try {
      deleteEntity(id);
    } catch (err) {
      if (err instanceof EntityHasRecordsError) return;
      if (err?.message === MESSAGES.permissionDenied) return showPermissionDenied();
      throw err;
    }
    if (state.editingEntityId === id) state.editingEntityId = null;
    if (state.detailEntityId === entity.entity_id) state.view = 'search';
    if (state.documentEntityId === entity.entity_id) state.documentEntityId = null;
    render();
  }

  function onDeleteDocument(id) {
    const label = getLabel(state.config, 'document').toLowerCase();
    if (!window.confirm(`¿Eliminar este ${label}?`)) return;
    try {
      deleteDocument(id);
    } catch (err) {
      if (err?.message === MESSAGES.permissionDenied) return showPermissionDenied();
      throw err;
    }
    if (state.editingDocumentId === id) state.editingDocumentId = null;
    render();
  }

  function formValues(formEl) {
    return Object.fromEntries(new FormData(formEl).entries());
  }

  function resetMarketingForms() {
    state.teamFormValues = {};
    state.memberFormValues = {};
    state.editingTeamId = null;
    state.editingMemberId = null;
    state.socialValues = {};
    state.editingSocialId = null;
    state.campaignForm = {};
    state.editingCampaignId = null;
  }

  function persistMarketingConfig() {
    try {
      saveMarketingConfig(state.marketingConfig);
    } catch (err) {
      if (err?.message === MESSAGES.permissionDenied) return showPermissionDenied();
      throw err;
    }
    refreshData();
  }

  function handleTeamSubmit(formEl) {
    const values = formValues(formEl);
    const teams = [...(state.marketingConfig.salesTeams || [])];
    if (state.editingTeamId) {
      state.marketingConfig.salesTeams = teams.map((team) =>
        team.id === state.editingTeamId
          ? { ...team, name: String(values.teamName || '').trim() }
          : team
      );
    } else {
      state.marketingConfig.salesTeams = [
        ...teams,
        {
          id: `team_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          name: String(values.teamName || '').trim(),
          members: [],
        },
      ];
    }
    persistMarketingConfig();
    resetMarketingForms();
    render();
  }

  function handleMemberSubmit(formEl) {
    const values = formValues(formEl);
    const teams = state.marketingConfig.salesTeams || [];
    const teamIndex = teams.findIndex((team) => team.id === values.teamId);
    if (teamIndex < 0) return;
    const member = {
      id: state.editingMemberId || `member_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: String(values.memberName || '').trim(),
      role: String(values.memberRole || '').trim(),
      active: values.memberActive === 'on',
    };
    const updatedTeams = teams.map((team, index) => {
      if (index !== teamIndex) return team;
      const members = [...(team.members || [])];
      if (state.editingMemberId) {
        const memberIndex = members.findIndex(
          (candidate) => candidate.id === state.editingMemberId
        );
        if (memberIndex >= 0) members[memberIndex] = member;
      } else {
        members.push(member);
      }
      return { ...team, members };
    });
    state.marketingConfig.salesTeams = updatedTeams;
    persistMarketingConfig();
    resetMarketingForms();
    render();
  }

  function handleSocialSubmit(formEl) {
    const values = formValues(formEl);
    const entity =
      state.entities.find((candidate) => candidate.entity_id === values.entity_id) || null;
    if (!entity) return;
    if (state.editingSocialId) {
      updateDocument(state.editingSocialId, values, {
        customFieldDefs: state.config.customFields.document,
        statusLifecycle: state.config.statusLifecycle,
      });
    } else {
      registerSocialInteraction(values, entity, state.config);
    }
    refreshData();
    state.socialValues = {};
    state.editingSocialId = null;
    render();
  }

  function handleCampaignSubmit(formEl) {
    const values = formValues(formEl);
    const campaigns = state.marketingConfig.campaigns || [];
    state.marketingConfig.campaigns = state.editingCampaignId
      ? updateCampaign(state.editingCampaignId, values, campaigns)
      : createCampaign(values, campaigns);
    persistMarketingConfig();
    resetMarketingForms();
    render();
  }

  function handleChatSubmit(formEl) {
    const values = formValues(formEl);
    const entity =
      state.entities.find((candidate) => candidate.entity_id === values.entity_id) || null;
    state.chatValues = {
      entity_id: values.entity_id || '',
      mensaje: String(values.mensaje || '').trim(),
      campaña: values.campaña || '',
      consentimiento: values.consentimiento === 'on',
    };
    try {
      const created = registerChatMessage(
        {
          ...state.chatValues,
          consentimiento: state.chatValues.consentimiento || entity?.consentimiento === true,
        },
        entity,
        state.config
      );
      const answer = answerFaq(state.chatValues.mensaje, state.config);
      if (answer) {
        markChatAnswered(created.id, { respuesta: answer });
        state.chatResponse = answer;
      } else {
        state.chatResponse = MESSAGES.chatQueryRegistered;
      }
      state.chatValues.mensaje = '';
      state.chatValues.consentimiento = false;
      refreshData();
    } catch (err) {
      state.chatResponse =
        err instanceof ChatConsentError
          ? err.errors.consentimiento
          : err?.errors
            ? Object.values(err.errors).join(' ')
            : 'No se pudo registrar el mensaje.';
    }
    render();
  }

  function handleClick(event) {
    const target = event.target.closest('[data-action]');
    if (!target) return;
    const { action } = target.dataset;
    switch (action) {
      case 'navigate':
        navigate(target.dataset.view);
        break;
      case 'ticket-form':
        if (!uiCan('postventa:create')) {
          showPermissionDenied();
          break;
        }
        window.open(routeUrl('ticket-form'), '_blank', 'noopener');
        break;
      case 'cancel-ticket-form':
        state.ticketFormOpen = false;
        state.ticketErrors = {};
        render();
        break;
      case 'quick-new-entity':
        if (hasUnsavedChanges() && !confirmDiscardChanges()) break;
        discardDrafts();
        state.editingEntityId = null;
        navigate('manage-entity', { skipDirtyCheck: true });
        break;
      case 'quick-new-document':
        if (hasUnsavedChanges() && !confirmDiscardChanges()) break;
        discardDrafts();
        state.editingDocumentId = null;
        navigate('manage-document', { skipDirtyCheck: true });
        break;
      case 'quick-manage':
        navigate('manage-entity');
        break;
      case 'quick-search':
        state.focusSearchOnRender = true;
        navigate('search');
        break;
      case 'manage-tab':
        navigate(`manage-${target.dataset.tab}`);
        break;
      case 'logout':
        logout();
        refreshAuth();
        state.loginError = '';
        applyRoute(routeFromKey('dashboard'), { skipDirtyCheck: true, replace: true });
        break;
      case 'edit-user': {
        const user = listUsers().find((candidate) => candidate.id === target.dataset.id);
        if (!user) break;
        state.editingUserId = user.id;
        state.usersAdminError = '';
        render();
        break;
      }
      case 'deactivate-user':
        deactivateUser(target.dataset.id);
        if (state.editingUserId === target.dataset.id) state.editingUserId = null;
        state.usersAdminError = '';
        render();
        break;
      case 'view-entity':
        state.detailEntityId = target.dataset.entityId;
        navigate('detail');
        break;
      case 'edit-entity': {
        const entity = state.entities.find((item) => item.id === target.dataset.id);
        if (!canEditEntity(entity)) {
          showPermissionDenied();
          break;
        }
        if (hasUnsavedChanges() && !confirmDiscardChanges()) break;
        discardDrafts();
        state.editingEntityId = target.dataset.id;
        navigate('manage-entity', { skipDirtyCheck: true });
        break;
      }
      case 'client-status-filter':
        state.clientStatusFilter = target.dataset.status === 'archived' ? 'archived' : 'active';
        render();
        break;
      case 'archive-entity':
        onArchiveEntity(target.dataset.id);
        break;
      case 'restore-entity':
        onRestoreEntity(target.dataset.id);
        break;
      case 'delete-entity':
        onDeleteEntity(target.dataset.id);
        break;
      case 'cancel-entity-form':
        state.editingEntityId = null;
        state.entityFormDraft = null;
        state.entityFormErrors = {};
        render();
        break;
      case 'edit-document': {
        if (hasUnsavedChanges() && !confirmDiscardChanges()) break;
        discardDrafts();
        const doc = state.documents.find((d) => d.id === target.dataset.id);
        state.editingDocumentId = target.dataset.id;
        state.documentEntityId = doc ? doc.entity_id : state.documentEntityId;
        navigate('manage-document', { skipDirtyCheck: true });
        break;
      }
      case 'delete-document':
        onDeleteDocument(target.dataset.id);
        break;
      case 'cancel-document-form':
        state.editingDocumentId = null;
        state.documentFormDraft = null;
        state.documentFormErrors = {};
        render();
        break;
      case 'marketing-section':
        state.marketingSection = target.dataset.section;
        render();
        break;
      case 'edit-team': {
        const team = (state.marketingConfig.salesTeams || []).find(
          (candidate) => candidate.id === target.dataset.id
        );
        if (!team) break;
        state.editingTeamId = team.id;
        state.teamFormValues = { name: team.name };
        render();
        break;
      }
      case 'delete-team':
        state.marketingConfig.salesTeams = (state.marketingConfig.salesTeams || []).filter(
          (team) => team.id !== target.dataset.id
        );
        persistMarketingConfig();
        resetMarketingForms();
        render();
        break;
      case 'cancel-team-edit':
        state.editingTeamId = null;
        state.teamFormValues = {};
        render();
        break;
      case 'edit-member': {
        const team = (state.marketingConfig.salesTeams || []).find(
          (candidate) => candidate.id === target.dataset.teamId
        );
        const member = team?.members?.find((candidate) => candidate.id === target.dataset.id);
        if (!member) break;
        state.editingMemberId = member.id;
        state.memberFormValues = { ...member, teamId: team.id };
        render();
        break;
      }
      case 'delete-member':
        state.marketingConfig.salesTeams = (state.marketingConfig.salesTeams || []).map((team) =>
          team.id === target.dataset.teamId
            ? {
                ...team,
                members: (team.members || []).filter((member) => member.id !== target.dataset.id),
              }
            : team
        );
        persistMarketingConfig();
        resetMarketingForms();
        render();
        break;
      case 'cancel-member-edit':
        state.editingMemberId = null;
        state.memberFormValues = {};
        render();
        break;
      case 'edit-social': {
        const doc = state.documents.find((candidate) => candidate.id === target.dataset.id);
        if (!doc) break;
        state.editingSocialId = doc.id;
        state.socialValues = { ...doc };
        render();
        break;
      }
      case 'delete-social':
        try {
          deleteDocument(target.dataset.id);
        } catch (err) {
          if (err?.message === MESSAGES.permissionDenied) return showPermissionDenied();
          throw err;
        }
        refreshData();
        state.socialValues = {};
        state.editingSocialId = null;
        render();
        break;
      case 'cancel-social-edit':
        state.socialValues = {};
        state.editingSocialId = null;
        render();
        break;
      case 'edit-campaign': {
        const campaign = (state.marketingConfig.campaigns || []).find(
          (candidate) => candidate.id === target.dataset.id
        );
        if (!campaign) break;
        state.editingCampaignId = campaign.id;
        state.campaignForm = { ...campaign };
        render();
        break;
      }
      case 'stop-campaign': {
        const campaign = (state.marketingConfig.campaigns || []).find(
          (item) => item.id === target.dataset.id
        );
        const ownerId =
          campaign?.ownerId ||
          campaign?.createdByUserId ||
          campaign?.creatorId ||
          campaign?.userId ||
          '';
        const allowed =
          uiCan('campaign:stop_any') ||
          uiCan('campaign:stop_own', {
            userId: state.currentUser?.id,
            campaignOwnerId: ownerId,
          });
        if (!allowed) return showPermissionDenied();
        state.marketingConfig.campaigns = stopCampaign(
          target.dataset.id,
          state.marketingConfig.campaigns || []
        );
        persistMarketingConfig();
        resetMarketingForms();
        render();
        break;
      }
      case 'cancel-campaign-edit':
        state.editingCampaignId = null;
        state.campaignForm = {};
        render();
        break;
      default:
        break;
    }
  }

  function handleSubmit(event) {
    if (event.target.id === 'entity-form') {
      event.preventDefault();
      onEntityFormSubmit(event.target);
    } else if (event.target.id === 'document-form') {
      event.preventDefault();
      onDocumentFormSubmit(event.target);
    } else if (event.target.id === 'ticket-form') {
      event.preventDefault();
      onTicketFormSubmit(event.target);
    } else if (event.target.id === 'capture-form') {
      event.preventDefault();
      const values = collectCaptureFormData(event.target, state.config, state.captureValues);
      try {
        const prospect = createProspectFromCapture(values, state.config);
        state.captureEntityId = prospect.entity_id;
        state.chatValues.entity_id = prospect.entity_id;
        state.captureValues = {};
        state.captureErrors = {};
        state.captureSubmitted = true;
        refreshData();
        render();
      } catch (err) {
        if (!(err instanceof CaptureError)) throw err;
        state.captureValues = values;
        state.captureErrors = err.errors;
        render();
      }
    } else if (event.target.id === 'search-form') {
      event.preventDefault();
    } else if (event.target.id === 'team-form') {
      event.preventDefault();
      handleTeamSubmit(event.target);
    } else if (event.target.id === 'team-member-form') {
      event.preventDefault();
      handleMemberSubmit(event.target);
    } else if (event.target.id === 'social-form') {
      event.preventDefault();
      handleSocialSubmit(event.target);
    } else if (event.target.id === 'campaign-form') {
      event.preventDefault();
      handleCampaignSubmit(event.target);
    } else if (event.target.id === 'chat-form') {
      event.preventDefault();
      handleChatSubmit(event.target);
    } else if (event.target.id === 'login-form') {
      event.preventDefault();
      handleLoginSubmit(event.target);
    } else if (event.target.id === 'user-form') {
      event.preventDefault();
      handleUserSubmit(event.target);
    }
  }

  async function handleUserSubmit(formEl) {
    const values = collectUserData(formEl);
    const validRanks = new Set(RANK_OPTIONS.map(([rank]) => rank));
    try {
      if (
        !values.username.trim() ||
        !validRanks.has(values.rank) ||
        (!state.editingUserId && !values.password)
      ) {
        throw new Error(MESSAGES.required);
      }
      if (state.editingUserId) {
        updateUser(state.editingUserId, { username: values.username.trim(), rank: values.rank });
        state.editingUserId = null;
      } else {
        await createUser({ ...values, username: values.username.trim() });
      }
      state.usersAdminError = '';
      render();
    } catch (err) {
      state.usersAdminError = err?.message || MESSAGES.permissionDenied;
      render();
    }
  }

  function handleInput(event) {
    if (event.target.id === 'search-input') {
      state.searchQuery = event.target.value;
      updateSearchResults();
    }
    if (event.target.id === 'ticket-client-search') onTicketClientSearch(event.target);
  }

  function handleChange(event) {
    if (event.target.dataset?.action === 'ticket-status-change') {
      onTicketStatusChange(event.target);
      return;
    }
    if (event.target.id === 'performance-campaign') {
      state.selectedCampaignId = event.target.value || 'all';
      render();
      return;
    }
    const captureForm = event.target.closest?.('#capture-form');
    if (captureForm && event.target.name === 'canal_contacto') {
      const values = collectCaptureFormData(captureForm, state.config, state.captureValues);
      state.captureValues = { ...values, canal_contacto: event.target.value };
      state.captureErrors = {};
      render();
      return;
    }
    const entityForm = event.target.closest?.('#entity-form');
    if (entityForm && event.target.name) {
      const rules = resolveFieldRules(state.config, 'entity');
      const drivesCondition = Object.values(rules).some(
        (rule) => rule.when?.key === event.target.name
      );
      if (drivesCondition) {
        const editing = state.editingEntityId
          ? state.entities.find((e) => e.id === state.editingEntityId)
          : null;
        const previous = state.entityFormDraft || editing || {};
        const collected = collectEntityFormData(entityForm, state.config, previous);
        state.entityFormDraft = {
          ...previous,
          ...collected,
          [event.target.name]: event.target.value,
        };
        state.entityFormErrors = {};
        render();
        return;
      }
    }
    if (event.target.id === 'document-entity-select') {
      if (hasUnsavedChanges() && !confirmDiscardChanges()) {
        event.target.value = state.documentEntityId || '';
        return;
      }
      discardDrafts();
      state.documentEntityId = event.target.value || null;
      state.editingDocumentId = null;
      state.documentFormDraft = null;
      state.documentFormErrors = {};
      render();
    }
  }

  function handlePopState() {
    applyRoute(routeFromSearch(), { fromPopState: true });
  }

  function handleStorage(event) {
    if (
      !event ||
      (event.key !== 'erp_documents' && event.key !== 'erp_entities' && event.key !== null)
    ) {
      return;
    }
    const formEl = rootEl.querySelector('#ticket-form');
    if (formEl) state.ticketValues = { ...state.ticketValues, ...formValues(formEl) };
    render();
  }

  rootEl.addEventListener('click', handleClick);
  rootEl.addEventListener('submit', handleSubmit);
  rootEl.addEventListener('input', handleInput);
  rootEl.addEventListener('change', handleChange);
  if (typeof window !== 'undefined') {
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('storage', handleStorage);
  }

  const stopEntityDateWatcher = config.entityDate
    ? watchLocalDayChange(() => {
        const input = rootEl.querySelector('#field-targetDate');
        const rule = resolveEntityDateRule(config);
        if (!input || input.type !== 'date' || !rule) return;
        input.min = rule.min || '';
        input.max = rule.max || '';
        const hint = rootEl
          .querySelector('#field-targetDate')
          ?.parentElement?.querySelector('[data-role="date-range"]');
        if (hint) {
          const rangeParts = [
            rule.min && `desde ${rule.min}`,
            rule.max && `hasta ${rule.max}`,
          ].filter(Boolean);
          hint.textContent = rangeParts.length
            ? `Rango permitido ${rangeParts.join(' y ')} (inclusive).`
            : '';
        }
      })
    : () => {};

  applyRoute(initialRoute, {
    skipDirtyCheck: true,
    replace: Boolean(initialRoute.legacyPanel),
  });

  return {
    navigate,
    getState: () => state,
    destroy: () => {
      stopEntityDateWatcher();
      rootEl.removeEventListener('click', handleClick);
      rootEl.removeEventListener('submit', handleSubmit);
      rootEl.removeEventListener('input', handleInput);
      rootEl.removeEventListener('change', handleChange);
      if (typeof window !== 'undefined') {
        window.removeEventListener('popstate', handlePopState);
        window.removeEventListener('storage', handleStorage);
      }
      if (typeof storageApi.setStorageAuthEnforced === 'function') {
        storageApi.setStorageAuthEnforced(false);
      }
      setAuthForced(false);
      activePermissionContext = {};
    },
  };
}

export function boot(rootEl = null) {
  return initApp(rootEl);
}
