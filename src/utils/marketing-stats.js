import { getLabel } from '../module-config.js';
import { normalizeText } from './search.js';
import { categoryForStage } from './marketing-stages.js';

export { categoryForStage };

const FALLBACK_STATES = [
  'prospecto',
  'contactado',
  'en negociacion',
  'cerrado ganado',
  'cerrado perdido',
  'pendiente',
];

const ACTIVE_STATES = ['prospecto', 'contactado', 'en negociacion'];

function statusLabel(status) {
  const text = String(status ?? '')
    .replace(/_/g, ' ')
    .trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : '';
}

function funnelFor(documents, config) {
  const states =
    Array.isArray(config?.statusLifecycle?.states) && config.statusLifecycle.states.length
      ? config.statusLifecycle.states
      : FALLBACK_STATES;
  const labels = config?.statusLifecycle?.labels || {};
  const counts = new Map(states.map((status) => [normalizeText(status), 0]));
  for (const document of documents) {
    const key = normalizeText(document?.status);
    if (counts.has(key)) counts.set(key, counts.get(key) + 1);
  }
  return states.map((status) => ({
    status,
    label: labels[status] || labels[normalizeText(status)] || statusLabel(status),
    count: counts.get(normalizeText(status)) || 0,
  }));
}

export function computeDashboardStats({ entities = [], documents = [], config } = {}) {
  const safeEntities = Array.isArray(entities) ? entities : [];
  const safeDocuments = Array.isArray(documents) ? documents : [];
  const funnel = funnelFor(safeDocuments, config);
  let wonDocuments = 0;
  let wonAmount = 0;
  let pipelineTotal = 0;
  for (const document of safeDocuments) {
    const status = normalizeText(document?.status);
    if (status === 'cerrado ganado') {
      wonDocuments += 1;
      wonAmount += Number(document?.importe) || 0;
    }
    if (ACTIVE_STATES.includes(status)) pipelineTotal += Number(document?.importe) || 0;
  }
  const entityCount = safeEntities.length;
  return {
    entityCount,
    documentCount: safeDocuments.length,
    wonDocuments,
    wonAmount,
    conversionRate: entityCount > 0 ? (wonDocuments / entityCount) * 100 : 0,
    pipelineTotal,
    funnel,
    documents: safeDocuments,
    entities: safeEntities,
    entityLabel: getLabel(config, 'entity'),
    entityPlural: getLabel(config, 'entityPlural'),
    documentLabel: getLabel(config, 'document'),
    documentPlural: getLabel(config, 'documentPlural'),
  };
}

export function computePendingByEntity(entitiesOrOptions = [], documentsArg = [], configArg = {}) {
  const options = Array.isArray(entitiesOrOptions)
    ? { entities: entitiesOrOptions, documents: documentsArg, config: configArg }
    : entitiesOrOptions || {};
  const safeEntities = Array.isArray(options.entities) ? options.entities : [];
  const safeDocuments = Array.isArray(options.documents) ? options.documents : [];
  const config = options.config || {};
  const activeEntities = safeEntities.filter((entity) => !entity?.archivedAt);
  const activeIds = new Set(activeEntities.map((entity) => entity.entity_id));
  const pendingStates =
    Array.isArray(config.statusLifecycle?.pendingStates) &&
    config.statusLifecycle.pendingStates.length
      ? config.statusLifecycle.pendingStates.map((state) => normalizeText(state))
      : null;
  const pendingStatus = normalizeText(
    config.statusLifecycle?.states?.find((state) => normalizeText(state) === 'pendiente') ||
      'pendiente'
  );

  let totalPending = 0;
  const counts = new Map();
  for (const doc of safeDocuments) {
    if (!activeIds.has(doc?.entity_id)) continue;
    const status = normalizeText(doc?.status);
    if (status === 'cerrado perdido') continue;
    const isPending = pendingStates ? pendingStates.includes(status) : status === pendingStatus;
    if (!isPending) continue;
    totalPending += 1;
    counts.set(doc.entity_id, (counts.get(doc.entity_id) || 0) + 1);
  }

  const pendingByEntity = Array.from(counts.entries()).map(([entityId, count]) => ({
    entityId,
    entity: activeEntities.find((entity) => entity.entity_id === entityId) || null,
    count,
  }));
  return { totalPending, pendingByEntity };
}

export const computeMarketingStats = computeDashboardStats;
