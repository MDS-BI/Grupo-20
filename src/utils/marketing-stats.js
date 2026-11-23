import {
  MARKETING_STAGES,
  MARKETING_STAGE_LABELS,
  MARKETING_CATEGORIES,
  categoryForStage,
} from './marketing-stages.js';

export { categoryForStage };

export function computeMarketingStats({ entities = [] } = {}) {
  const leadsAnalyzed = entities.length;
  const counts = Object.fromEntries(MARKETING_STAGES.map((stage) => [stage, 0]));
  for (const entity of entities) {
    if (Object.prototype.hasOwnProperty.call(counts, entity?.estado_comercial)) {
      counts[entity.estado_comercial] += 1;
    }
  }

  const funnel = MARKETING_STAGES.map((stage, index) => {
    const count = counts[stage];
    const previous = index > 0 ? counts[MARKETING_STAGES[index - 1]] : 0;
    return {
      stage,
      label: MARKETING_STAGE_LABELS[stage],
      count,
      rate: leadsAnalyzed ? (count / leadsAnalyzed) * 100 : 0,
      stepRate: previous > 0 ? (count / previous) * 100 : 0,
    };
  });

  const categories = MARKETING_CATEGORIES.map((category) => ({
    key: category.key,
    label: category.label,
    color: category.color,
    count: entities.filter((entity) => categoryForStage(entity?.estado_comercial).key === category.key).length,
  })).map((category) => ({
    ...category,
    value: leadsAnalyzed ? (category.count / leadsAnalyzed) * 100 : 0,
  }));

  return {
    leadsAnalyzed,
    openOpportunities: counts.en_proceso + counts.en_recontacto,
    wonClients: counts.ganado,
    lossRate: leadsAnalyzed ? (counts.perdido / leadsAnalyzed) * 100 : 0,
    conversionRate: leadsAnalyzed ? (counts.ganado / leadsAnalyzed) * 100 : 0,
    funnel,
    categories,
  };
}
