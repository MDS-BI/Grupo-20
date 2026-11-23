import { MODULE_CONFIG, getConfig } from './module-config.js';
import {
  addEntity,
  addDocument,
  loadEntities,
  loadDocuments,
  saveEntities,
  saveDocuments,
} from './storage.js';

export const SEED_MARKER = '[SIMULACIÓN CRM]';
export const SEED_CODE_PREFIX = 'CLI-';
export const SEED_COUNT = 57;

export const SEED_CATEGORIES = ['Activo', 'Prospecto', 'Corporativo', 'PyME', 'VIP'];

const PEDIDOS_RANGES = {
  Prospecto: [0, 2],
  PyME: [2, 10],
  Activo: [6, 18],
  Corporativo: [12, 28],
  VIP: [20, 35],
};

const NAMES = [
  'Andes', 'Mapocho', 'Biobío', 'Cordillera', 'Arauco', 'Maipo',
  'Loa', 'Futaleufú', 'Toltén', 'Elqui', 'Aconcagua', 'Cautín',
];
const SUFFIXES = ['Servicios', 'Comercial', 'Industrial', 'Tecnología', 'Logística', 'Consultores'];
const LEGAL_FORMS = ['SpA', 'S.A.', 'Ltda.'];
const RUBROS = [
  'Retail y comercio', 'Servicios profesionales', 'Manufactura', 'Logística y transporte',
  'Tecnología', 'Agroindustria', 'Salud', 'Construcción', 'Turismo', 'Energía',
];
const EJECUTIVOS = ['María González', 'Carlos Rojas', 'Paula Muñoz', 'Javier Silva', 'Fernanda López'];

function resolveConfig() {
  const active = getConfig();
  return active?.customFields?.entity?.length ? active : MODULE_CONFIG;
}

function normalizeCode(code) {
  return String(code || '').trim().toLowerCase().replace(/\s+/g, '');
}

function isoDate(offsetDays) {
  return new Date(Date.now() + offsetDays * 86400000).toISOString().slice(0, 10);
}

export function rutDigit(body) {
  const digits = String(body).replace(/\D/g, '').split('').reverse();
  let sum = 0;
  let factor = 2;
  for (const digit of digits) {
    sum += Number(digit) * factor;
    factor = factor === 7 ? 2 : factor + 1;
  }
  const result = 11 - (sum % 11);
  if (result === 11) return '0';
  if (result === 10) return 'K';
  return String(result);
}

export function formatRut(body) {
  const clean = String(body).replace(/\D/g, '');
  const formatted = clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formatted}-${rutDigit(clean)}`;
}

export function isValidRut(rut) {
  const match = /^(?:\d{1,3}(?:\.\d{3}){1,2}|\d{7,8})-([\dkK])$/.exec(String(rut || '').trim());
  if (!match) return false;
  return rutDigit(match.input.split('-')[0]) === match[1].toUpperCase();
}

function buildRutBody(index) {
  return 10000000 + index * 7919 + index * index * 13;
}

function buildPedidos(category, index) {
  const [min, max] = PEDIDOS_RANGES[category];
  const span = max - min + 1;
  return min + ((index * 7 + (index % 4) * 3) % span);
}

function customValues(defs, index, ctx) {
  const values = {};
  for (const def of defs || []) {
    const key = def.key;
    if (key === 'rut') values[key] = ctx.rut;
    else if (key === 'pedidos') values[key] = ctx.pedidos;
    else if (key === 'rubro') values[key] = ctx.rubro;
    else if (key === 'ejecutivo_asignado') values[key] = ctx.ejecutivo;
    else if (key === 'canal_contacto') values[key] = def.options?.[index % def.options.length] || 'llamada';
    else if (def.type === 'select') values[key] = def.options?.[index % def.options.length] || '';
    else if (def.type === 'number') values[key] = (index * 3) % 20;
    else if (def.type === 'date') values[key] = isoDate(5 + (index % 30));
    else if (def.type === 'boolean') values[key] = index % 2 === 0;
    else values[key] = `Dato ${key} ${index + 1}`;
  }
  return values;
}

function stateOrFallback(state, states) {
  return states.includes(state) ? state : states[0];
}

function buildInteractions(index, client, config) {
  const states = config.statusLifecycle?.states?.length
    ? config.statusLifecycle.states
    : ['prospecto', 'contactado', 'en negociacion', 'cerrado ganado', 'pendiente'];
  const count = client.pedidos === 0 ? 1 : Math.min(4, 1 + Math.floor(client.pedidos / 9));
  const interactions = [];

  for (let step = 0; step < count; step += 1) {
    const isLast = step === count - 1;
    const desired = isLast ? (client.pedidos > 0 ? 'cerrado ganado' : 'prospecto') : ['contactado', 'en negociacion', 'pendiente'][step % 3];
    const status = stateOrFallback(desired, states);
    const daysAgo = (count - step) * 45 + (index % 7);
    const startDate = isoDate(-daysAgo);
    const endDate = isLast && client.targetDate > startDate ? client.targetDate : isoDate(-daysAgo + 2);
    const marker = `${SEED_MARKER}|${client.code}|${String(step + 1).padStart(2, '0')}`;
    const from = step === 0 ? 1 : Math.floor((client.pedidos * step) / count) + 1;
    const to = Math.floor((client.pedidos * (step + 1)) / count);
    const pedidosDetalle = client.pedidos ? `Pedidos ${from}-${to} de ${client.pedidos}.` : 'Sin pedidos aún, contacto inicial.';
    interactions.push({
      marker,
      status,
      startDate,
      endDate,
      notes: `${marker} ${status}. ${pedidosDetalle} Canal: ${client.canal_contacto}.`,
      ...customValues(config.customFields.document, index + step, config),
    });
  }
  return interactions;
}

export function buildSeedClients(count = SEED_COUNT, config = resolveConfig()) {
  const clients = [];
  for (let index = 0; index < count; index += 1) {
    const category = SEED_CATEGORIES[index % SEED_CATEGORIES.length];
    const pedidos = buildPedidos(category, index);
    const rubro = RUBROS[index % RUBROS.length];
    const canal = config.customFields.entity.find((def) => def.key === 'canal_contacto')?.options?.[index % 4] || 'llamada';
    const client = {
      name: `${NAMES[index % NAMES.length]} ${SUFFIXES[Math.floor(index / NAMES.length) % SUFFIXES.length]} ${LEGAL_FORMS[index % LEGAL_FORMS.length]}`,
      code: `${SEED_CODE_PREFIX}${String(index + 1).padStart(3, '0')}`,
      category,
      description: `${SEED_MARKER} ${rubro}. Cliente ${category.toLowerCase()} con ${pedidos} pedidos; contacto preferido por ${canal}.`,
      targetDate: isoDate(3 + ((index * 5) % 58)),
      rut: formatRut(buildRutBody(index)),
      pedidos,
      ejecutivo: EJECUTIVOS[index % EJECUTIVOS.length],
      canal_contacto: canal,
      rubro,
      ...customValues(config.customFields.entity, index, {
        rut: formatRut(buildRutBody(index)),
        pedidos,
        rubro,
        ejecutivo: EJECUTIVOS[index % EJECUTIVOS.length],
        canal,
      }),
    };
    client._interactions = buildInteractions(index, client, config);
    clients.push(client);
  }
  return clients;
}

function docMarker(notes) {
  const first = String(notes || '').trim().split(/\s+/)[0];
  return first && first.includes(SEED_MARKER) ? first : null;
}

function isSeededEntity(entity) {
  return (
    /^CLI-\d{3}$/.test(normalizeCode(entity.code).toUpperCase()) &&
    String(entity.description || '').includes(SEED_MARKER)
  );
}

export function seedClients({ count = SEED_COUNT, config = resolveConfig() } = {}) {
  const existingCodes = new Set(loadEntities().map((entity) => normalizeCode(entity.code)));
  const existingMarkers = new Set(loadDocuments().map((doc) => docMarker(doc.notes)).filter(Boolean));
  const stats = {
    clientsCreated: 0,
    clientsSkipped: 0,
    interactionsCreated: 0,
    interactionsSkipped: 0,
    errors: [],
  };

  for (const client of buildSeedClients(count, config)) {
    const codeKey = normalizeCode(client.code);
    if (existingCodes.has(codeKey)) {
      stats.clientsSkipped += 1;
      continue;
    }
    let created;
    try {
      created = addEntity(client, { customFieldDefs: config.customFields.entity });
      existingCodes.add(codeKey);
      stats.clientsCreated += 1;
    } catch (error) {
      stats.errors.push(`${client.code}: ${error.message}`);
      continue;
    }

    for (const interaction of client._interactions) {
      if (existingMarkers.has(interaction.marker)) {
        stats.interactionsSkipped += 1;
        continue;
      }
      try {
        addDocument(
          { ...interaction, entity_id: created.entity_id },
          { customFieldDefs: config.customFields.document, statusLifecycle: config.statusLifecycle },
        );
        existingMarkers.add(interaction.marker);
        stats.interactionsCreated += 1;
      } catch (error) {
        stats.errors.push(`${client.code}: ${error.message}`);
      }
    }
  }

  return {
    ...stats,
    totalEntities: loadEntities().length,
    totalDocuments: loadDocuments().length,
  };
}

export function clearSeedData() {
  const entities = loadEntities();
  const seeded = entities.filter(isSeededEntity);
  const seededIds = new Set(seeded.map((entity) => entity.entity_id));
  const documents = loadDocuments();
  const seededDocs = documents.filter(
    (doc) => seededIds.has(doc.entity_id) || Boolean(docMarker(doc.notes)),
  );

  saveEntities(entities.filter((entity) => !seededIds.has(entity.entity_id)));
  saveDocuments(documents.filter((doc) => !seededIds.has(doc.entity_id) && !docMarker(doc.notes)));

  return {
    entitiesRemoved: seeded.length,
    documentsRemoved: seededDocs.length,
    totalEntities: loadEntities().length,
    totalDocuments: loadDocuments().length,
  };
}
