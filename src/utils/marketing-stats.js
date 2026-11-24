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
  const counts = new Map(states.map((status) => [normalizeText(status), 0]));
  for (const document of documents) {
    const key = normalizeText(document?.status);
    if (counts.has(key)) counts.set(key, counts.get(key) + 1);
  }
  return states.map((status) => ({
    status,
    label: statusLabel(status),
    count: counts.get(normalizeText(status)) || 0,
  }));
}

export function computeDashboardStats({ entities = [], documents = [], config } = {}) {
  const safeEntities = Array.isArray(entities) ? entities : [];
  const safeDocuments = Array.isArray(documents) ? documents : [];
  const funnel = funnelFor(safeDocuments, config);
  let wonDocuments = 0;
  let pipelineTotal = 0;
  for (const document of safeDocuments) {
    const status = normalizeText(document?.status);
    if (status === 'cerrado ganado') wonDocuments += 1;
    if (ACTIVE_STATES.includes(status)) pipelineTotal += Number(document?.importe) || 0;
  }
  const entityCount = safeEntities.length;
  return {
    entityCount,
    documentCount: safeDocuments.length,
    wonDocuments,
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

export const computeMarketingStats = computeDashboardStats;
