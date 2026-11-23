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

export function runAutomationRules(event, entity, config, documents = [], context = {}) {
  const rules = config?.marketing?.automationRules;
  if (!Array.isArray(rules) || !entity?.entity_id) return [];
  const existingKeys = new Set(documents.map((document) => document.automation_key).filter(Boolean));
  const pending = [];
  for (const rule of rules) {
    if (!matchesRule(rule, event, context)) continue;
    const key = automationKey(rule, context);
    if (existingKeys.has(key)) continue;
    existingKeys.add(key);
    pending.push({
      entity_id: entity.entity_id,
      notes: rule.label,
      status: 'automatico',
      automation_key: key,
    });
  }
  return pending;
}
