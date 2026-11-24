import { escapeHtml } from '../utils/sanitize.js';

function teamOptions(teams, selectedId) {
  return teams
    .map((team) => `<option value="${escapeHtml(team.id)}" ${team.id === selectedId ? 'selected' : ''}>${escapeHtml(team.name)}</option>`)
    .join('');
}

export function renderMarketingTeamHtml({
  teams = [],
  metrics = { teams: [], totals: { realMonthly: 0, monthlyGoal: 0 } },
  editingTeamId = null,
  editingMemberId = null,
  teamFormValues = {},
  memberFormValues = {},
} = {}) {
  const metricsByTeam = new Map(metrics.teams.map((team) => [team.id, team]));
  const total = metrics.totals || { realMonthly: 0, monthlyGoal: 0 };
  return `
    <section class="marketing-team marketing-panel">
      <h2>Equipos de ventas y logros</h2>
      <div class="team-totals">
        <div class="stat-card"><span class="stat-value">$${Number(total.realMonthly || 0).toFixed(2)}</span><span class="stat-label">Real mensual</span></div>
        <div class="stat-card"><span class="stat-value">$${Number(total.monthlyGoal || 0).toFixed(2)}</span><span class="stat-label">Objetivo mensual</span></div>
      </div>
      <form id="team-form" class="marketing-form" novalidate>
        <label>Nombre del equipo
          <input name="teamName" value="${escapeHtml(teamFormValues.name || '')}" required />
        </label>
        <button type="submit">${editingTeamId ? 'Guardar equipo' : 'Crear equipo'}</button>
        ${editingTeamId ? '<button type="button" data-action="cancel-team-edit">Cancelar</button>' : ''}
      </form>
      <form id="team-member-form" class="marketing-form" novalidate>
        <label>Equipo
          <select name="teamId" required><option value="">-- Selecciona --</option>${teamOptions(teams, memberFormValues.teamId)}</select>
        </label>
        <label>Nombre del integrante
          <input name="memberName" value="${escapeHtml(memberFormValues.name || '')}" required />
        </label>
        <label>Cargo
          <input name="memberRole" value="${escapeHtml(memberFormValues.role || '')}" required />
        </label>
        <label class="checkbox-field"><input type="checkbox" name="memberActive" ${memberFormValues.active === false ? '' : 'checked'} /> Activo</label>
        <button type="submit">${editingMemberId ? 'Guardar integrante' : 'Agregar integrante'}</button>
        ${editingMemberId ? '<button type="button" data-action="cancel-member-edit">Cancelar</button>' : ''}
      </form>
      ${
        teams.length
          ? `<ul class="team-list">${teams
              .map((team) => {
                const teamMetrics = metricsByTeam.get(team.id) || { realMonthly: 0, monthlyGoal: 0, members: [] };
                const memberMetrics = new Map(teamMetrics.members.map((member) => [member.id, member]));
                return `
              <li class="team-item">
                <div class="list-item-main">
                  <span class="list-item-title">${escapeHtml(team.name)}</span>
                  <span class="team-metric">Real $${Number(teamMetrics.realMonthly || 0).toFixed(2)} · Objetivo $${Number(teamMetrics.monthlyGoal || 0).toFixed(2)}</span>
                </div>
                <div class="list-item-actions">
                  <button type="button" data-action="edit-team" data-id="${escapeHtml(team.id)}">Editar</button>
                  <button type="button" data-action="delete-team" data-id="${escapeHtml(team.id)}">Eliminar</button>
                </div>
                ${
                  team.members.length
                    ? `<ul class="member-list">${team.members
                        .map((member) => {
                          const values = memberMetrics.get(member.id) || {};
                          return `
                        <li class="member-item">
                          <span>${escapeHtml(member.name)} · ${escapeHtml(member.role || 'Sin cargo')} · ${member.active === false ? 'Inactivo' : 'Activo'}</span>
                          <span>Real $${Number(values.realMonthly || 0).toFixed(2)} · Objetivo $${Number(values.monthlyGoal || 0).toFixed(2)}</span>
                          <button type="button" data-action="edit-member" data-team-id="${escapeHtml(team.id)}" data-id="${escapeHtml(member.id)}">Editar</button>
                          <button type="button" data-action="delete-member" data-team-id="${escapeHtml(team.id)}" data-id="${escapeHtml(member.id)}">Eliminar</button>
                        </li>`;
                        })
                        .join('')}</ul>`
                    : '<p class="empty-state">Este equipo aún no tiene integrantes.</p>'
                }
              </li>`;
              })
              .join('')}</ul>`
          : '<p class="empty-state">Aún no hay equipos de ventas registrados.</p>'
      }
    </section>`;
}
