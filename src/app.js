import { escapeHtml } from './utils/sanitize.js';
import { loadModuleConfig, getLabel, setActiveConfig } from './module-config.js';
import {
  loadEntities,
  loadDocuments,
  addEntity,
  updateEntity,
  deleteEntity,
  countDocumentsForEntity,
  addDocument,
  updateDocument,
  deleteDocument,
  getEntityDocuments,
  searchEntities,
  computeSummary,
  loadMarketingConfig,
  saveMarketingConfig,
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
import { renderEntityListHtml } from './components/entity-list.js';
import { renderDocumentListHtml } from './components/document-list.js';
import { renderSearchBarHtml } from './components/search-bar.js';
import { renderEntityDetailHtml } from './components/entity-detail.js';
import { renderCommercialSummaryHtml } from './components/commercial-summary.js';
import { renderCaptureFormHtml, collectCaptureFormData } from './components/capture-form.js';
import { createProspectFromCapture, CaptureError } from './utils/capture-prospect.js';
import { renderMarketingHtml } from './components/marketing.js';
import { renderMarketingChatHtml } from './components/marketing-chat.js';
import { computeDashboardStats, computeMarketingStats } from './utils/marketing-stats.js';
import { computeSalesTeamMetrics } from './utils/sales-team-metrics.js';
import { registerSocialInteraction } from './utils/marketing-social.js';
import { answerFaq, registerChatMessage, markChatAnswered, ChatConsentError } from './utils/marketing-chat.js';
import { createCampaign, updateCampaign, stopCampaign } from './utils/marketing-campaigns.js';
import { resolveEntityDateRule, watchLocalDayChange } from './utils/entity-date.js';
import { isFieldPotentiallySearchable, resolveFieldRules } from './utils/field-rules.js';

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
  const { config, warning } = configResult;
  setActiveConfig(config);
  if (typeof document !== 'undefined') document.title = config.moduleName;

  const initialParams = typeof window !== 'undefined'
    ? new URLSearchParams(window.location?.search || '')
    : new URLSearchParams();
  const requestedView = initialParams.get('view');
  const isManageDeepLink = requestedView === 'manage-entity' || requestedView === 'manage-document';
  const initialView =
    (requestedView === 'capture' || requestedView === 'marketing') && config.marketing
      ? requestedView
      : isManageDeepLink
        ? 'manage'
        : 'dashboard';

  const state = {
    config,
    warning,
    entities: [],
    documents: [],
    view: initialView,
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
    manageTab: requestedView === 'manage-document' ? 'document' : 'entity',
    editingEntityId: null,
    editingDocumentId: null,
    documentEntityId: null,
    detailEntityId: null,
    searchQuery: '',
    entityFormErrors: {},
    documentFormErrors: {},
    entityFormDraft: null,
    documentFormDraft: null,
    entityFormBaseline: null,
    documentFormBaseline: null,
    focusSearchOnRender: false,
  };

  function refreshData() {
    state.entities = loadEntities();
    state.documents = loadDocuments();
    state.marketingConfig = loadMarketingConfig();
  }

  function activeNavKey() {
    if (state.view === 'manage') return `manage-${state.manageTab}`;
    if (state.view === 'marketing') return 'marketing';
    return state.view;
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
      entities: state.entities,
      documents: state.documents,
      config: state.config,
    });
    return renderDashboardHtml(state.config, stats);
  }

  function renderManageView() {
    const entityLabel = getLabel(state.config, 'entity');
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
      const editing = state.editingEntityId ? state.entities.find((e) => e.id === state.editingEntityId) : null;
      const values = state.entityFormDraft || editing || {};
      content = `
        <h2>${editing ? 'Editar' : 'Nuevo'} ${escapeHtml(editing ? entityLabel.toLowerCase() : entityLabel)}</h2>
        ${renderEntityFormHtml(state.config, values, state.entityFormErrors)}
        ${
          editing
            ? `<button type="button" data-action="delete-entity" data-id="${escapeHtml(editing.id)}">Eliminar ${escapeHtml(entityLabel.toLowerCase())}</button>`
            : ''
        }
      `;
    } else {
      const options = state.entities
        .map(
          (e) =>
            `<option value="${escapeHtml(e.entity_id)}" ${e.entity_id === state.documentEntityId ? 'selected' : ''}>${escapeHtml(e.name)} (${escapeHtml(e.code)})</option>`,
        )
        .join('');
      const editingDoc = state.editingDocumentId ? state.documents.find((d) => d.id === state.editingDocumentId) : null;
      const docValues = state.documentFormDraft || editingDoc || {};
      const docsForEntity = state.documentEntityId ? getEntityDocuments(state.documentEntityId, state.documents) : [];
      content = `
        <h2>${editingDoc ? 'Editar' : 'Nuevo'} ${escapeHtml(documentLabel.toLowerCase())}</h2>
        <div class="form-field">
          <label for="document-entity-select">${escapeHtml(entityLabel)}</label>
          <select id="document-entity-select" ${state.entities.length === 0 ? 'disabled' : ''}>
            <option value="">-- Selecciona --</option>
            ${options}
          </select>
        </div>
        ${
          state.entities.length === 0
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
    return searchEntities(state.searchQuery, {
      entities: state.entities,
      documents: state.documents,
      customFieldKeys: customFieldKeys('entity'),
    });
  }

  function renderSearchView() {
    return `
      <div class="search-view">
        ${renderSearchBarHtml(state.config, state.searchQuery)}
        <div id="search-results-list">
          <div id="search-results">${renderEntityListHtml(currentSearchResults(), state.config)}</div>
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
    const summary = computeSummary({
      entities: state.entities,
      documents: state.documents,
      statusLifecycle: state.config.statusLifecycle,
    });
    return renderCommercialSummaryHtml(state.config, summary);
  }

  function renderMarketingView() {
    const stats = computeMarketingStats({
      entities: state.entities,
      documents: state.documents,
      config: state.config,
    });
    const teams = (state.marketingConfig.salesTeams || []).map((team) => ({
      ...team,
      members: team.members || [],
    }));
    const metrics = computeSalesTeamMetrics({
      teams,
      entities: state.entities,
      documents: state.documents,
    });
    return renderMarketingHtml(state.config, stats, {
      entities: state.entities,
      documents: state.documents,
      marketingConfig: state.marketingConfig,
      section: state.marketingSection,
      team: {
        teams,
        metrics,
        editingTeamId: state.editingTeamId,
        editingMemberId: state.editingMemberId,
        teamFormValues: state.teamFormValues,
        memberFormValues: state.memberFormValues,
      },
      social: { values: state.socialValues, editingId: state.editingSocialId },
      chat: {
        selectedEntityId: state.chatValues.entity_id,
        campaignId: state.chatValues.campaña,
        consent: state.chatValues.consentimiento,
        message: state.chatValues.mensaje,
        response: state.chatResponse,
      },
      campaigns: { campaignForm: state.campaignForm, editingCampaignId: state.editingCampaignId },
      selectedCampaignId: state.selectedCampaignId,
    });
  }

  function renderCurrentView() {
    switch (state.view) {
      case 'marketing':
        return renderMarketingView();
      case 'capture':
        return `${renderCaptureFormHtml(state.config, state.captureValues, state.captureErrors, state.captureSubmitted)}${state.config.marketing ? renderMarketingChatHtml({
          messages: state.captureEntityId ? getEntityDocuments(state.captureEntityId, state.documents) : [],
          faq: state.marketingConfig.faq || [],
          entities: state.captureEntityId ? state.entities.filter((entity) => entity.entity_id === state.captureEntityId) : [],
          selectedEntityId: state.captureEntityId || '',
          campaignId: state.chatValues.campaña,
          consent: state.chatValues.consentimiento,
          message: state.chatValues.mensaje,
          response: state.chatResponse,
          publicView: true,
        }) : ''}`;
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
    const warningHtml = `<div id="config-warning" class="config-warning" role="alert" ${state.warning ? '' : 'hidden'}>${state.warning ? escapeHtml(state.warning) : ''}</div>`;
    rootEl.innerHTML =
      state.view === 'capture'
        ? `${warningHtml}${renderCurrentView()}`
        : `${warningHtml}${renderShellHtml(state.config, activeNavKey())}`;
    const accent = state.config.theme?.accentColor || '#2563eb';
    rootEl.style.setProperty('--accent-color', state.config.theme?.accentColor || '');
    if (typeof document !== 'undefined' && document.documentElement?.style) {
      document.documentElement.style.setProperty('--accent', accent);
      document.documentElement.style.setProperty('--accent-color', accent);
    }
    const viewRoot = rootEl.querySelector('#view-root');
    if (viewRoot) viewRoot.innerHTML = renderCurrentView();

    if (state.view === 'manage' && state.manageTab === 'entity') {
      const editing = state.editingEntityId ? state.entities.find((e) => e.id === state.editingEntityId) : null;
      state.entityFormBaseline = buildEntityFormBaseline(state.config, editing || {});
    } else if (state.view === 'manage' && state.manageTab === 'document') {
      const editingDoc = state.editingDocumentId ? state.documents.find((d) => d.id === state.editingDocumentId) : null;
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
    resultsEl.innerHTML = renderEntityListHtml(currentSearchResults(), state.config);
  }

  // -- Navigation ----------------------------------------------------------

  function hasUnsavedChanges() {
    if (state.view !== 'manage') return false;
    if (state.manageTab === 'entity') {
      const editing = state.editingEntityId ? state.entities.find((e) => e.id === state.editingEntityId) : null;
      const values = state.entityFormDraft || editing || {};
      return isEntityFormDirty(rootEl.querySelector('#entity-form'), state.config, state.entityFormBaseline, values);
    }
    return isDocumentFormDirty(rootEl.querySelector('#document-form'), state.config, state.documentFormBaseline);
  }

  function confirmDiscardChanges() {
    return window.confirm('Hay cambios sin guardar en el formulario. ¿Deseas salir y descartar los cambios?');
  }

  function discardDrafts() {
    state.entityFormDraft = null;
    state.documentFormDraft = null;
    state.entityFormErrors = {};
    state.documentFormErrors = {};
  }

  function navigate(key, { skipDirtyCheck = false } = {}) {
    if (!skipDirtyCheck && hasUnsavedChanges() && !confirmDiscardChanges()) return;
    discardDrafts();
    if (key === 'manage-entity') {
      state.view = 'manage';
      state.manageTab = 'entity';
    } else if (key === 'manage-document') {
      state.view = 'manage';
      state.manageTab = 'document';
    } else {
      state.view = key;
    }
    render();
  }

  // -- Actions ---------------------------------------------------------

  function onEntityFormSubmit(formEl) {
    const editing = state.editingEntityId ? state.entities.find((e) => e.id === state.editingEntityId) : null;
    const values = state.entityFormDraft || editing || {};
    const data = collectEntityFormData(formEl, state.config, values);
    try {
      if (state.editingEntityId) {
        updateEntity(state.editingEntityId, data, { customFieldDefs: state.config.customFields.entity });
      } else {
        addEntity(data, { customFieldDefs: state.config.customFields.entity });
      }
      state.entityFormErrors = {};
      state.entityFormDraft = null;
      state.editingEntityId = null;
      render();
    } catch (err) {
      if (!(err instanceof ValidationError)) throw err;
      state.entityFormErrors = err.errors;
      state.entityFormDraft = data;
      render();
    }
  }

  function onDocumentFormSubmit(formEl) {
    const data = { ...collectDocumentFormData(formEl, state.config), entity_id: state.documentEntityId };
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
      if (!(err instanceof ValidationError)) throw err;
      state.documentFormErrors = err.errors;
      state.documentFormDraft = data;
      render();
    }
  }

  function onDeleteEntity(id) {
    const entity = state.entities.find((e) => e.id === id);
    if (!entity) return;
    const docCount = countDocumentsForEntity(entity.entity_id, state.documents);
    const label = getLabel(state.config, 'entity').toLowerCase();
    const docLabel = getLabel(state.config, 'documentPlural').toLowerCase();
    const message =
      docCount > 0
        ? `¿Eliminar esta ${label}? También se eliminarán ${docCount} ${docLabel} asociados.`
        : `¿Eliminar esta ${label}?`;
    if (!window.confirm(message)) return;
    deleteEntity(id);
    if (state.editingEntityId === id) state.editingEntityId = null;
    if (state.detailEntityId === entity.entity_id) state.view = 'search';
    if (state.documentEntityId === entity.entity_id) state.documentEntityId = null;
    render();
  }

  function onDeleteDocument(id) {
    const label = getLabel(state.config, 'document').toLowerCase();
    if (!window.confirm(`¿Eliminar este ${label}?`)) return;
    deleteDocument(id);
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
    saveMarketingConfig(state.marketingConfig);
    refreshData();
  }

  function handleTeamSubmit(formEl) {
    const values = formValues(formEl);
    const teams = [...(state.marketingConfig.salesTeams || [])];
    if (state.editingTeamId) {
      state.marketingConfig.salesTeams = teams.map((team) =>
        team.id === state.editingTeamId ? { ...team, name: String(values.teamName || '').trim() } : team,
      );
    } else {
      state.marketingConfig.salesTeams = [
        ...teams,
        { id: `team_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, name: String(values.teamName || '').trim(), members: [] },
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
        const memberIndex = members.findIndex((candidate) => candidate.id === state.editingMemberId);
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
    const entity = state.entities.find((candidate) => candidate.entity_id === values.entity_id) || null;
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
    const entity = state.entities.find((candidate) => candidate.entity_id === values.entity_id) || null;
    state.chatValues = {
      entity_id: values.entity_id || '',
      mensaje: String(values.mensaje || '').trim(),
      campaña: values.campaña || '',
      consentimiento: values.consentimiento === 'on',
    };
    try {
      const created = registerChatMessage(
        { ...state.chatValues, consentimiento: state.chatValues.consentimiento || entity?.consentimiento === true },
        entity,
        state.config,
      );
      const answer = answerFaq(state.chatValues.mensaje, state.config);
      if (answer) {
        markChatAnswered(created.id, { respuesta: answer });
        state.chatResponse = answer;
      } else {
        state.chatResponse = 'Recibimos tu consulta. Un ejecutivo hará seguimiento desde la ficha.';
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
        if (hasUnsavedChanges() && !confirmDiscardChanges()) break;
        discardDrafts();
        state.manageTab = target.dataset.tab;
        render();
        break;
      case 'view-entity':
        state.detailEntityId = target.dataset.entityId;
        navigate('detail');
        break;
      case 'edit-entity':
        if (hasUnsavedChanges() && !confirmDiscardChanges()) break;
        discardDrafts();
        state.editingEntityId = target.dataset.id;
        navigate('manage-entity', { skipDirtyCheck: true });
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
        const team = (state.marketingConfig.salesTeams || []).find((candidate) => candidate.id === target.dataset.id);
        if (!team) break;
        state.editingTeamId = team.id;
        state.teamFormValues = { name: team.name };
        render();
        break;
      }
      case 'delete-team':
        state.marketingConfig.salesTeams = (state.marketingConfig.salesTeams || []).filter((team) => team.id !== target.dataset.id);
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
        const team = (state.marketingConfig.salesTeams || []).find((candidate) => candidate.id === target.dataset.teamId);
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
            ? { ...team, members: (team.members || []).filter((member) => member.id !== target.dataset.id) }
            : team,
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
        deleteDocument(target.dataset.id);
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
        const campaign = (state.marketingConfig.campaigns || []).find((candidate) => candidate.id === target.dataset.id);
        if (!campaign) break;
        state.editingCampaignId = campaign.id;
        state.campaignForm = { ...campaign };
        render();
        break;
      }
      case 'stop-campaign':
        state.marketingConfig.campaigns = stopCampaign(target.dataset.id, state.marketingConfig.campaigns || []);
        persistMarketingConfig();
        resetMarketingForms();
        render();
        break;
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
    }
  }

  function handleInput(event) {
    if (event.target.id === 'search-input') {
      state.searchQuery = event.target.value;
      updateSearchResults();
    }
  }

  function handleChange(event) {
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
      const drivesCondition = Object.values(rules).some((rule) => rule.when?.key === event.target.name);
      if (drivesCondition) {
        const editing = state.editingEntityId ? state.entities.find((e) => e.id === state.editingEntityId) : null;
        const previous = state.entityFormDraft || editing || {};
        const collected = collectEntityFormData(entityForm, state.config, previous);
        state.entityFormDraft = { ...previous, ...collected, [event.target.name]: event.target.value };
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

  rootEl.addEventListener('click', handleClick);
  rootEl.addEventListener('submit', handleSubmit);
  rootEl.addEventListener('input', handleInput);
  rootEl.addEventListener('change', handleChange);

  const stopEntityDateWatcher = config.entityDate
    ? watchLocalDayChange(() => {
        const input = rootEl.querySelector('#field-targetDate');
        const rule = resolveEntityDateRule(config);
        if (!input || input.type !== 'date' || !rule) return;
        input.min = rule.min || '';
        input.max = rule.max || '';
        const hint = rootEl.querySelector('#field-targetDate')?.parentElement?.querySelector('[data-role="date-range"]');
        if (hint) {
          const rangeParts = [rule.min && `desde ${rule.min}`, rule.max && `hasta ${rule.max}`].filter(Boolean);
          hint.textContent = rangeParts.length ? `Rango permitido ${rangeParts.join(' y ')} (inclusive).` : '';
        }
      })
    : () => {};

  render();

  return {
    navigate,
    getState: () => state,
    destroy: stopEntityDateWatcher,
  };
}

export function boot(rootEl = null) {
  return initApp(rootEl);
}
