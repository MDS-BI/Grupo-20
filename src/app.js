import { getConfig, labelFor, loadModuleConfig, setActiveConfig, DEFAULT_CONFIG } from './module-config.js';
import {
  addDocument,
  addEntity,
  deleteDocument,
  deleteEntity,
  documentsForEntity,
  loadDocuments,
  loadEntities,
  searchEntities,
  updateDocument,
  updateEntity,
  validateDocument,
  validateEntity
} from './storage.js';
import { renderShell } from './components/shell.js';
import { refreshStats, renderDashboard } from './components/dashboard.js';
import {
  clearCustomFields,
  clearCustomFieldErrors,
  declaredFields,
  fillCustomFields,
  readCustomFields,
  renderCustomFields
} from './components/entity-form.js';
import { renderStatusControl } from './components/document-form.js';

const ENTITY_BASE_INPUT_IDS = [
  'name', 'code', 'taxId', 'email', 'phone', 'address', 'category',
  'description', 'targetDate', 'creditLimit', 'paymentTerms'
];

const DOCUMENT_BASE_INPUT_IDS = [
  'series', 'folio', 'startDate', 'endDate', 'quantity', 'subtotal',
  'discount', 'taxAmount', 'totalAmount', 'currency', 'docPaymentTerms', 'notes'
];

const VIEWS = ['dashboard', 'entities', 'documents', 'search'];

function byId(id) {
  return document.getElementById(id);
}

function valueOf(id) {
  const element = byId(id);
  return element ? element.value : '';
}

function setValue(id, value) {
  const element = byId(id);
  if (element) element.value = value === undefined || value === null ? '' : String(value);
}

function setText(id, text) {
  const element = byId(id);
  if (element) element.textContent = text;
}

function setError(id, message) {
  const element = byId(id);
  if (element) element.textContent = message || '';
}

function clearErrors(prefixIds) {
  for (const id of prefixIds) setError(id, '');
}

function documentErrorIds() {
  return [
    'error-document-entity', 'error-series', 'error-folio', 'error-startDate',
    'error-endDate', 'error-quantity', 'error-subtotal', 'error-discount',
    'error-taxAmount', 'error-totalAmount', 'error-currency',
    'error-paymentTerms', 'error-notes', 'error-status'
  ];
}

function applyDocumentErrors(errors) {
  const mapping = { entityId: 'error-document-entity' };
  for (const [key, message] of Object.entries(errors || {})) {
    const targetId = mapping[key] || `error-${key}`;
    const target = byId(targetId) || byId(`error-cf-${key}`);
    if (target) target.textContent = message;
  }
}

function applyEntityErrors(errors) {
  for (const [key, message] of Object.entries(errors || {})) {
    const target = byId(`error-${key}`) || byId(`error-cf-${key}`);
    if (target) target.textContent = message;
  }
}

function applyTheme(config) {
  const color = config && config.theme && config.theme.accentColor
    ? config.theme.accentColor
    : DEFAULT_CONFIG.theme.accentColor;
  if (document.documentElement && document.documentElement.style) {
    document.documentElement.style.setProperty('--accent', color);
  }
}

function showConfigWarning(errors) {
  const warning = byId('config-warning');
  if (!warning) return;
  if (errors && errors.length > 0) {
    warning.hidden = false;
    warning.textContent = `Configuración del módulo inválida. Se usan los valores predeterminados. ${errors.join(' ')}`;
  } else {
    warning.hidden = true;
    warning.textContent = '';
  }
}

function applyLabels() {
  const entity = labelFor('entity');
  const entities = labelFor('entities');
  const documentLabel = labelFor('document');
  const documents = labelFor('documents');
  const entityLower = entity.toLocaleLowerCase('es');
  const documentLower = documentLabel.toLocaleLowerCase('es');

  setText('entities-view-heading', entities);
  setText('documents-view-heading', documents);
  setText('entity-form-heading', `Agregar / Editar ${entity}`);
  setText('document-form-heading', `Agregar / Editar ${documentLabel}`);
  setText('edit-entity-heading', `Editar o eliminar ${entity === 'Entidad' ? 'la' : 'el'} ${entityLower}`);
  setText('edit-document-heading', `Editar o eliminar el ${documentLower}`);
  setText('delete-entity', entity === 'Entidad'
    ? 'Eliminar la entidad seleccionada'
    : `Eliminar el ${entityLower} seleccionado`);
  setText('delete-document', `Eliminar el ${documentLower} seleccionado`);
  setText('search-view-heading', `Buscar ${entities}`);
  setText('search-empty', 'No hay coincidencias. Pruebe con otro término.');

  renderDashboard(getConfig());
  renderShell(getConfig());
}

function showView(name) {
  if (!VIEWS.includes(name)) name = 'dashboard';

  for (const view of VIEWS) {
    const element = byId(`view-${view}`);
    if (element) element.hidden = view !== name;
  }

  for (const button of document.querySelectorAll('.nav-module')) {
    if (button.dataset.module === name) {
      button.setAttribute('aria-current', 'page');
    } else {
      button.removeAttribute('aria-current');
    }
  }

  if (name === 'dashboard') {
    refreshStats();
  } else if (name === 'entities') {
    refreshEntityControls();
  } else if (name === 'documents') {
    refreshEntityControls();
    refreshDocumentControls();
  } else if (name === 'search') {
    renderSearch(valueOf('search-input'));
  }
}

function optionElement(value, text) {
  const option = document.createElement('option');
  option.value = value;
  option.textContent = text;
  return option;
}

function refreshEntityControls() {
  const entities = loadEntities();

  const editSelect = byId('edit-entity');
  if (editSelect) {
    const selected = editSelect.value;
    editSelect.replaceChildren(optionElement('', '--'));
    for (const entity of entities) {
      editSelect.appendChild(optionElement(entity.id, `${entity.name} — ${entity.code}`));
    }
    if (entities.some(entity => entity.id === selected)) editSelect.value = selected;
  }

  const documentEntity = byId('document-entity');
  if (documentEntity) {
    const selected = documentEntity.value;
    documentEntity.replaceChildren(optionElement('', '--'));
    for (const entity of entities) {
      documentEntity.appendChild(optionElement(entity.entity_id, `${entity.name} — ${entity.code}`));
    }
    if (entities.some(entity => entity.entity_id === selected)) documentEntity.value = selected;
  }
}

function refreshDocumentControls() {
  const select = byId('edit-document');
  if (!select) return;

  const documents = loadDocuments();
  const entities = loadEntities();
  const nameByEntityId = new Map(entities.map(entity => [entity.entity_id, entity.name]));
  const selected = select.value;

  select.replaceChildren(optionElement('', '--'));
  for (const document of documents) {
    const number = document.series ? `${document.series}-${document.folio}` : String(document.folio);
    const entityName = nameByEntityId.get(document.entity_id) || '';
    select.appendChild(optionElement(document.id, `${number} — ${entityName}`));
  }
  if (documents.some(document => document.id === selected)) select.value = selected;
}

function readEntityForm() {
  const data = {};
  for (const id of ENTITY_BASE_INPUT_IDS) data[id] = valueOf(id);
  const id = valueOf('entity-id');
  if (id) data.id = id;
  Object.assign(data, readCustomFields('entity'));
  return data;
}

function fillEntityForm(entity) {
  setValue('entity-id', entity.id);
  for (const id of ENTITY_BASE_INPUT_IDS) setValue(id, entity[id]);
  fillCustomFields('entity', entity);
  setText('submit-button', 'Actualizar');
  const editSelect = byId('edit-entity');
  if (editSelect) editSelect.value = entity.id;
}

function clearEntityForm() {
  const form = byId('entity-form');
  if (form) form.reset();
  setValue('entity-id', '');
  setText('submit-button', 'Guardar');
  clearErrors(['error-name', 'error-code', 'error-taxId', 'error-email', 'error-phone',
    'error-address', 'error-category', 'error-description', 'error-targetDate',
    'error-creditLimit', 'error-paymentTerms']);
  clearCustomFields('entity');
  const editSelect = byId('edit-entity');
  if (editSelect) editSelect.value = '';
}

function readDocumentForm() {
  const data = { entityId: valueOf('document-entity') };
  for (const id of DOCUMENT_BASE_INPUT_IDS) {
    data[id === 'docPaymentTerms' ? 'paymentTerms' : id] = valueOf(id);
  }
  data.status = valueOf('status');
  const id = valueOf('document-id');
  if (id) data.id = id;
  Object.assign(data, readCustomFields('document'));
  return data;
}

function fillDocumentForm(documentRecord) {
  setValue('document-id', documentRecord.id);
  setValue('document-entity', documentRecord.entity_id);
  setValue('series', documentRecord.series);
  setValue('folio', documentRecord.folio);
  setValue('startDate', documentRecord.startDate);
  setValue('endDate', documentRecord.endDate);
  setValue('quantity', documentRecord.quantity);
  setValue('subtotal', documentRecord.subtotal);
  setValue('discount', documentRecord.discount);
  setValue('taxAmount', documentRecord.taxAmount);
  setValue('totalAmount', documentRecord.totalAmount);
  setValue('currency', documentRecord.currency);
  setValue('docPaymentTerms', documentRecord.paymentTerms);
  setValue('notes', documentRecord.notes);
  renderStatusControl(true, documentRecord.status);
  setValue('status', documentRecord.status);
  fillCustomFields('document', documentRecord);
  setText('document-submit-button', 'Actualizar Documento');
  clearErrors(documentErrorIds());
  clearCustomFieldErrors('document');
  const select = byId('edit-document');
  if (select) select.value = documentRecord.id;
}

function clearDocumentForm() {
  const form = byId('document-form');
  if (form) form.reset();
  setValue('document-id', '');
  renderStatusControl(false, '');
  clearErrors(documentErrorIds());
  clearCustomFields('document');
  setText('document-submit-button', 'Guardar Documento');
  const select = byId('edit-document');
  if (select) select.value = '';
}

function handleEntitySubmit(event) {
  event.preventDefault();

  clearErrors(['error-name', 'error-code', 'error-taxId', 'error-email', 'error-phone',
    'error-address', 'error-category', 'error-description', 'error-targetDate',
    'error-creditLimit', 'error-paymentTerms']);
  clearCustomFieldErrors('entity');

  const data = readEntityForm();
  const { valid, errors } = validateEntity(data);
  if (!valid) {
    applyEntityErrors(errors);
    return;
  }

  let saved;
  try {
    if (data.id) {
      saved = updateEntity(data.id, data);
    } else {
      saved = addEntity(data);
    }
  } catch (error) {
    if (error && error.errors) applyEntityErrors(error.errors);
    return;
  }

  refreshEntityControls();
  refreshDocumentControls();
  refreshStats();
  if (data.id && saved) {
    fillEntityForm(saved);
  } else {
    clearEntityForm();
  }
}

function handleDocumentSubmit(event) {
  event.preventDefault();

  clearErrors(documentErrorIds());
  clearCustomFieldErrors('document');

  const data = readDocumentForm();
  const { valid, errors } = validateDocument(data);
  if (!valid) {
    applyDocumentErrors(errors);
    return;
  }

  let saved;
  try {
    if (data.id) {
      saved = updateDocument(data.id, data);
    } else {
      saved = addDocument(data);
    }
  } catch (error) {
    if (error && error.errors) {
      applyDocumentErrors(error.errors);
    } else {
      setError('error-status', error && error.message ? error.message : 'No se pudo guardar el documento.');
    }
    return;
  }

  refreshDocumentControls();
  refreshEntityControls();
  refreshStats();
  if (data.id && saved) {
    fillDocumentForm(saved);
  } else {
    clearDocumentForm();
  }
}

function handleEntitySelection() {
  const id = valueOf('edit-entity');
  if (!id) {
    clearEntityForm();
    return;
  }
  const entity = loadEntities().find(item => item.id === id);
  if (!entity) {
    clearEntityForm();
    return;
  }
  clearErrors(['error-name', 'error-code', 'error-taxId', 'error-email', 'error-phone',
    'error-address', 'error-category', 'error-description', 'error-targetDate',
    'error-creditLimit', 'error-paymentTerms']);
  clearCustomFieldErrors('entity');
  fillEntityForm(entity);
}

function handleDocumentSelection() {
  const id = valueOf('edit-document');
  if (!id) {
    clearDocumentForm();
    return;
  }
  const documentRecord = loadDocuments().find(item => item.id === id);
  if (!documentRecord) {
    clearDocumentForm();
    return;
  }
  refreshEntityControls();
  fillDocumentForm(documentRecord);
}

function handleDeleteEntity() {
  const id = valueOf('entity-id') || valueOf('edit-entity');
  const entity = loadEntities().find(item => item.id === id);
  if (!entity) {
    if (typeof globalThis.alert === 'function') globalThis.alert('Seleccione una entidad para eliminar.');
    return;
  }

  const documentCount = documentsForEntity(entity.entity_id).length;
  const message = `¿Eliminar "${entity.name}"? Se eliminarán ${documentCount} documento(s) asociado(s).`;
  if (typeof globalThis.confirm === 'function' && !globalThis.confirm(message)) return;

  deleteEntity(entity.id);
  clearEntityForm();
  refreshEntityControls();
  refreshDocumentControls();
  refreshStats();
}

function handleDeleteDocument() {
  const id = valueOf('document-id') || valueOf('edit-document');
  const documentRecord = loadDocuments().find(item => item.id === id);
  if (!documentRecord) {
    if (typeof globalThis.alert === 'function') globalThis.alert('Seleccione un documento para eliminar.');
    return;
  }

  if (typeof globalThis.confirm === 'function' && !globalThis.confirm('¿Eliminar el documento seleccionado?')) return;

  deleteDocument(documentRecord.id);
  clearDocumentForm();
  refreshDocumentControls();
  refreshEntityControls();
  refreshStats();
}

function renderSearch(term) {
  const list = byId('search-results-list');
  const empty = byId('search-empty');
  if (!list) return;

  list.replaceChildren();

  const query = String(term == null ? '' : term).trim();
  if (!query) {
    if (empty) empty.hidden = false;
    return;
  }

  const results = searchEntities(query);
  const fields = declaredFields('entity');

  for (const entity of results) {
    const item = document.createElement('div');
    item.className = 'entity-item';
    item.dataset.entityId = entity.id;
    item.tabIndex = 0;
    item.setAttribute('role', 'button');

    const title = document.createElement('div');
    title.className = 'entity-title';
    title.textContent = `${entity.name} — ${entity.code}`;
    item.appendChild(title);

    if (entity.category) {
      const category = document.createElement('div');
      category.className = 'entity-detail';
      category.textContent = `Categoría: ${entity.category}`;
      item.appendChild(category);
    }
    if (entity.targetDate) {
      const target = document.createElement('div');
      target.className = 'entity-detail';
      target.textContent = `Fecha objetivo: ${entity.targetDate}`;
      item.appendChild(target);
    }

    for (const field of fields) {
      const value = entity[field.key];
      if (value === undefined || value === null || value === '') continue;
      const detail = document.createElement('div');
      detail.className = 'entity-detail';
      detail.textContent = `${field.label}: ${value}`;
      item.appendChild(detail);
    }

    for (const documentRecord of documentsForEntity(entity.entity_id)) {
      if (!documentRecord.status) continue;
      const badge = document.createElement('span');
      badge.className = 'status-badge';
      badge.textContent = documentRecord.status;
      item.appendChild(badge);
    }

    list.appendChild(item);
  }

  if (empty) empty.hidden = results.length > 0;
}

function addDetailRow(container, label, value) {
  if (value === undefined || value === null || value === '') return;
  const row = document.createElement('div');
  row.className = 'entity-detail';
  row.textContent = `${label}: ${value}`;
  container.appendChild(row);
}

function documentDate(documentRecord) {
  return documentRecord.startDate || (documentRecord.createdAt || '').slice(0, 10);
}

function renderEntityDetail(entity) {
  const panel = byId('entity-detail');
  if (!panel || !entity) return;

  panel.hidden = false;
  setText('entity-detail-title', `${entity.name} — ${entity.code}`);

  const info = byId('entity-detail-info');
  if (info) {
    info.replaceChildren();
    addDetailRow(info, 'Identificación fiscal', entity.taxId);
    addDetailRow(info, 'Correo electrónico', entity.email);
    addDetailRow(info, 'Teléfono', entity.phone);
    addDetailRow(info, 'Dirección', entity.address);
    addDetailRow(info, 'Categoría', entity.category);
    addDetailRow(info, 'Descripción', entity.description);
    addDetailRow(info, 'Fecha objetivo', entity.targetDate);
    addDetailRow(info, 'Límite de crédito', entity.creditLimit);
    addDetailRow(info, 'Condiciones de pago', entity.paymentTerms);
    for (const field of declaredFields('entity')) {
      addDetailRow(info, field.label, entity[field.key]);
    }
  }

  const history = byId('entity-history');
  const historyEmpty = byId('entity-history-empty');
  if (history) {
    history.replaceChildren();
    const documents = documentsForEntity(entity.entity_id).sort((a, b) =>
      documentDate(b).localeCompare(documentDate(a))
    );
    for (const documentRecord of documents) {
      const row = document.createElement('div');
      row.className = 'history-item';
      row.dataset.documentId = documentRecord.id;
      const number = documentRecord.series
        ? `${documentRecord.series}-${documentRecord.folio}`
        : String(documentRecord.folio);
      const parts = [documentDate(documentRecord), number];
      if (documentRecord.status) parts.push(documentRecord.status);
      row.textContent = parts.join(' — ');
      history.appendChild(row);
    }
    if (historyEmpty) historyEmpty.hidden = documents.length > 0;
  }
}

function openEntityFromSearch(event) {
  const item = event.target && event.target.closest ? event.target.closest('.entity-item') : null;
  if (!item) return;
  const id = item.dataset.entityId;
  const entity = loadEntities().find(record => record.id === id);
  if (entity) renderEntityDetail(entity);
}

function bindEvents() {
  if (document.body && document.body.dataset.appBooted === 'true') return;
  if (document.body) document.body.dataset.appBooted = 'true';

  for (const view of VIEWS) {
    const button = byId(`nav-${view}`);
    if (button) button.addEventListener('click', () => {
      showView(view);
      if (view === 'search') {
        const field = byId('search-input');
        if (field) field.focus();
      }
    });
  }

  const newEntity = byId('action-new-entity');
  if (newEntity) {
    newEntity.addEventListener('click', () => {
      showView('entities');
      clearEntityForm();
      const field = byId('name');
      if (field) field.focus();
    });
  }

  const newDocument = byId('action-new-document');
  if (newDocument) {
    newDocument.addEventListener('click', () => {
      showView('documents');
      clearDocumentForm();
      const field = byId('document-entity');
      if (field) field.focus();
    });
  }

  const openEntities = byId('action-open-entities');
  if (openEntities) openEntities.addEventListener('click', () => showView('entities'));

  const find = byId('action-find');
  if (find) {
    find.addEventListener('click', () => {
      showView('search');
      const field = byId('search-input');
      if (field) field.focus();
    });
  }

  const entityForm = byId('entity-form');
  if (entityForm) entityForm.addEventListener('submit', handleEntitySubmit);

  const documentForm = byId('document-form');
  if (documentForm) documentForm.addEventListener('submit', handleDocumentSubmit);

  const editEntity = byId('edit-entity');
  if (editEntity) editEntity.addEventListener('change', handleEntitySelection);

  const editDocument = byId('edit-document');
  if (editDocument) editDocument.addEventListener('change', handleDocumentSelection);

  const deleteEntityButton = byId('delete-entity');
  if (deleteEntityButton) deleteEntityButton.addEventListener('click', handleDeleteEntity);

  const deleteDocumentButton = byId('delete-document');
  if (deleteDocumentButton) deleteDocumentButton.addEventListener('click', handleDeleteDocument);

  const searchInput = byId('search-input');
  if (searchInput) searchInput.addEventListener('input', () => renderSearch(searchInput.value));

  const results = byId('search-results-list');
  if (results) {
    results.addEventListener('click', openEntityFromSearch);
    results.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openEntityFromSearch(event);
      }
    });
  }
}

export async function initApp(result) {
  let config;
  let errors = [];

  if (result && result.config) {
    config = result.config;
    errors = result.errors || [];
  } else if (result && typeof result === 'object' && (result.moduleName || result.labels || result.customFields)) {
    config = result;
  } else {
    const loaded = await loadModuleConfig();
    config = loaded.config;
    errors = loaded.errors;
  }

  setActiveConfig(config);
  const active = getConfig();

  applyTheme(active);
  renderShell(active);
  renderCustomFields(byId('entity-custom-fields'), 'entity');
  renderCustomFields(byId('document-custom-fields'), 'document');
  renderStatusControl(false, '');
  applyLabels();
  bindEvents();
  showConfigWarning(errors);
  refreshEntityControls();
  refreshDocumentControls();
  showView('dashboard');
  return active;
}

export async function boot() {
  const loaded = await loadModuleConfig();
  return initApp(loaded);
}
