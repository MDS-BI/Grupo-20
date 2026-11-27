import { escapeHtml } from '../utils/sanitize.js';
import { resolveEntityDateRule } from '../utils/entity-date.js';
import { isFieldVisible, resolveFieldRules } from '../utils/field-rules.js';
import { MESSAGES } from '../utils/messages.js';

const ALERT_LABELS = { open: 'Ticket abierto', review: 'Ticket en revisión' };

function metaFor(ticketMeta, entity) {
  return ticketMeta?.[entity.entity_id] || ticketMeta?.[entity.id] || {};
}

function alertClasses(meta) {
  if (Array.isArray(meta.alertClass)) return meta.alertClass;
  return String(meta.alertClass || '')
    .split(/\s+/)
    .map((value) => value.replace(/^ticket-alert--/, ''))
    .filter(Boolean);
}

function alertLabels(meta) {
  if (Array.isArray(meta.alertLabel)) return meta.alertLabel;
  return meta.alertLabel ? [meta.alertLabel] : [];
}

function ticketAlertsHtml(ticketMeta, entity) {
  const meta = metaFor(ticketMeta, entity);
  const entries = Array.isArray(meta.alerts) ? meta.alerts : [meta];
  return entries
    .flatMap((entry) => {
      const classes = alertClasses(entry);
      const labels = alertLabels(entry);
      return classes.flatMap((rawClass, index) => {
        const className = String(rawClass).replace(/^ticket-alert--/, '');
        if (!ALERT_LABELS[className]) return [];
        const label = labels[index] || ALERT_LABELS[className];
        return [
          `<span class="ticket-alert ticket-alert--${className}">${escapeHtml(label)}</span>`,
        ];
      });
    })
    .join('');
}

function canOpenTicket(ticketMeta, entity) {
  const meta = metaFor(ticketMeta, entity);
  if (Array.isArray(meta.alerts)) {
    return meta.alerts.some((entry) => entry.canOpenTicket === true) || meta.canOpenTicket === true;
  }
  return meta.canOpenTicket === true;
}

function openTicketHtml(ticketMeta, entity) {
  if (!canOpenTicket(ticketMeta, entity)) return '';
  return `<button type="button" class="action-button" data-action="open-ticket" data-entity-id="${escapeHtml(entity.entity_id)}">Abrir Ticket</button>`;
}

function quickViewNameHtml(entity) {
  return `<button type="button" class="client-name-button" data-action="open-client-quick-view" data-entity-id="${escapeHtml(entity.entity_id)}">${escapeHtml(entity.name)}</button>`;
}

function entityActionsHtml(entity, archived, readOnly, compact = false) {
  if (readOnly) return '';
  const label = escapeHtml(entity.name);
  if (compact) {
    return `
      ${
        archived
          ? `<button type="button" data-action="restore-entity" data-id="${escapeHtml(entity.id)}">↩️ Restaurar</button>`
          : `<button type="button" data-action="edit-entity" data-id="${escapeHtml(entity.id)}">✎ Editar</button>
           <button type="button" data-action="archive-entity" data-id="${escapeHtml(entity.id)}">🗄️ Archivar</button>`
      }
      <button type="button" data-action="delete-entity" data-id="${escapeHtml(entity.id)}">🗑️ Eliminar</button>`;
  }
  return `
    <button type="button" class="action-button" data-action="edit-entity" data-id="${escapeHtml(entity.id)}" aria-label="Editar ${label}">✎ Editar</button>
    ${
      archived
        ? `<button type="button" class="action-button" data-action="restore-entity" data-id="${escapeHtml(entity.id)}" aria-label="Restaurar ${label}">↩️ Restaurar</button>`
        : `<button type="button" class="action-button" data-action="archive-entity" data-id="${escapeHtml(entity.id)}" aria-label="Archivar ${label}">🗄️ Archivar</button>`
    }
    <button type="button" class="action-button danger" data-action="delete-entity" data-id="${escapeHtml(entity.id)}" aria-label="Eliminar ${label}">🗑️ Eliminar</button>`;
}

export function renderClientManagementTableHtml(
  entities,
  config,
  { archived = false, entityLabel = 'Cliente', readOnly = false, ticketMeta = {} } = {}
) {
  const rules = resolveFieldRules(config, 'entity');
  const showCode = !rules.code?.hidden;
  const dateLabel = resolveEntityDateRule(config)?.label || 'Fecha objetivo';
  const rows = entities
    .map(
      (entity) => `
        <tr class="client-management-row" data-entity-id="${escapeHtml(entity.entity_id)}">
          <td>
            ${quickViewNameHtml(entity)}
            ${ticketAlertsHtml(ticketMeta, entity)}
            ${archived ? '<span class="status-badge archived">Archivado</span>' : ''}
          </td>
          ${showCode ? `<td>${isFieldVisible(rules, 'code', entity) ? escapeHtml(entity.code || '—') : '—'}</td>` : ''}
          <td>${escapeHtml(entity.targetDate || '—')}</td>
          <td class="client-actions-cell">
            ${openTicketHtml(ticketMeta, entity)}
            ${entityActionsHtml(entity, archived, readOnly)}
          </td>
        </tr>`
    )
    .join('');
  const emptyState = entities.length
    ? ''
    : `<p class="empty-state">No hay ${escapeHtml(entityLabel.toLowerCase())}s ${archived ? 'archivados' : 'activos'}.</p>`;
  return `
    <div class="client-table-wrapper">
      <table class="client-management-table">
        <thead>
          <tr>
            <th scope="col">${escapeHtml(entityLabel)}</th>
            ${showCode ? '<th scope="col">Código</th>' : ''}
            <th scope="col">${escapeHtml(dateLabel)}</th>
            <th scope="col">Acciones</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      ${emptyState}
    </div>
  `;
}

export function renderEntityListHtml(
  entities,
  config,
  { archived = false, readOnly = false, ticketMeta = {} } = {}
) {
  if (!entities.length) {
    return `<p class="empty-state">${MESSAGES.noResults}</p>`;
  }
  const rules = resolveFieldRules(config, 'entity');
  const customFieldDefs = config?.customFields?.entity || [];
  const dateLabel = resolveEntityDateRule(config)?.label || 'Fecha objetivo';
  const items = entities
    .map(
      (e) => `
      <li class="list-item entity-item" data-entity-id="${escapeHtml(e.entity_id)}">
        <div class="list-item-main">
          ${quickViewNameHtml(e)}
          ${ticketAlertsHtml(ticketMeta, e)}
          ${archived ? '<span class="status-badge archived">Archivado</span>' : ''}
          ${isFieldVisible(rules, 'code', e) ? `<span class="list-item-code">${escapeHtml(e.code)}</span>` : ''}
          ${e.targetDate ? `<span class="list-item-date">${escapeHtml(dateLabel)}: ${escapeHtml(e.targetDate)}</span>` : ''}
          ${customFieldDefs
            .filter(
              (def) =>
                isFieldVisible(rules, def.key, e) &&
                e[def.key] !== undefined &&
                e[def.key] !== null &&
                e[def.key] !== ''
            )
            .map(
              (def) =>
                `<span class="list-item-custom" data-field="${escapeHtml(def.key)}">${escapeHtml(def.label || def.key)}: ${escapeHtml(e[def.key])}</span>`
            )
            .join('')}
        </div>
        <div class="list-item-actions">
          <button type="button" data-action="view-entity" data-entity-id="${escapeHtml(e.entity_id)}">👁 Ver ficha</button>
          ${openTicketHtml(ticketMeta, e)}
          ${entityActionsHtml(e, archived, readOnly, true)}
        </div>
      </li>`
    )
    .join('');
  return `<ul class="entity-list">${items}</ul>`;
}
