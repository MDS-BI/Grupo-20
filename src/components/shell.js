import { labelFor } from '../module-config.js';

function byId(id) {
  return document.getElementById(id);
}

export function moduleInitials(name) {
  const words = String(name == null ? '' : name)
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return '?';
  const initials = words
    .map(word => word.charAt(0))
    .join('')
    .replace(/[^\p{L}\p{N}]/gu, '')
    .slice(0, 2)
    .toUpperCase();
  return initials || '?';
}

export function renderLogo(name) {
  const logo = byId('logo-mark');
  if (!logo) return;
  const initials = moduleInitials(name);
  logo.innerHTML = [
    '<svg viewBox="0 0 40 40" role="img" aria-label="Logotipo del módulo" focusable="false">',
    '<rect x="1" y="1" width="38" height="38" rx="10" fill="var(--accent, #2563eb)" />',
    `<text x="20" y="25" text-anchor="middle" font-family="Segoe UI, sans-serif" font-size="16" font-weight="700" fill="#ffffff">${initials}</text>`,
    '</svg>'
  ].join('');
}

export function renderShell(config) {
  const moduleName = config && config.moduleName ? config.moduleName : 'Módulo Base ERP';

  renderLogo(moduleName);

  const brandName = byId('brand-name');
  if (brandName) brandName.textContent = moduleName;
  document.title = moduleName;

  const labels = {
    'nav-entities-label': labelFor('entities'),
    'nav-documents-label': labelFor('documents')
  };
  for (const [id, text] of Object.entries(labels)) {
    const element = byId(id);
    if (element) element.textContent = text;
  }

  const dashboardLabel = byId('nav-dashboard-label');
  if (dashboardLabel) dashboardLabel.textContent = 'Panel';
  const searchLabel = byId('nav-search-label');
  if (searchLabel) searchLabel.textContent = 'Búsqueda';
}
