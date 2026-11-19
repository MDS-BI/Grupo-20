import { escapeHtml } from '../utils/sanitize.js';
import { getLabel } from '../module-config.js';

export function renderSearchBarHtml(config, query = '', options = {}) {
  const label = getLabel(config, 'entityPlural');
  const {
    categories = [],
    stages = [],
    selectedCategory = '',
    selectedStage = '',
  } = options;

  const chip = (filter, value, active, text) => `
    <button type="button"
      class="filter-chip${active ? ' active' : ''}"
      data-action="search-filter"
      data-filter="${filter}"
      data-value="${escapeHtml(value)}"
      aria-pressed="${active}">${escapeHtml(text)}</button>`;

  const categoryGroup = categories.length
    ? `<div class="filter-group">
        <span class="filter-group-label">Categoría</span>
        <div class="filter-chips">
          ${chip('category', '', !selectedCategory, 'Todas')}
          ${categories.map((value) => chip('category', value, selectedCategory === value, value)).join('')}
        </div>
      </div>`
    : '';

  const stageGroup = stages.length
    ? `<div class="filter-group">
        <span class="filter-group-label">Etapa</span>
        <div class="filter-chips">
          ${chip('stage', '', !selectedStage, 'Todas')}
          ${stages.map((value) => chip('stage', value, selectedStage === value, value)).join('')}
        </div>
      </div>`
    : '';

  return `
    <div class="search-controls">
      <form id="search-form" role="search" aria-label="Buscar ${escapeHtml(label.toLowerCase())}">
        <label for="search-input">Buscar ${escapeHtml(label.toLowerCase())}</label>
        <input type="search" id="search-input" name="query" value="${escapeHtml(query)}" placeholder="Nombre, código, categoría..." />
      </form>
      ${categoryGroup || stageGroup ? `<div class="search-filters" aria-label="Filtros rápidos">${categoryGroup}${stageGroup}</div>` : ''}
    </div>
  `;
}
