import { escapeHtml } from '../utils/sanitize.js';
import { getLabel } from '../module-config.js';
import { resolveEntityDateRule } from '../utils/entity-date.js';
import { isFieldPotentiallySearchable, resolveFieldRules } from '../utils/field-rules.js';

export function renderSearchBarHtml(config, query = '') {
  const label = getLabel(config, 'entityPlural');
  const dateLabel = resolveEntityDateRule(config)?.label || 'Fecha objetivo';
  const rules = resolveFieldRules(config, 'entity');
  const baseLabels = [
    ['name', 'Nombre'],
    ['code', 'Código'],
    ['category', 'Categoría'],
    ['description', 'Descripción'],
    ['targetDate', dateLabel],
  ]
    .filter(([key]) => isFieldPotentiallySearchable(rules, key))
    .map(([, fieldLabel]) => fieldLabel);
  const customLabels = (config.customFields?.entity || [])
    .filter((def) => isFieldPotentiallySearchable(rules, def.key))
    .map((def) => rules[def.key]?.label || def.label || def.key);
  const placeholder = `${[...baseLabels, ...customLabels].join(', ')}...`;
  return `
    <form id="search-form" role="search" aria-label="Buscar ${label.toLowerCase()}">
      <label for="search-input">Buscar ${label.toLowerCase()}</label>
      <input type="search" id="search-input" name="query" value="${escapeHtml(query)}" placeholder="${escapeHtml(placeholder)}" />
    </form>
  `;
}
