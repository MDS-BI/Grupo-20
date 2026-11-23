import fs from 'node:fs';
import path from 'node:path';

const storageFile = path.resolve(process.cwd(), '.crm-seed-storage.json');

function readStore() {
  try {
    return JSON.parse(fs.readFileSync(storageFile, 'utf8'));
  } catch {
    return {};
  }
}

const store = readStore();
const persist = () => fs.writeFileSync(storageFile, JSON.stringify(store));

globalThis.localStorage = {
  getItem: (key) => (Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null),
  setItem: (key, value) => {
    store[key] = String(value);
    persist();
  },
  removeItem: (key) => {
    delete store[key];
    persist();
  },
  clear: () => {
    for (const key of Object.keys(store)) delete store[key];
    persist();
  },
};

const { MODULE_CONFIG, setActiveConfig } = await import('../src/module-config.js');
setActiveConfig(MODULE_CONFIG);

const { buildSeedClients, seedClients, clearSeedData } = await import('../src/seed.js');
const args = process.argv.slice(2);

if (args.includes('--clear')) {
  const result = clearSeedData();
  console.log(
    `Datos simulados eliminados: ${result.entitiesRemoved} clientes y ${result.documentsRemoved} interacciones. ` +
      `Quedan ${result.totalEntities} clientes y ${result.totalDocuments} interacciones.`,
  );
} else if (args.includes('--preview')) {
  console.table(
    buildSeedClients().map(({ name, code, category, rut, pedidos, targetDate }) => ({
      name, code, category, rut, pedidos, targetDate,
    })),
  );
} else {
  const result = seedClients();
  console.log(
    `Clientes creados: ${result.clientsCreated} (omitidos: ${result.clientsSkipped}). ` +
      `Interacciones creadas: ${result.interactionsCreated} (omitidas: ${result.interactionsSkipped}). ` +
      `Totales: ${result.totalEntities} clientes y ${result.totalDocuments} interacciones.`,
  );
  if (result.errors.length) console.warn('Incidencias:', result.errors);
}
