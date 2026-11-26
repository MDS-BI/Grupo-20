import { escapeHtml } from '../utils/sanitize.js';
import { getLabel } from '../module-config.js';
import { resolveEntityDateRule } from '../utils/entity-date.js';
import { getReadinessErrors, isFieldVisible, resolveFieldRules } from '../utils/field-rules.js';
import { renderDocumentListHtml } from './document-list.js';
import { DEFAULT_POSTVENTA_CONFIG, isTicket } from '../utils/postventa.js';

export function renderEntityDetailHtml(config, entity, documents) {
  if (!entity) {
    return `<p class="empty-state">${getLabel(config, 'entity')} no encontrada.</p>`;
  }
  const label = getLabel(config, 'entity');
  const policy = config?.detailPolicy?.entity || {};
  const readinessErrors = getReadinessErrors(entity, config);
  if (policy.blockWhenInvalid && Object.keys(readinessErrors).length) {
    const errorItems = Object.values(readinessErrors)
      .map((message) => `<li>${escapeHtml(message)}</li>`)
      .join('');
    const editAction =
      policy.offerEditAction === false
        ? ''
        : `<button type="button" data-action="edit-entity" data-id="${escapeHtml(entity.id)}">Editar ${escapeHtml(label.toLowerCase())}</button>`;
    return `
      <article id="entity-detail" class="entity-detail is-blocked" data-entity-id="${escapeHtml(entity.entity_id)}">
        <header class="entity-detail-header">
          <h2 id="entity-detail-title">${escapeHtml(entity.name)}</h2>
        </header>
        <div class="entity-detail-blocked" role="alert">
          <p>Esta ficha no se puede consultar hasta completar los datos obligatorios.</p>
          <ul>${errorItems}</ul>
          ${editAction}
        </div>
      </article>
    `;
  }

  const rules = resolveFieldRules(config, 'entity');
  const customFieldDefs = config?.customFields?.entity || [];
  const dateLabel = resolveEntityDateRule(config)?.label || 'Fecha objetivo';
  const customFieldsHtml = customFieldDefs
    .filter(
      (def) =>
        isFieldVisible(rules, def.key, entity) &&
        entity[def.key] !== undefined &&
        entity[def.key] !== null &&
        entity[def.key] !== ''
    )
    .map(
      (def) =>
        `<p class="entity-detail-custom" data-field="${escapeHtml(def.key)}">${escapeHtml(def.label || def.key)}: ${escapeHtml(entity[def.key])}</p>`
    )
    .join('');
  const postventa = config?.postventa || DEFAULT_POSTVENTA_CONFIG;
  const tickets = (documents || []).filter(isTicket);
  const postventaHtml = tickets.length
    ? `<section class="entity-detail-postventa">
        <h3>Postventa</h3>
        ${tickets
          .map(
            (ticket) => `<article class="entity-detail-ticket">
              <p>Asunto: ${escapeHtml(ticket.asunto || '')}</p>
              <p>Categoría: ${escapeHtml(postventa.categoryOptions.find((option) => option.value === ticket.categoria)?.label || ticket.categoria || '')}</p>
              <p>Prioridad: ${escapeHtml(postventa.priorityOptions.find((option) => option.value === ticket.prioridad)?.label || ticket.prioridad || '')}</p>
              <p>Estado: ${escapeHtml(ticket.status || '')}</p>
              <p>Nota de resolución: ${escapeHtml(ticket.nota_resolucion || '')}</p>
            </article>`
          )
          .join('')}
      </section>`
    : '';
  return `
    <article id="entity-detail" class="entity-detail" data-entity-id="${escapeHtml(entity.entity_id)}">
      <header class="entity-detail-header">
        <h2 id="entity-detail-title">${escapeHtml(entity.name)}</h2>
        <div id="entity-detail-info" class="entity-detail-info">
          ${isFieldVisible(rules, 'code', entity) ? `<p class="entity-detail-code">${escapeHtml(label)}: ${escapeHtml(entity.code)}</p>` : ''}
          ${isFieldVisible(rules, 'category', entity) && entity.category ? `<p>${escapeHtml(entity.category)}</p>` : ''}
          ${isFieldVisible(rules, 'description', entity) && entity.description ? `<p>${escapeHtml(entity.description)}</p>` : ''}
          ${entity.targetDate ? `<p>${escapeHtml(dateLabel)}: ${escapeHtml(entity.targetDate)}</p>` : ''}
          ${customFieldsHtml}
        </div>
      </header>
      ${postventaHtml}
      <section class="entity-detail-history">
        <h3>Historial de ${getLabel(config, 'documentPlural').toLowerCase()}</h3>
        <div id="entity-history" class="history-list">
          ${renderDocumentListHtml(documents, config)}
        </div>
        <p id="entity-history-empty" class="empty-state" ${documents.length ? 'hidden' : ''}>Este registro no tiene documentos asociados.</p>
      </section>
    </article>
  `;
}
