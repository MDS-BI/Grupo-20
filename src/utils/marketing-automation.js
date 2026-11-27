import { selectCampaignsForEvent } from './marketing-campaigns.js';

function declaredActions(campaigns) {
  const declared = Array.isArray(campaigns) ? campaigns.actions : campaigns?.actions;
  return Array.isArray(declared) ? declared : null;
}

function automationKey(rule, context = {}) {
  return [
    rule.event,
    context.from || rule.from || '',
    context.to || rule.to || '',
    rule.label,
  ].join('|');
}

function matchesRule(rule, event, context) {
  if (rule.event !== event) return false;
  if (event === 'stage_changed') {
    if (rule.from && rule.from !== context.from) return false;
    if (rule.to && rule.to !== context.to) return false;
  }
  return true;
}

function campaignDocument(campaign, entity, event, context) {
  const action = campaign.action || 'create_document';
  const notes =
    action === 'assign_executive'
      ? `Asignar ejecutivo: ${campaign.executive || 'Sin ejecutivo'}`
      : action === 'update_stage'
        ? `Actualizar estado comercial: ${campaign.targetStage || 'Sin estado'}`
        : campaign.notes || 'Seguimiento de campaña';
  return {
    entity_id: entity.entity_id,
    notes,
    status: 'automatico',
    automation_key: `campaign|${campaign.id}|${event}|${entity.entity_id}`,
    campaignId: campaign.id,
    campaña: campaign.name,
    campaignAction: action,
    executive: campaign.executive || '',
    targetStage: campaign.targetStage || '',
    startDate: context.now ? new Date(context.now).toISOString().slice(0, 10) : '',
    createdBy: 'Sistema',
    actor: 'Sistema',
    ownerId: 'Sistema',
  };
}

function skippedDocument(skipped, entity, event) {
  return {
    entity_id: entity.entity_id,
    notes: 'omitida por solapamiento',
    status: 'automatico',
    automation_key: `campaign_skipped|${skipped.campaignId}|${event}|${entity.entity_id}`,
    campaignId: skipped.campaignId,
    campaña: skipped.name,
    skipReason: skipped.skipReason,
    fecha: skipped.fecha,
    startDate: skipped.fecha ? skipped.fecha.slice(0, 10) : '',
    createdBy: 'Sistema',
    actor: 'Sistema',
    ownerId: 'Sistema',
  };
}

export function runAutomationRules(event, entity, config, documents = [], context = {}) {
  const marketing = config?.marketing;
  const rules = marketing?.automationRules;
  if (!marketing || !entity?.entity_id) return [];
  const campaigns = context.campaigns || marketing.campaigns || [];
  const actions = declaredActions(campaigns);
  const existingKeys = new Set(
    documents.map((document) => document.automation_key).filter(Boolean)
  );
  const pending = [];
  if (Array.isArray(rules)) {
    for (const rule of rules) {
      if (!matchesRule(rule, event, context)) continue;
      if (actions && !actions.includes(rule.action)) continue;
      const key = automationKey(rule, context);
      if (existingKeys.has(key)) continue;
      existingKeys.add(key);
      pending.push({
        entity_id: entity.entity_id,
        notes: rule.label,
        status: 'automatico',
        automation_key: key,
        createdBy: 'Sistema',
        actor: 'Sistema',
        ownerId: 'Sistema',
      });
    }
  }

  const { selected, skipped } = selectCampaignsForEvent({
    event,
    entity,
    campaigns,
    now: context.now || new Date(),
    context,
  });
  if (selected) {
    const doc = campaignDocument(selected, entity, event, context);
    if (!existingKeys.has(doc.automation_key)) {
      existingKeys.add(doc.automation_key);
      pending.push(doc);
    }
  }
  for (const skippedCampaign of skipped) {
    const doc = skippedDocument(skippedCampaign, entity, event);
    if (!existingKeys.has(doc.automation_key)) {
      existingKeys.add(doc.automation_key);
      pending.push(doc);
    }
  }
  return pending;
}
