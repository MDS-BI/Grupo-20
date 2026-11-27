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

function renderFieldHtml({ id, label, hint, required, control }) {
  return `<div class="form-field"><label for="${id}">${escapeHtml(label)}${required ? ' *' : ''}</label>${control}<p class="field-hint">${escapeHtml(hint)}</p></div>`;
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

  return `<form id="ticket-form" class="ticket-form client-form-section">
    <h2>Nuevo Ticket</h2>
    ${formError}
    <div class="ticket-client-search">
      <label for="ticket-client-search">Buscar cliente</label>
      <input id="ticket-client-search" type="search" value="${escapeHtml(ticketClientSearch)}" placeholder="Buscar por nombre o código" />
      <p class="field-hint">Filtra la lista de clientes activos.</p>
    </div>
    ${renderFieldHtml({
      id: 'ticket-client',
      label: 'Cliente',
      hint: 'Selecciona el cliente asociado al ticket.',
      required: true,
      control: `<select id="ticket-client" name="entity_id" required>
        ${ticketOptionsHtml(
          filteredClients.map((client) => ({
            value: client.entity_id,
            label: `${client.name} (${client.code})`,
          })),
          formValues.entity_id || '',
          '-- Selecciona --'
        )}
      </select>`,
    })}
    ${renderFieldHtml({
      id: 'ticket-asunto',
      label: 'Asunto',
      hint: 'Describe brevemente el problema.',
      required: true,
      control: `<input id="ticket-asunto" name="asunto" type="text" value="${escapeHtml(formValues.asunto || '')}" required />`,
    })}
    ${renderFieldHtml({
      id: 'ticket-categoria',
      label: 'Categoría',
      hint: 'Clasifica el ticket por su tipo.',
      required: true,
      control: `<select id="ticket-categoria" name="categoria" required>
        ${ticketOptionsHtml(postventa.categoryOptions, formValues.categoria || '', '-- Selecciona --')}
      </select>`,
    })}
    ${renderFieldHtml({
      id: 'ticket-prioridad',
      label: 'Prioridad',
      hint: 'Define la urgencia del ticket.',
      required: true,
      control: `<select id="ticket-prioridad" name="prioridad" required>
        ${ticketOptionsHtml(postventa.priorityOptions, formValues.prioridad || '', '-- Selecciona --')}
      </select>`,
    })}
    ${renderFieldHtml({
      id: 'ticket-status',
      label: 'Estado',
      hint: 'Estado inicial del ticket.',
      required: false,
      control: `<select id="ticket-status" name="status">
        ${ticketOptionsHtml(
          postventa.states.map((state) => ({ value: state, label: state })),
          formValues.status || postventa.states[0],
          ''
        )}
      </select>`,
    })}
    ${renderFieldHtml({
      id: 'ticket-nota',
      label: 'Nota de resolución',
      hint: 'Solo se guarda cuando el estado es Resuelto.',
      required: false,
      control: `<textarea id="ticket-nota" name="nota_resolucion">${escapeHtml(formValues.nota_resolucion || '')}</textarea>`,
    })}
    <div class="form-actions">
      <button type="button" data-action="cancel-ticket-form">Cancelar</button>
      <button type="submit" class="primary">Guardar ticket</button>
    </div>
  </form>`;
}
