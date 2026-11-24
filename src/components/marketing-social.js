import { escapeHtml, safeUrl } from '../utils/sanitize.js';

function entityOptions(entities, selectedId) {
  return entities
    .map(
      (entity) =>
        `<option value="${escapeHtml(entity.entity_id)}" ${entity.entity_id === selectedId ? 'selected' : ''}>${escapeHtml(entity.name)}</option>`
    )
    .join('');
}

function campaignOptions(campaigns, selected) {
  return campaigns
    .map(
      (campaign) =>
        `<option value="${escapeHtml(campaign.name)}" ${campaign.name === selected ? 'selected' : ''}>${escapeHtml(campaign.name)}</option>`
    )
    .join('');
}

export function renderMarketingSocialHtml({
  interactions = [],
  entities = [],
  campaigns = [],
  values = {},
  editingId = null,
} = {}) {
  const platforms = ['Twitter', 'Instagram', 'YouTube', 'Otra'];
  const interactionTypes = ['Comentario', 'Mensaje', 'Me gusta', 'Compartido', 'Otra'];
  const sorted = [...interactions].sort((a, b) =>
    String(a.startDate || '').localeCompare(String(b.startDate || ''))
  );
  return `
    <section class="marketing-social marketing-panel">
      <h2>Redes sociales</h2>
      <form id="social-form" class="marketing-form" novalidate>
        <label>Prospecto o cliente
          <select name="entity_id" required><option value="">-- Selecciona --</option>${entityOptions(entities, values.entity_id)}</select>
        </label>
        <label>Plataforma
          <select name="plataforma">${platforms.map((platform) => `<option ${values.plataforma === platform ? 'selected' : ''}>${platform}</option>`).join('')}</select>
        </label>
        <label>Fecha<input type="date" name="startDate" value="${escapeHtml(values.startDate || '')}" /></label>
        <label>Tipo de interacción
          <select name="tipo_interaccion">${interactionTypes.map((type) => `<option ${values.tipo_interaccion === type ? 'selected' : ''}>${type}</option>`).join('')}</select>
        </label>
        <label>Nota<textarea name="nota">${escapeHtml(values.nota || '')}</textarea></label>
        <label>Enlace<input name="enlace" type="url" value="${escapeHtml(values.enlace || '')}" /></label>
        <label>Campaña
          <select name="campaña"><option value="">Sin campaña</option>${campaignOptions(campaigns, values.campaña)}</select>
        </label>
        <button type="submit">${editingId ? 'Guardar interacción' : 'Registrar interacción'}</button>
        ${editingId ? '<button type="button" data-action="cancel-social-edit">Cancelar</button>' : ''}
      </form>
      ${
        sorted.length
          ? `<ul class="social-list">${sorted
              .map(
                (doc) => `
              <li class="list-item">
                <div class="list-item-main">
                  <span class="list-item-title">${escapeHtml(doc.plataforma || 'Red social')} · ${escapeHtml(doc.tipo_interaccion || 'Interacción')}</span>
                  <span>${escapeHtml(doc.startDate || '')} ${doc.enlace ? `<a href="${safeUrl(doc.enlace)}" rel="noopener noreferrer">Ver enlace</a>` : ''}</span>
                  <span>${escapeHtml(doc.nota || '')}</span>
                </div>
                <div class="list-item-actions">
                  <button type="button" data-action="edit-social" data-id="${escapeHtml(doc.id)}">Editar</button>
                  <button type="button" data-action="delete-social" data-id="${escapeHtml(doc.id)}">Eliminar</button>
                </div>
              </li>`
              )
              .join('')}</ul>`
          : '<p class="empty-state">Aún no hay interacciones en redes sociales.</p>'
      }
    </section>`;
}
