import { escapeHtml } from '../utils/sanitize.js';

export const RANK_OPTIONS = [
  ['n4_manager', 'Nivel 4 - Gerente comercial'],
  ['n3_marketing', 'Nivel 3 - Ejecutivo de Marketing'],
  ['n2_sales', 'Nivel 2 - Ejecutivo de Ventas'],
  ['n1_support', 'Nivel 1 - Atención al cliente'],
];

export function collectUserData(form) {
  const values = new FormData(form);
  return {
    username: String(values.get('username') || ''),
    password: String(values.get('password') || ''),
    rank: String(values.get('rank') || ''),
  };
}

export function renderUsersAdminHtml({ users = [], error = '', editing = null } = {}) {
  const options = RANK_OPTIONS.map(
    ([value, label]) =>
      `<option value="${value}" ${editing?.rank === value ? 'selected' : ''}>${label}</option>`
  ).join('');
  const rows = users
    .map(
      (user) => `
        <tr>
          <td>${escapeHtml(user.username)}</td>
          <td>${escapeHtml(RANK_OPTIONS.find(([value]) => value === user.rank)?.[1] || user.rank || '')}</td>
          <td>${user.active === false ? 'Inactivo' : 'Activo'}</td>
          <td>
            <button type="button" data-action="edit-user" data-id="${escapeHtml(user.id)}">Editar</button>
            ${
              user.active === false
                ? ''
                : `<button type="button" data-action="deactivate-user" data-id="${escapeHtml(user.id)}">Desactivar</button>`
            }
          </td>
        </tr>`
    )
    .join('');
  return `
    <section class="users-admin-view">
      <h2>Gestionar usuarios</h2>
      <p>La matriz de permisos se define en el código y no puede modificarse desde esta vista.</p>
      ${error ? `<p id="users-admin-error" role="alert">${escapeHtml(error)}</p>` : ''}
      <form id="user-form" novalidate>
        <label for="user-username">Usuario</label>
        <input id="user-username" name="username" value="${escapeHtml(editing?.username || '')}" required />
        <label for="user-password">Contraseña</label>
        <input id="user-password" name="password" type="password" ${editing ? '' : 'required'} />
        <label for="user-rank">Rango</label>
        <select id="user-rank" name="rank">${options}</select>
        <button type="submit">${editing ? 'Guardar' : 'Crear usuario'}</button>
      </form>
      <table>
        <thead><tr><th>Usuario</th><th>Rango</th><th>Estado</th><th>Acciones</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="4">No hay usuarios registrados.</td></tr>'}</tbody>
      </table>
    </section>
  `;
}
