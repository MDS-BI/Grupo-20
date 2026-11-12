import { escapeHtml } from '../utils/sanitize.js';
import { getLabel } from '../module-config.js';

function monogramSvg(moduleName) {
  const initial = escapeHtml((moduleName || 'E').trim().charAt(0).toUpperCase() || 'E');
  return `
    <svg class="module-logo" viewBox="0 0 32 32" role="img" aria-label="Logotipo de ${escapeHtml(moduleName)}">
      <rect width="32" height="32" rx="8" fill="var(--accent-color, #1a73e8)" />
      <text x="16" y="21" text-anchor="middle" font-size="16" font-family="sans-serif" fill="#ffffff">${initial}</text>
    </svg>
  `;
}

// FR-012: la barra lateral ofrece botones separados para Panel, Entidades,
// Documentos y Buscar; Entidades/Documentos navegan a la misma pantalla de
// gestión preseleccionando su pestaña (FR-013, FR-014). El botón de Resumen
// es adicional (Historia de Usuario 6), más allá del mínimo exigido por FR-012.
const NAV_ITEMS = [
  { key: 'dashboard', labelKey: 'dashboard', icon: '⌂' },
  { key: 'manage-entity', labelKey: 'entityPlural', icon: '🏷' },
  { key: 'manage-document', labelKey: 'documentPlural', icon: '📄' },
  { key: 'search', labelKey: 'search', icon: '🔍' },
  { key: 'summary', labelKey: 'summary', icon: '📊' },
];

export function renderShellHtml(config, activeNavKey) {
  const navButtons = NAV_ITEMS.map((item) => {
    const label = getLabel(config, item.labelKey);
    const isActive = item.key === activeNavKey;
    return `
      <button
        type="button"
        class="sidebar-button${isActive ? ' active' : ''}"
        data-action="navigate"
        data-view="${item.key}"
        aria-current="${isActive ? 'page' : 'false'}"
        aria-label="${escapeHtml(label)}"
      >
        <span class="sidebar-icon" aria-hidden="true">${item.icon}</span>
        <span class="sidebar-label">${escapeHtml(label)}</span>
      </button>`;
  }).join('');

  return `
    <header class="topbar">
      ${monogramSvg(config.moduleName)}
      <span class="module-name">${escapeHtml(config.moduleName)}</span>
    </header>
    <nav class="sidebar" aria-label="Navegación de módulos">
      ${navButtons}
    </nav>
    <main id="view-root" class="view-root"></main>
  `;
}
