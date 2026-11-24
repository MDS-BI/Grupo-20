import { getConfig } from '../module-config.js';
import { computeDashboardStats } from './marketing-stats.js';
import { MARKETING_STAGES, MARKETING_STAGE_LABELS } from './marketing-stages.js';
import { normalizeText } from './search.js';

const WON_STATUS = 'cerrado ganado';
const WON_STAGE = 'ganado';

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function readConfig() {
  try {
    return getConfig() || {};
  } catch {
    return {};
  }
}

function hasValue(value) {
  return value !== null && value !== undefined && String(value).trim() !== '';
}

function hasCampaign(record) {
  return hasValue(record?.campaña) || hasValue(record?.campaignId);
}

function belongsToCampaign(record, campaignId, isGlobal) {
  if (isGlobal) return true;
  if (campaignId === null || campaignId === undefined || campaignId === '') return false;
  if (campaignId === 'none') return !hasCampaign(record);
  return record?.campaña === campaignId || record?.campaignId === campaignId;
}

function countWonDocuments(documents) {
  let count = 0;
  for (const document of documents) {
    if (normalizeText(document?.status) === WON_STATUS) count += 1;
  }
  return count;
}

function isAnsweredQuery(document) {
  if (normalizeText(document?.canal) !== 'chat') return false;
  return (
    document?.respondida === true ||
    normalizeText(document?.status) === 'respondida' ||
    hasValue(document?.respuesta)
  );
}

function sumWonAmount(documents) {
  let total = 0;
  for (const document of documents) {
    if (normalizeText(document?.status) === WON_STATUS) total += Number(document?.importe) || 0;
  }
  return total;
}

function stageConversionsFor(entities) {
  return MARKETING_STAGES.map((stage) => ({
    stage,
    label: MARKETING_STAGE_LABELS[stage] || stage,
    count: entities.filter((entity) => normalizeText(entity?.estado_comercial) === stage).length,
  }));
}

function wonEntitiesFor(entities) {
  return entities.filter((entity) => normalizeText(entity?.estado_comercial) === WON_STAGE).length;
}

function campaignGroups(campaigns, entities, documents) {
  const groups = safeArray(campaigns).map((campaign) => ({
    id: campaign?.id,
    name: campaign?.name,
  }));
  groups.push({ id: 'none', name: 'Sin campaña' });
  return groups.map((group) => {
    const groupEntities = entities.filter((record) => belongsToCampaign(record, group.id, false));
    const groupDocuments = documents.filter((record) => belongsToCampaign(record, group.id, false));
    const totalProspects = groupEntities.length;
    const interactions = groupDocuments.length;
    const wonSales = countWonDocuments(groupDocuments);
    return {
      id: group.id,
      name: group.name,
      totalProspects,
      interactions,
      wonSales,
      hasData: totalProspects > 0 || interactions > 0,
    };
  });
}

export function computeMarketingPerformance({
  entities = [],
  documents = [],
  campaigns = [],
  campaignId = null,
} = {}) {
  const selectedId = campaignId || 'all';
  const isGlobal = selectedId === 'all';
  const dashboard = computeDashboardStats({ entities, documents, config: readConfig() });
  const sourceEntities = Array.isArray(dashboard?.entities)
    ? dashboard.entities
    : safeArray(entities);
  const sourceDocuments = Array.isArray(dashboard?.documents)
    ? dashboard.documents
    : safeArray(documents);
  const scopedEntities = sourceEntities.filter((record) =>
    belongsToCampaign(record, selectedId, isGlobal)
  );
  const scopedDocuments = sourceDocuments.filter((record) =>
    belongsToCampaign(record, selectedId, isGlobal)
  );
  const totalProspects =
    isGlobal && Number.isFinite(dashboard?.entityCount)
      ? dashboard.entityCount
      : scopedEntities.length;
  const interactions =
    isGlobal && Number.isFinite(dashboard?.documentCount)
      ? dashboard.documentCount
      : scopedDocuments.length;
  const wonSales =
    isGlobal && Number.isFinite(dashboard?.wonDocuments)
      ? dashboard.wonDocuments
      : countWonDocuments(scopedDocuments);
  const wonEntities = wonEntitiesFor(scopedEntities);

  return {
    campaignId: selectedId,
    hasData: scopedEntities.length > 0 || scopedDocuments.length > 0,
    totalProspects,
    stageConversions: stageConversionsFor(scopedEntities),
    conversionRate: totalProspects > 0 ? (wonEntities / totalProspects) * 100 : 0,
    interactions,
    answeredQueries: scopedDocuments.filter(isAnsweredQuery).length,
    wonSales,
    wonAmount: sumWonAmount(scopedDocuments),
    byCampaign: campaignGroups(campaigns, sourceEntities, sourceDocuments),
  };
}
