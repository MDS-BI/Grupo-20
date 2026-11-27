import { escapeHtml } from '../utils/sanitize.js';
import { getLabel } from '../module-config.js';
import { lostReasonKey } from '../utils/lost-reason.js';

const INTERNAL_DOCUMENT_KEYS = new Set([
  'automation_key',
  'automationKey',
  'automation',
  'chat',
  '_internal',
]);

export function renderDocumentListHtml(documents, config) {
  if (!documents.length) {
    return `<p class="empty-state">No hay ${getLabel(config, 'documentPlural').toLowerCase()} registrados para esta ${getLabel(config, 'entity').toLowerCase()}.</p>`;
  }
  const reasonKey = lostReasonKey(config);
  const customFieldDefs = config?.customFields?.document || [];
  const items = documents
    .map((d) => {
      const reason = d?.[reasonKey];
      const reasonHtml =
        reason !== undefined && reason !== null && reason !== ''
          ? `<span class="list-item-custom list-item-lost-reason" data-field="${escapeHtml(reasonKey)}">${escapeHtml(config?.documentRules?.lostReason?.label || 'Motivo de pérdida')}: ${escapeHtml(reason)}</span>`
          : '';
      return `
      <li class="list-item history-item" data-document-id="${escapeHtml(d.id)}">
        <div class="list-item-main">
          ${d.startDate ? `<span class="list-item-date">${escapeHtml(d.startDate)}</span>` : ''}
          ${d.endDate ? `<span class="list-item-date">${escapeHtml(d.endDate)}</span>` : ''}
          ${d.notes ? `<span class="list-item-notes">${escapeHtml(d.notes)}</span>` : ''}
          ${d.status ? `<span class="status-badge" data-status="${escapeHtml(d.status)}">${escapeHtml(d.status)}</span>` : ''}
          ${customFieldDefs
            .filter(
              (def) =>
                def.key !== reasonKey &&
                !INTERNAL_DOCUMENT_KEYS.has(def.key) &&
                d[def.key] !== undefined &&
                d[def.key] !== null &&
                d[def.key] !== ''
            )
            .map(
              (def) =>
                `<span class="list-item-custom" data-field="${escapeHtml(def.key)}">${escapeHtml(def.label || def.key)}: ${escapeHtml(d[def.key])}</span>`
            )
            .join('')}
          ${reasonHtml}
        </div>
        <div class="list-item-actions">
          <button type="button" data-action="edit-document" data-id="${escapeHtml(d.id)}">Editar</button>
          <button type="button" data-action="delete-document" data-id="${escapeHtml(d.id)}">Eliminar</button>
        </div>
      </li>`;
    })
    .join('');
  return `<ul class="document-list">${items}</ul>`;
}
