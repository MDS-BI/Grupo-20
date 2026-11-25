import './styles.css';
import { initApp } from './app.js';
import { MODULE_CONFIG } from './module-config.js';
import { ensureSeedUsers } from './auth.js';
ensureSeedUsers();

const root = document.getElementById('app');
const app = initApp(root, { rawConfig: MODULE_CONFIG, enableAuth: true });

document.title = app.getState().config.moduleName;
