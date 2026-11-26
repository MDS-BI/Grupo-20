import { escapeHtml } from '../utils/sanitize.js';
import { DEFAULT_POSTVENTA_CONFIG } from '../utils/postventa.js';

export function ticketOptionsHtml(options, selected, placeholder) {
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

export function renderTicketFormHtml(config, options = {}) {
  const { clients = [], formValues = {}, formErrors = {}, ticketClientSearch = '' } = options;
  const postventa = config?.postventa || DEFAULT_POSTVENTA_CONFIG;
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

  return `<form id="ticket-form" class="ticket-form">
    ${formError}
    <label for="ticket-client-search">Buscar cliente</label>
    <input id="ticket-client-search" type="search" value="${escapeHtml(ticketClientSearch)}" placeholder="Buscar por nombre" />
    <label for="ticket-client">Cliente</label>
    <select id="ticket-client" name="entity_id" required>
      ${ticketOptionsHtml(
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
      ${ticketOptionsHtml(postventa.categoryOptions, formValues.categoria || '', '-- Selecciona --')}
    </select>
    <label for="ticket-prioridad">Prioridad</label>
    <select id="ticket-prioridad" name="prioridad" required>
      ${ticketOptionsHtml(postventa.priorityOptions, formValues.prioridad || '', '-- Selecciona --')}
    </select>
    <label for="ticket-status">Estado</label>
    <select id="ticket-status" name="status">
      ${ticketOptionsHtml(
        postventa.states.map((state) => ({ value: state, label: state })),
        formValues.status || postventa.states[0],
        ''
      )}
    </select>
    <label for="ticket-nota">Nota de resolución</label>
    <textarea id="ticket-nota" name="nota_resolucion">${escapeHtml(formValues.nota_resolucion || '')}</textarea>
    <div class="form-actions">
      <button type="submit" class="primary">Guardar ticket</button>
    </div>
  </form>`;
}
