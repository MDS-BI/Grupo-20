import { labelFor } from '../module-config.js';
import { loadEntities, loadDocuments } from '../storage.js';

function byId(id) {
  return document.getElementById(id);
}

function setText(id, text) {
  const element = byId(id);
  if (element) element.textContent = text;
}

export function renderDashboard(config) {
  const entityLabel = labelFor('entity');
  const documentLabel = labelFor('document');

  const newEntityTitle = entityLabel === 'Entidad' ? 'Nueva Entidad' : `Nuevo ${entityLabel}`;
  setText('action-new-entity-title', newEntityTitle);
  setText('action-new-document-title', `Nuevo ${documentLabel}`);
  setText('action-open-entities-title', labelFor('entities'));
  setText('action-find-title', 'Buscar registros');
  setText('stat-entities-label', labelFor('entities'));
  setText('stat-documents-label', labelFor('documents'));

  const heading = byId('dashboard-heading');
  if (heading && config && config.moduleName) heading.textContent = config.moduleName;

  refreshStats();
}

export function refreshStats() {
  setText('stat-entities', String(loadEntities().length));
  setText('stat-documents', String(loadDocuments().length));
}
