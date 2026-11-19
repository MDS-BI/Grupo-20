import './styles.css';
import { initApp } from './app.js';
import { MODULE_CONFIG } from './module-config.js';
import { buildSeedClients, seedClients, clearSeedData } from './seed.js';

const root = document.getElementById('app');
const app = initApp(root, { rawConfig: MODULE_CONFIG });

document.title = app.getState().config.moduleName;

window.crmSeed = {
  run() {
    const result = seedClients();
    console.info(`CRM Comercial: ${result.clientsCreated} clientes y ${result.interactionsCreated} interacciones simulados creados.`);
    window.location.reload();
    return result;
  },
  clear() {
    const result = clearSeedData();
    console.info(`CRM Comercial: ${result.entitiesRemoved} clientes y ${result.documentsRemoved} interacciones simulados eliminados.`);
    window.location.reload();
    return result;
  },
  preview: buildSeedClients,
};

window.crmDashboard = {
  setDemoMode: app.setDemoMode,
};
