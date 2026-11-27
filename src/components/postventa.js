import { escapeHtml } from '../utils/sanitize.js';
import { DEFAULT_POSTVENTA_CONFIG, computeTicketStats, isTicket } from '../utils/postventa.js';
import { ticketOptionsHtml } from './ticket-form.js';

const cardNodes = new WeakMap();

function postventaRoot() {
  return document.getElementById('app') || document.body;
}

function capturePostventaCards() {
  if (typeof document === 'undefined') return;
  const root = postventaRoot();
  const cards = root.querySelector('.postventa-cards');
  if (cards) cardNodes.set(root, cards);
}

function restorePostventaCards() {
  if (typeof document === 'undefined') return;
  const root = postventaRoot();
  const cards = root.querySelector('.postventa-cards');
  if (!cards) return;
  const cached = cardNodes.get(root);
  if (!cached) {
    cardNodes.set(root, cards);
    return;
  }
  if (cached === cards) return;
  cached.innerHTML = cards.innerHTML;
  cards.replaceWith(cached);
}

function beforePostventaAction(event) {
  if (typeof window !== 'undefined' && window.history) {
    const opensTicket = event.target?.closest?.('[data-action="ticket-form"]');
    if (opensTicket && postventaRoot().querySelector('.postventa-view')) {
      window.history.replaceState({}, '', `${window.location.pathname}?view=postventa`);
    }
  }
  capturePostventaCards();
}

if (typeof document !== 'undefined') {
  for (const type of ['click', 'submit', 'change']) {
    document.addEventListener(type, beforePostventaAction, true);
    document.addEventListener(type, restorePostventaCards);
  }
}

export function renderPostventaHtml(config, options = {}) {
  const {
    tickets = [],
    clients = [],
    canCreate = true,
    canTransition = true,
    ticketFormOpen = false,
    ticketFormHtml = '',
  } = options;
  const postventa = config?.postventa || DEFAULT_POSTVENTA_CONFIG;
  const visibleTickets = (Array.isArray(tickets) ? tickets : []).filter(isTicket);
  const stats = computeTicketStats({ documents: visibleTickets, config: postventa });
  const rows = visibleTickets.length
    ? visibleTickets
        .map((ticket) => {
          const client = clients.find((item) => item.entity_id === ticket.entity_id);
          const statusControl = canTransition
            ? `<select data-action="ticket-status-change" data-ticket-id="${escapeHtml(ticket.id)}" aria-label="Estado del ticket">
                ${ticketOptionsHtml(
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
        canCreate && !ticketFormOpen
          ? '<button type="button" class="primary" data-action="ticket-form">Nuevo Ticket</button>'
          : ''
      }
      <div class="postventa-cards">
        <article class="stat-card"><span class="stat-label">Tickets abiertos</span><span class="stat-value">${stats.abiertos}</span></article>
        <article class="stat-card"><span class="stat-label">En proceso</span><span class="stat-value">${stats.enProceso}</span></article>
        <article class="stat-card"><span class="stat-label">Resueltos</span><span class="stat-value">${stats.resueltos}</span></article>
      </div>
      ${
        ticketFormOpen
          ? ticketFormHtml
          : `<table class="client-management-table">
        <thead><tr><th>Cliente</th><th>Asunto</th><th>Categoría</th><th>Prioridad</th><th>Estado</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`
      }
    </section>`;
}
