import { DEFAULT_POSTVENTA_CONFIG } from './postventa.js';
import { computeDashboardStats } from './marketing-stats.js';
import { normalizeText } from './search.js';

const WON_STATUS = 'cerrado ganado';
const PROSPECT_STATE = 'prospecto';
const NO_CAMPAIGN = 'Sin campaña';
const NO_DATE = 'Sin fecha';

function monthFor(document) {
  const value = String(document?.startDate || document?.createdAt || '');
  return /^\d{4}-\d{2}/.test(value) ? value.slice(0, 7) : NO_DATE;
}

function salesByMonth(documents) {
  const grouped = new Map();
  for (const document of documents) {
    if (normalizeText(document?.status) !== WON_STATUS) continue;
    const month = monthFor(document);
    const current = grouped.get(month) || { ingresos: 0, negocios: 0 };
    current.ingresos += Number(document?.importe) || 0;
    current.negocios += 1;
    grouped.set(month, current);
  }
  return [...grouped.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mes, values]) => ({ mes, ...values }));
}

function ticketsByStatus(documents, config) {
  const states =
    Array.isArray(config?.postventa?.states) && config.postventa.states.length
      ? config.postventa.states
      : DEFAULT_POSTVENTA_CONFIG.states;
  const counts = new Map(states.map((state) => [normalizeText(state), 0]));
  const seen = new Set();
  for (const document of documents) {
    if (document?.ticket !== true) continue;
    const id = document.id || document._id || '';
    if (id && seen.has(id)) continue;
    if (id) seen.add(id);
    const status = normalizeText(document?.status);
    if (counts.has(status)) counts.set(status, counts.get(status) + 1);
  }
  return states
    .map((estado) => ({ estado, total: counts.get(normalizeText(estado)) || 0 }))
    .filter((row) => row.total > 0);
}

function leadsByCampaign(entities) {
  const grouped = new Map();
  for (const entity of entities) {
    if (normalizeText(entity?.estado_comercial) !== PROSPECT_STATE) continue;
    const campana = String(entity?.campaña || entity?.campania || NO_CAMPAIGN);
    grouped.set(campana, (grouped.get(campana) || 0) + 1);
  }
  return [...grouped.entries()].map(([campana, leads]) => ({ campana, leads }));
}

export function computeDashboardChartData({ entities = [], documents = [], config } = {}) {
  const safeEntities = Array.isArray(entities) ? entities : [];
  const safeDocuments = Array.isArray(documents) ? documents : [];
  const activeEntities = safeEntities.filter((entity) => !entity?.archivedAt);
  const activeIds = new Set(activeEntities.map((entity) => entity.entity_id));
  const activeDocuments = safeDocuments.filter((document) => activeIds.has(document?.entity_id));
  const stats = computeDashboardStats({
    entities: activeEntities,
    documents: activeDocuments,
    config,
  });

  return {
    salesByMonth: salesByMonth(activeDocuments),
    ticketsByStatus: ticketsByStatus(activeDocuments, config),
    leadsByCampaign: leadsByCampaign(activeEntities),
    funnel: stats.funnel,
  };
}
