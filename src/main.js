import './styles.css';
import { initApp } from './app.js';
import { MODULE_CONFIG } from './module-config.js';

const root = document.getElementById('app');
const app = initApp(root, { rawConfig: MODULE_CONFIG });

document.title = app.getState().config.moduleName;
