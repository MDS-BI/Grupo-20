import { escapeHtml } from '../utils/sanitize.js';
import { MESSAGES } from '../utils/messages.js';
import { renderSearchBarHtml } from './search-bar.js';

export { renderSearchBarHtml };

export function renderNoResultsHtml() {
  return `<p class="empty-state" role="status">${MESSAGES.noResults}</p>`;
}

export function renderSearchResultsHtml(entities = []) {
  if (!entities.length) return renderNoResultsHtml();
  return `<ul class="search-results" id="search-results">${entities
    .map(
      (entity) => `
    <li class="list-item">
      <div class="list-item-main">
        <span class="list-item-title">${escapeHtml(entity.name || '')}</span>
        <span>${escapeHtml(entity.entity_id || '')}</span>
      </div>
      <button type="button" data-action="view-entity" data-entity-id="${escapeHtml(entity.entity_id || '')}">Ver ficha</button>
    </li>`
    )
    .join('')}</ul>`;
}

export function renderSearchHtml({
  config = {},
  query = '',
  entities = [],
  hasSearched = true,
} = {}) {
  const results = hasSearched ? renderSearchResultsHtml(entities) : '';
  return `<section class="search-view">${renderSearchBarHtml(config, query)}${results}</section>`;
}
