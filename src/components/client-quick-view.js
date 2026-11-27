import { escapeHtml } from '../utils/sanitize.js';
import { isFieldVisible, resolveFieldRules } from '../utils/field-rules.js';
import { formatCurrencyUsd } from './dashboard.js';
import { isTicket } from '../utils/postventa.js';

const CONTACT_KEYS = new Set([
  'rut',
  'canal_contacto',
  'contacto_telefono',
  'contacto_correo',
  'contacto_lugar',
  'contacto_whatsapp',
]);

function normalizeStatus(status) {
  return String(status === null || status === undefined ? '' : status)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function belongsToEntity(document, entity) {
  if (!document?.entity_id) return true;
  return (
    document.entity_id === entity.entity_id ||
    document.entity_id === entity.id ||
    (!entity.entity_id && !entity.id)
  );
}

function contactLabels(config, entity) {
  const rules = resolveFieldRules(config, 'entity');
  const defs = config?.customFields?.entity || [];
  const keys = new Set([
    ...defs
      .filter((def) => CONTACT_KEYS.has(def.key) || String(def.key).startsWith('contacto_'))
      .map((def) => def.key),
    ...Object.keys(entity || {}).filter(
      (key) => CONTACT_KEYS.has(key) || key.startsWith('contacto_')
    ),
  ]);
  return [...keys]
    .filter((key) => isFieldVisible(rules, key, entity))
    .map((key) => {
      const rule = rules[key] || {};
      const def = defs.find((item) => item.key === key) || {};
      const label = rule.label || def.label || key;
      return { key, label };
    });
}

function contactHtml(entity, config) {
  const fields = contactLabels(config, entity).filter((field) => {
    const value = entity?.[field.key];
    return value !== undefined && value !== null && value !== '';
  });
  if (!fields.length) return '<p class="empty-state">Sin datos de contacto registrados.</p>';
  return `<dl class="quick-view-contact-list">${fields
    .map(
      (field) =>
        `<div><dt>${escapeHtml(field.label)}</dt><dd data-field="${escapeHtml(field.key)}">${escapeHtml(entity[field.key])}</dd></div>`
    )
    .join('')}</dl>`;
}

function purchasesHtml(documents) {
  if (!documents.length) {
    return '<p class="empty-state">No hay compras cerradas ganadas.</p>';
  }
  const total = documents.reduce((sum, document) => sum + (Number(document.importe) || 0), 0);
  return `
    <p class="quick-view-total">Total comprado (USD): <strong>${escapeHtml(formatCurrencyUsd(total))}</strong></p>
    <ul class="quick-view-purchases">${documents
      .map(
        (document) =>
          `<li class="quick-view-purchase" data-document-id="${escapeHtml(document.id)}">
            <span class="quick-view-date">${escapeHtml(document.startDate || '—')}</span>
            <span class="quick-view-amount">${escapeHtml(formatCurrencyUsd(document.importe))}</span>
          </li>`
      )
      .join('')}</ul>`;
}

function historyHtml(documents) {
  if (!documents.length) {
    return '<p class="empty-state">Sin historial registrado.</p>';
  }
  return `<ol class="quick-view-history">${documents
    .map(
      (document) =>
        `<li class="quick-view-history-item" data-document-id="${escapeHtml(document.id)}">
          <span class="quick-view-date">${escapeHtml(document.startDate || '—')}</span>
          ${document.status ? `<span class="status-badge" data-status="${escapeHtml(document.status)}">${escapeHtml(document.status)}</span>` : ''}
          ${document.notes ? `<span>${escapeHtml(document.notes)}</span>` : ''}
          ${document.motivo_perdida ? `<span data-field="motivo_perdida">Motivo de pérdida: ${escapeHtml(document.motivo_perdida)}</span>` : ''}
        </li>`
    )
    .join('')}</ol>`;
}

function ticketsHtml(tickets) {
  if (!tickets.length) {
    return '<p class="empty-state">No hay tickets permitidos para este cliente.</p>';
  }
  return `<ul class="quick-view-tickets">${tickets
    .map((ticket) => {
      const label = ticket.label || ticket.alertLabel || ticket.status || '';
      const subject = ticket.asunto || '';
      return `<li class="quick-view-ticket" data-document-id="${escapeHtml(ticket.id)}">
        ${label ? `<span class="ticket-status">${escapeHtml(label)}</span>` : ''}
        ${subject ? `<span>${escapeHtml(subject)}</span>` : ''}
      </li>`;
    })
    .join('')}</ul>`;
}

export function renderClientQuickViewHtml(entity, documents = [], config = {}, options = {}) {
  const entityId = entity?.entity_id ?? entity?.id ?? '';
  if (!entity) {
    return `<div id="client-quick-view" class="quick-view" role="dialog" aria-modal="true" aria-labelledby="quick-view-title">
      <h2 id="quick-view-title">Cliente</h2>
      <p class="empty-state">Cliente no encontrado.</p>
      <div class="quick-view-actions">
        <button type="button" data-action="close-quick-view">Cerrar</button>
        <button type="button" data-action="view-entity-full" data-entity-id="">Ver ficha completa</button>
      </div>
    </div>`;
  }
  const allDocuments = Array.isArray(documents) ? documents : [];
  const scopedDocuments = allDocuments.filter((document) => belongsToEntity(document, entity));
  const historyDocuments = scopedDocuments.filter((document) => !isTicket(document));
  const wonDocuments = historyDocuments.filter(
    (document) => normalizeStatus(document.status) === 'cerrado ganado'
  );
  const chronological = [...historyDocuments].sort((a, b) =>
    String(a.startDate || '').localeCompare(String(b.startDate || ''))
  );
  const givenTickets = Array.isArray(options.tickets) ? options.tickets : null;
  const tickets = (givenTickets || scopedDocuments.filter(isTicket)).filter((ticket) =>
    belongsToEntity(ticket, entity)
  );

  return `<div id="client-quick-view" class="quick-view" role="dialog" aria-modal="true" aria-labelledby="quick-view-title" data-entity-id="${escapeHtml(entityId)}">
    <header class="quick-view-header">
      <h2 id="quick-view-title">${escapeHtml(entity.name || '')}</h2>
      ${entity.targetDate ? `<p class="quick-view-date">${escapeHtml(entity.targetDate)}</p>` : ''}
    </header>
    <section class="quick-view-section quick-view-contact">
      <h3>Datos de contacto</h3>
      ${contactHtml(entity, config)}
    </section>
    <section class="quick-view-section quick-view-purchases-section">
      <h3>Compras</h3>
      ${purchasesHtml(wonDocuments)}
    </section>
    <section class="quick-view-section quick-view-history-section">
      <h3>Historial</h3>
      ${historyHtml(chronological)}
    </section>
    <section class="quick-view-section quick-view-tickets-section">
      <h3>Tickets</h3>
      ${ticketsHtml(tickets)}
    </section>
    <footer class="quick-view-actions">
      <button type="button" data-action="close-quick-view">Cerrar</button>
      <button type="button" data-action="view-entity-full" data-entity-id="${escapeHtml(entityId)}">Ver ficha completa</button>
    </footer>
  </div>`;
}
