import { escapeHtml } from '../utils/sanitize.js';

export function renderMarketingChatHtml({
  messages = [],
  faq = [],
  entities = [],
  campaigns = [],
  selectedEntityId = '',
  campaignId = '',
  consent = false,
  message = '',
  response = '',
  publicView = false,
} = {}) {
  const entityOptions = entities
    .map((entity) => `<option value="${escapeHtml(entity.entity_id)}" ${entity.entity_id === selectedEntityId ? 'selected' : ''}>${escapeHtml(entity.name)}</option>`)
    .join('');
  const campaignOptions = campaigns
    .map((campaign) => `<option value="${escapeHtml(campaign.name)}" ${campaign.name === campaignId ? 'selected' : ''}>${escapeHtml(campaign.name)}</option>`)
    .join('');
  return `
    <section class="marketing-chat marketing-panel" data-role="marketing-chat">
      <h2>Dudas y consultas</h2>
      ${
        faq.length
          ? `<p class="chat-faq">Preguntas frecuentes: ${faq.map((item) => escapeHtml(item.pregunta)).join(' · ')}</p>`
          : '<p class="empty-state">No hay preguntas frecuentes configuradas. Puedes dejar tu consulta para seguimiento.</p>'
      }
      <div class="chat-messages" aria-live="polite">
        ${
          messages.length
            ? messages
                .map(
                  (doc) => `
              <p class="chat-message"><strong>${escapeHtml(doc.mensaje || doc.notes || '')}</strong>${
                doc.respuesta ? `<span>${escapeHtml(doc.respuesta)}</span>` : ''
              }</p>`,
                )
                .join('')
            : '<p class="empty-state">Aún no hay mensajes en esta conversación.</p>'
        }
      </div>
      ${response ? `<p class="chat-response" role="status">${escapeHtml(response)}</p>` : ''}
      <form id="chat-form" class="marketing-form" novalidate>
        ${
          publicView
            ? selectedEntityId
              ? `<input type="hidden" name="entity_id" value="${escapeHtml(selectedEntityId)}" />`
              : '<p class="empty-state">Regístrate para abrir la conversación.</p>'
            : `<label>Prospecto o cliente
                <select name="entity_id" required><option value="">-- Selecciona --</option>${entityOptions}</select>
              </label>`
        }
        <label>Mensaje<textarea name="mensaje" required>${escapeHtml(message)}</textarea></label>
        ${
          campaignOptions
            ? `<label>Campaña<select name="campaña"><option value="">Sin campaña</option>${campaignOptions}</select></label>`
            : ''
        }
        <label class="checkbox-field"><input type="checkbox" name="consentimiento" ${consent ? 'checked' : ''} /> Acepto el aviso de privacidad para usar Dudas y consultas</label>
        <button type="submit">Enviar mensaje</button>
      </form>
    </section>`;
}
