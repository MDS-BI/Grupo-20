import { escapeHtml } from '../utils/sanitize.js';

const SEED_LABELS = {
  'user-gerente': 'Gerente',
  'user-marketing': 'Marketing',
  'user-ventas': 'Ventas',
  'user-atencion': 'Atención al Cliente',
};

export function renderLoginHtml(users = [], error = '') {
  const message = error || 'Selecciona una opción para continuar.';
  const buttons = (Array.isArray(users) ? users : [])
    .filter((user) => user?.active === true)
    .map((user) => {
      const label = SEED_LABELS[user.id] || user.username || '';
      return `<button type="button" data-action="login-user" data-user-id="${escapeHtml(user.id)}">${escapeHtml(label)}</button>`;
    })
    .join('');
  return `
    <section class="login-view">
      <h1>Iniciar sesión</h1>
      <p id="login-message" role="alert">${escapeHtml(message)}</p>
      <div class="login-grid" role="group">${buttons}</div>
    </section>
  `;
}
