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
  ValidationError,
} from './storage.js';
import { renderShellHtml } from './components/shell.js';
import { renderDashboardHtml } from './components/dashboard.js';
import { DASHBOARD_DEMO_STATS } from './dashboard-demo.js';
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

  const state = {
    config,
    warning,
    entities: [],
    documents: [],
    view: 'dashboard',
    manageTab: 'entity',
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
    demoStatsEnabled: !(
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location?.search || '').get('demo') === '0'
    ),
  };

  function refreshData() {
    state.entities = loadEntities();
    state.documents = loadDocuments();
  }

  function activeNavKey() {
    if (state.view === 'manage') return `manage-${state.manageTab}`;
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
    if (state.demoStatsEnabled && state.entities.length === 0 && state.documents.length === 0) {
      return renderDashboardHtml(state.config, DASHBOARD_DEMO_STATS);
    }
    return renderDashboardHtml(state.config, {
      entityCount: state.entities.length,
      documentCount: state.documents.length,
      documents: state.documents,
    });
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

  function renderCurrentView() {
    switch (state.view) {
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
    rootEl.innerHTML = `
      <div id="config-warning" class="config-warning" role="alert" ${state.warning ? '' : 'hidden'}>${state.warning ? escapeHtml(state.warning) : ''}</div>
      ${renderShellHtml(state.config, activeNavKey())}
    `;
    const accent = state.config.theme?.accentColor || '#2563eb';
    rootEl.style.setProperty('--accent-color', state.config.theme?.accentColor || '');
    if (typeof document !== 'undefined' && document.documentElement?.style) {
      document.documentElement.style.setProperty('--accent', accent);
      document.documentElement.style.setProperty('--accent-color', accent);
    }
    const viewRoot = rootEl.querySelector('#view-root');
    viewRoot.innerHTML = renderCurrentView();

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
    } else if (event.target.id === 'search-form') {
      event.preventDefault();
    }
  }

  function handleInput(event) {
    if (event.target.id === 'search-input') {
      state.searchQuery = event.target.value;
      updateSearchResults();
    }
  }

  function handleChange(event) {
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
    setDemoMode(enabled) {
      state.demoStatsEnabled = Boolean(enabled);
      render();
    },
  };
}

export function boot(rootEl = null) {
  return initApp(rootEl);
}
