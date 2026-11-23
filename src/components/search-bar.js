import { escapeHtml } from '../utils/sanitize.js';
import { getLabel } from '../module-config.js';
import { resolveEntityDateRule } from '../utils/entity-date.js';

export function renderSearchBarHtml(config, query = '') {
  const label = getLabel(config, 'entityPlural');
  const dateLabel = resolveEntityDateRule(config)?.label || 'Fecha objetivo';
  return `
    <form id="search-form" role="search" aria-label="Buscar ${label.toLowerCase()}">
      <label for="search-input">Buscar ${label.toLowerCase()}</label>
      <input type="search" id="search-input" name="query" value="${escapeHtml(query)}" placeholder="Nombre, código, categoría, ${escapeHtml(dateLabel)}..." />
    </form>
  `;
}
