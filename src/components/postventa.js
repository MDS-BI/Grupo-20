import { escapeHtml } from '../utils/sanitize.js';
import { DEFAULT_POSTVENTA_CONFIG, computeTicketStats } from '../utils/postventa.js';

function optionsHtml(options, selected, placeholder) {
  const placeholderHtml = placeholder
    ? `<option value=""${selected ? '' : ' selected'}>${escapeHtml(placeholder)}</option>`
    : '';
  return `${placeholderHtml}${options
    .map(
      (option) =>
        `<option value="${escapeHtml(option.value)}"${selected === option.value ? ' selected' : ''}>${escapeHtml(option.label)}</option>`
    )
    .join('')}`;
}

export function renderPostventaHtml(config, options = {}) {
  const {
    tickets = [],
    clients = [],
    formOpen = false,
    formValues = {},
    formErrors = {},
    ticketClientSearch = '',
    canCreate = true,
    canTransition = true,
  } = options;
  const postventa = config?.postventa || DEFAULT_POSTVENTA_CONFIG;
  const stats = computeTicketStats({ documents: tickets, config: postventa });
  const searchText = String(ticketClientSearch || '')
    .trim()
    .toLowerCase();
  const filteredClients = clients.filter((client) => {
    if (!searchText) return true;
    return [client.name, client.code]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(searchText));
  });
  const formError = formErrors._form
    ? `<p id="ticket-form-error" class="form-error" role="alert">${escapeHtml(formErrors._form)}</p>`
    : '';
  const formHtml =
    formOpen && canCreate
      ? `<form id="ticket-form" class="ticket-form">
          ${formError}
          <label for="ticket-client-search">Buscar cliente</label>
          <input id="ticket-client-search" type="search" value="${escapeHtml(ticketClientSearch)}" placeholder="Buscar por nombre" />
          <label for="ticket-client">Cliente</label>
          <select id="ticket-client" name="entity_id" required>
            ${optionsHtml(
              filteredClients.map((client) => ({
                value: client.entity_id,
                label: `${client.name} (${client.code})`,
              })),
              formValues.entity_id || '',
              '-- Selecciona --'
            )}
          </select>
          <label for="ticket-asunto">Asunto</label>
          <input id="ticket-asunto" name="asunto" type="text" value="${escapeHtml(formValues.asunto || '')}" required />
          <label for="ticket-categoria">Categoría</label>
          <select id="ticket-categoria" name="categoria" required>
            ${optionsHtml(postventa.categoryOptions, formValues.categoria || '', '-- Selecciona --')}
          </select>
          <label for="ticket-prioridad">Prioridad</label>
          <select id="ticket-prioridad" name="prioridad" required>
            ${optionsHtml(postventa.priorityOptions, formValues.prioridad || '', '-- Selecciona --')}
          </select>
          <label for="ticket-status">Estado</label>
          <select id="ticket-status" name="status">
            ${optionsHtml(
              postventa.states.map((state) => ({ value: state, label: state })),
              formValues.status || postventa.states[0],
              ''
            )}
          </select>
          <label for="ticket-nota">Nota de resolución</label>
          <textarea id="ticket-nota" name="nota_resolucion">${escapeHtml(formValues.nota_resolucion || '')}</textarea>
          <div class="form-actions">
            <button type="submit" class="primary">Guardar ticket</button>
            <button type="button" data-action="cancel-ticket-form">Cancelar</button>
          </div>
        </form>`
      : '';
  const rows = tickets.length
    ? tickets
        .map((ticket) => {
          const client = clients.find((item) => item.entity_id === ticket.entity_id);
          const statusControl = canTransition
            ? `<select data-action="ticket-status-change" data-ticket-id="${escapeHtml(ticket.id)}" aria-label="Estado del ticket">
                ${optionsHtml(
                  postventa.states.map((state) => ({ value: state, label: state })),
                  ticket.status,
                  ''
                )}
              </select>
              <input data-ticket-note="${escapeHtml(ticket.id)}" type="text" value="${escapeHtml(ticket.nota_resolucion || '')}" placeholder="Nota de resolución" />`
            : `<span>${escapeHtml(ticket.status)}</span>`;
          return `<tr data-ticket-id="${escapeHtml(ticket.id)}">
            <td>${escapeHtml(client?.name || ticket.entity_id || '')}</td>
            <td>${escapeHtml(ticket.asunto || '')}</td>
            <td>${escapeHtml(postventa.categoryOptions.find((option) => option.value === ticket.categoria)?.label || ticket.categoria || '')}</td>
            <td>${escapeHtml(postventa.priorityOptions.find((option) => option.value === ticket.prioridad)?.label || ticket.prioridad || '')}</td>
            <td>${statusControl}</td>
          </tr>`;
        })
        .join('')
    : '<tr><td colspan="5">No hay tickets registrados.</td></tr>';

  return `<h1>Postventa</h1>
    <section class="postventa-view">
      ${
        canCreate
          ? '<button type="button" class="primary" data-action="ticket-form">Nuevo Ticket</button>'
          : ''
      }
      ${formHtml}
      <div class="postventa-cards">
        <article class="stat-card"><span class="stat-label">Tickets abiertos</span><span class="stat-value">${stats.abiertos}</span></article>
        <article class="stat-card"><span class="stat-label">En proceso</span><span class="stat-value">${stats.enProceso}</span></article>
        <article class="stat-card"><span class="stat-label">Resueltos</span><span class="stat-value">${stats.resueltos}</span></article>
      </div>
      <table class="client-management-table">
        <thead><tr><th>Cliente</th><th>Asunto</th><th>Categoría</th><th>Prioridad</th><th>Estado</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </section>`;
}
