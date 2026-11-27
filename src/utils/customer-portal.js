import { MESSAGES } from './messages.js';
import { DEFAULT_POSTVENTA_CONFIG } from './postventa.js';
import { sanitizeText } from './sanitize.js';
import { normalizeText } from './search.js';

function normalizeContact(value) {
  return normalizeText(value).replace(/\s+/g, '');
}

function firstNonEmpty(...values) {
  return values.find((value) => String(value ?? '').trim()) ?? '';
}

export function findClientByEmailOrPhone(clients = [], email = '', phone = '') {
  const queries = [normalizeContact(email), normalizeContact(phone)].filter(Boolean);
  if (!queries.length) return null;
  let match = null;
  const safeClients = Array.isArray(clients) ? clients : [];
  for (const client of safeClients) {
    const contacts = [
      client?.contacto_correo,
      client?.email,
      client?.contacto_telefono,
      client?.phone,
    ]
      .map(normalizeContact)
      .filter(Boolean);
    if (!contacts.some((contact) => queries.includes(contact))) continue;
    if (!match || String(client.createdAt || '') < String(match.createdAt || '')) match = client;
  }
  return match;
}

function optionParts(option) {
  if (typeof option === 'string') return { value: option, label: option };
  const value = option?.value ?? '';
  return { value, label: option?.label || value };
}

function resolveCategory(options, categoria) {
  const requested = normalizeText(categoria);
  const selected = options.find((option) => {
    const { value, label } = optionParts(option);
    return normalizeText(value) === requested || normalizeText(label) === requested;
  });
  if (!selected) {
    const fallback = sanitizeText(categoria);
    return { value: fallback, label: fallback };
  }
  const { value, label } = optionParts(selected);
  return { value: sanitizeText(value), label: sanitizeText(label || value) };
}

export function buildPortalTicketValues(values = {}, { entities = [], config = null } = {}) {
  const email = firstNonEmpty(values.correo_cliente, values.email);
  const phone = firstNonEmpty(values.correo_cliente, values.phone);
  const categoriaInput = firstNonEmpty(values.categoria);
  const descripcion = firstNonEmpty(values.descripcion, values.descripcion_del_problema);
  if (!email && !phone) {
    return { errors: { _form: MESSAGES.required }, values: null };
  }
  if (!categoriaInput || !descripcion) {
    return { errors: { _form: MESSAGES.required }, values: null };
  }
  const client = findClientByEmailOrPhone(Array.isArray(entities) ? entities : [], email, phone);
  if (!client) {
    return { errors: { _form: MESSAGES.clientNotFound }, values: null };
  }
  const options =
    config?.postventa?.categoryOptions ||
    config?.categoryOptions ||
    DEFAULT_POSTVENTA_CONFIG.categoryOptions ||
    [];
  const category = resolveCategory(options, categoriaInput);
  return {
    errors: {},
    values: {
      entity_id: client.entity_id || client.id || '',
      ticket: true,
      asunto: category.label,
      categoria: category.value,
      notes: sanitizeText(descripcion),
      status: 'Abierto',
      prioridad: 'media',
    },
  };
}
