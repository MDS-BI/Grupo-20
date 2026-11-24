import { escapeHtml } from '../utils/sanitize.js';

export function renderLoginHtml(error = '') {
  const message = error || 'Inicia sesión para continuar.';
  return `
    <section class="login-view">
      <h1>Iniciar sesión</h1>
      <p id="login-message" role="alert">${escapeHtml(message)}</p>
      <form id="login-form" novalidate>
        <div class="form-field">
          <label for="login-username">Usuario</label>
          <input id="login-username" name="username" autocomplete="username" required />
        </div>
        <div class="form-field">
          <label for="login-password">Contraseña</label>
          <input id="login-password" name="password" type="password" autocomplete="current-password" required />
        </div>
        <button type="submit">Ingresar</button>
      </form>
    </section>
  `;
}
