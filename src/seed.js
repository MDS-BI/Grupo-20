import { MODULE_CONFIG, getConfig } from './module-config.js';
import { formatRut, isValidRut, rutDigit } from './utils/field-formats.js';
import { localTodayISO } from './utils/entity-date.js';
import {
  addEntity,
  addDocument,
  loadEntities,
  loadDocuments,
  saveEntities,
  saveDocuments,
} from './storage.js';

export { formatRut, isValidRut, rutDigit };

export const SEED_MARKER = '[SIMULACIÓN CRM]';
export const SEED_CODE_PREFIX = 'CLI-';
export const SEED_COUNT = 57;

export const SEED_CATEGORIES = ['Activo', 'Prospecto', 'Corporativo', 'Pyme', 'VIP'];

const NAMES = [
  'Andes',
  'Mapocho',
  'Biobío',
  'Cordillera',
  'Arauco',
  'Maipo',
  'Loa',
  'Futaleufú',
  'Toltén',
  'Elqui',
  'Aconcagua',
  'Cautín',
];
const SUFFIXES = ['Servicios', 'Comercial', 'Industrial', 'Tecnología', 'Logística', 'Consultores'];
const LEGAL_FORMS = ['SpA', 'S.A.', 'Ltda.'];
const RUBROS = [
  'Dependiente',
  'Independiente formal',
  'Independiente informal',
  'Jubilado',
  'Dueño/a de casa',
  'Estudiante',
  'FFAA',
  'Rentista',
  'Jubilado - FFAA',
  'Cesante',
];
const EJECUTIVOS = [
  'María González',
  'Carlos Rojas',
  'Paula Muñoz',
  'Javier Silva',
  'Fernanda López',
];

const CONTACT_VALUES = {
  llamada: (index) => ({
    key: 'contacto_telefono',
    value: `+56 9 ${String(10000000 + index * 7919).slice(-8)}`,
  }),
  correo: (index) => ({ key: 'contacto_correo', value: `cliente${index + 1}@ejemplo.cl` }),
  reunion: (index) => ({ key: 'contacto_lugar', value: `Sala de reuniones ${index + 1}` }),
  whatsapp: (index) => ({
    key: 'contacto_whatsapp',
    value: `+56 9 ${String(20000000 + index * 7919).slice(-8)}`,
  }),
};

function resolveConfig() {
  const active = getConfig();
  return active?.customFields?.entity?.length ? active : MODULE_CONFIG;
}

function normalizeCode(code) {
  return String(code || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
}

function isoDate(offsetDays) {
  const today = localTodayISO().split('-').map(Number);
  const date = new Date(today[0], today[1] - 1, today[2] + offsetDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildRutBody(index) {
  return 10000000 + index * 7919 + index * index * 13;
}

const NON_SEED_CUSTOM_KEYS = new Set([
  'estado_comercial',
  'consentimiento',
  'consentimiento_fecha',
  'consentimiento_version',
  'automation_key',
]);

function customValues(defs, index, ctx) {
  const values = {};
  for (const def of defs || []) {
    const key = def.key;
    if (NON_SEED_CUSTOM_KEYS.has(key)) continue;
    if (key.startsWith('contacto_')) {
      if (key === ctx.contact.key) values[key] = ctx.contact.value;
    } else if (key === 'rut') values[key] = ctx.rut;
    else if (key === 'rubro') values[key] = ctx.rubro;
    else if (key === 'ejecutivo_asignado') values[key] = ctx.ejecutivo;
    else if (key === 'canal_contacto')
      values[key] = def.options?.[index % def.options.length] || 'llamada';
    else if (def.type === 'select') values[key] = def.options?.[index % def.options.length] || '';
    else if (def.type === 'number') values[key] = (index * 3) % 20;
    else if (def.type === 'date') values[key] = isoDate(-(5 + (index % 30)));
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
  const count = 1 + (index % 4);
  const interactions = [];

  for (let step = 0; step < count; step += 1) {
    const isLast = step === count - 1;
    const desired = isLast
      ? 'cerrado ganado'
      : ['contactado', 'en negociacion', 'pendiente'][step % 3];
    const status = stateOrFallback(desired, states);
    const daysAgo = (count - step) * 45 + (index % 7);
    const startDate = isoDate(-daysAgo);
    const endDate =
      isLast && client.targetDate > startDate ? client.targetDate : isoDate(-daysAgo + 2);
    const marker = `${SEED_MARKER}|${client.code}|${String(step + 1).padStart(2, '0')}`;
    interactions.push({
      marker,
      status,
      startDate,
      endDate,
      notes: `${marker} ${status}. Cliente ${client.category.toLowerCase()}; contacto preferido por ${client.canal_contacto}.`,
      ...customValues(config.customFields.document, index + step, config),
    });
  }
  return interactions;
}

export function buildSeedClients(count = SEED_COUNT, config = resolveConfig()) {
  const clients = [];
  for (let index = 0; index < count; index += 1) {
    const category = SEED_CATEGORIES[index % SEED_CATEGORIES.length];
    const rubro = RUBROS[index % RUBROS.length];
    const canal =
      config.customFields.entity.find((def) => def.key === 'canal_contacto')?.options?.[
        index % 4
      ] || 'llamada';
    const contact = CONTACT_VALUES[canal](index);
    const rut = formatRut(buildRutBody(index));
    const client = {
      name: `${NAMES[index % NAMES.length]} ${SUFFIXES[Math.floor(index / NAMES.length) % SUFFIXES.length]} ${LEGAL_FORMS[index % LEGAL_FORMS.length]}`,
      code: `${SEED_CODE_PREFIX}${String(index + 1).padStart(3, '0')}`,
      category,
      description: `${SEED_MARKER} ${rubro}. Cliente ${category.toLowerCase()}; contacto preferido por ${canal}.`,
      targetDate: isoDate(-(365 * (25 + (index % 45)) + (index % 365))),
      rut,
      ejecutivo_asignado: EJECUTIVOS[index % EJECUTIVOS.length],
      canal_contacto: canal,
      rubro,
      ...customValues(config.customFields.entity, index, {
        rut,
        rubro,
        ejecutivo: EJECUTIVOS[index % EJECUTIVOS.length],
        canal,
        contact,
      }),
    };
    client._interactions = buildInteractions(index, client, config);
    clients.push(client);
  }
  return clients;
}

function docMarker(notes) {
  const first = String(notes || '')
    .trim()
    .split(/\s+/)[0];
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
  const existingMarkers = new Set(
    loadDocuments()
      .map((doc) => docMarker(doc.notes))
      .filter(Boolean)
  );
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
      const { code: _code, _interactions, ...entityData } = client;
      created = addEntity(entityData, { customFieldDefs: config.customFields.entity });
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
          { customFieldDefs: config.customFields.document, statusLifecycle: config.statusLifecycle }
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
    (doc) => seededIds.has(doc.entity_id) || Boolean(docMarker(doc.notes))
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
