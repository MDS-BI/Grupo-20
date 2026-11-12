import { escapeHtml } from '../utils/sanitize.js';
import { getLabel } from '../module-config.js';

export function renderDocumentListHtml(documents, config) {
  if (!documents.length) {
    return `<p class="empty-state">No hay ${getLabel(config, 'documentPlural').toLowerCase()} registrados para esta ${getLabel(config, 'entity').toLowerCase()}.</p>`;
  }
  const items = documents
    .map(
      (d) => `
      <li class="list-item" data-document-id="${escapeHtml(d.id)}">
        <div class="list-item-main">
          ${d.startDate ? `<span class="list-item-date">${escapeHtml(d.startDate)}</span>` : ''}
          ${d.notes ? `<span class="list-item-notes">${escapeHtml(d.notes)}</span>` : ''}
          ${d.status ? `<span class="status-badge" data-status="${escapeHtml(d.status)}">${escapeHtml(d.status)}</span>` : ''}
        </div>
        <div class="list-item-actions">
          <button type="button" data-action="edit-document" data-id="${escapeHtml(d.id)}">Editar</button>
          <button type="button" data-action="delete-document" data-id="${escapeHtml(d.id)}">Eliminar</button>
        </div>
      </li>`,
    )
    .join('');
  return `<ul class="document-list">${items}</ul>`;
}
