import { escapeHtml } from '../utils/sanitize.js';
import { getLabel } from '../module-config.js';
import { can } from '../auth/permissions.js';

function monogramSvg(moduleName) {
  const initial = escapeHtml((moduleName || 'E').trim().charAt(0).toUpperCase() || 'E');
  return `
    <svg class="module-logo" viewBox="0 0 32 32" role="img" aria-label="Logotipo de ${escapeHtml(moduleName)}">
      <rect width="32" height="32" rx="8" fill="var(--accent-color, #1D4ED8)" />
      <text x="16" y="21" text-anchor="middle" font-size="16" font-family="sans-serif" fill="#ffffff">${initial}</text>
    </svg>
  `;
}

const NAV_ICON_ATTRS =
  'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"';

export const NAV_ITEMS = [
  {
    key: 'dashboard',
    labelKey: 'dashboard',
    icon: `<svg ${NAV_ICON_ATTRS}><path d="M3 10.5 12 3l9 7.5" /><path d="M5.5 9.5V21h13V9.5" /><path d="M10 21v-6h4v6" /></svg>`,
    id: 'nav-dashboard',
  },
  {
    key: 'search',
    labelKey: 'search',
    icon: `<svg ${NAV_ICON_ATTRS}><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5" /></svg>`,
    id: 'nav-search',
  },
  {
    key: 'summary',
    labelKey: 'summary',
    icon: `<svg ${NAV_ICON_ATTRS}><path d="M4 20h16" /><path d="M6.5 20v-6" /><path d="M11 20V7" /><path d="M15.5 20v-9" /><path d="M20 20V4" /></svg>`,
    id: 'nav-summary',
  },
  {
    key: 'marketing',
    label: 'Marketing',
    icon: `<svg ${NAV_ICON_ATTRS}><path d="M4 10v4l10 4V6L4 10Z" /><path d="M14 9.5c1.8.6 3 1.4 3 2.5s-1.2 1.9-3 2.5" /><path d="M7 14v5" /><path d="M4 19h6" /></svg>`,
    id: 'nav-marketing',
  },
  {
    key: 'postventa',
    label: 'Postventa',
    icon: `<svg ${NAV_ICON_ATTRS}><path d="M3 8.5 4.5 4h15L21 8.5v7L19.5 20h-15L3 15.5v-7Z" /><path d="M12 5v3" /><path d="M12 11v2" /><path d="M12 16v3" /></svg>`,
    id: 'nav-postventa',
  },
];

const NAV_ACTIONS = {
  dashboard: [['panel:view']],
  search: [['search:view']],
  summary: [['summary:view_all'], ['summary:view_own']],
  marketing: [['marketing:view']],
  postventa: [['postventa:view'], ['postventa:view_own']],
};

function navAllowed(item, options) {
  if (!options?.authEnabled || !options?.role) return true;
  const groups = NAV_ACTIONS[item.key] || [];
  const check = typeof options.can === 'function' ? options.can : can;
  return groups.some((actions) => actions.some((action) => check(options.role, action)));
}

export function renderShellHtml(config, activeNavKey, options = {}) {
  const navButtons = NAV_ITEMS.filter((item) => navAllowed(item, options))
    .map((item) => {
      const label = item.label || getLabel(config, item.labelKey);
      const isActive = item.key === activeNavKey;
      return `
      <button
        id="${item.id}"
        type="button"
        class="sidebar-button${isActive ? ' active' : ''}"
        data-action="navigate"
        data-view="${item.key}"
        aria-current="${isActive ? 'page' : 'false'}"
        aria-label="${escapeHtml(label)}"
        title="${escapeHtml(label)}"
      >
        <span class="sidebar-icon" aria-hidden="true">${item.icon}</span>
        <span id="${item.id}-label" class="sidebar-label">${escapeHtml(label)}</span>
      </button>`;
    })
    .join('');

  const darkTheme = options?.theme === 'dark';
  const themeLabel = darkTheme ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro';

  return `
    <header class="topbar">
      ${monogramSvg(config.moduleName)}
      <span id="brand-name" class="module-name">${escapeHtml(config.moduleName)}</span>
      <button
        id="theme-toggle"
        class="theme-toggle"
        type="button"
        data-action="toggle-theme"
        aria-label="${themeLabel}"
        aria-pressed="${darkTheme}"
        title="${themeLabel}"
      >
        <svg class="theme-icon theme-icon--sun" ${NAV_ICON_ATTRS} aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
        <svg class="theme-icon theme-icon--moon" ${NAV_ICON_ATTRS} aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" /></svg>
      </button>
    </header>
    <nav class="sidebar" aria-label="Navegación de módulos">
      ${navButtons}
      ${options?.userHtml || ''}
    </nav>
    <main id="view-root" class="view-root"></main>
  `;
}
