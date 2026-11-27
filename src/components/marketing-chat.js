import { escapeHtml } from '../utils/sanitize.js';
import { MESSAGES } from '../utils/messages.js';
import { can } from '../auth/permissions.js';

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
  role = 'visitor',
  authEnabled = false,
} = {}) {
  const hasChatAccess =
    publicView ||
    !authEnabled ||
    can(role, 'chat:view') ||
    can(role, 'chat:answer') ||
    can(role, 'chat:create_query');
  const canAnswer = !publicView && (!authEnabled || can(role, 'chat:answer'));
  if (!hasChatAccess) {
    return `<section class="marketing-chat marketing-panel" data-role="marketing-chat" role="alert"><p class="empty-state">${MESSAGES.accessDenied}</p></section>`;
  }
  const entityOptions = entities
    .map(
      (entity) =>
        `<option value="${escapeHtml(entity.entity_id)}" ${entity.entity_id === selectedEntityId ? 'selected' : ''}>${escapeHtml(entity.name)}</option>`
    )
    .join('');
  const campaignOptions = campaigns
    .map(
      (campaign) =>
        `<option value="${escapeHtml(campaign.name)}" ${campaign.name === campaignId ? 'selected' : ''}>${escapeHtml(campaign.name)}</option>`
    )
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
                .map((doc) => {
                  const answered =
                    doc.respondida === true || (doc.respuesta && String(doc.respuesta).trim());
                  return `
              <p class="chat-message"><strong>${escapeHtml(doc.mensaje || doc.notes || '')}</strong>${
                doc.respuesta ? `<span>${escapeHtml(doc.respuesta)}</span>` : ''
              }${
                canAnswer && !answered
                  ? `<button type="button" data-action="answer-chat" data-id="${escapeHtml(doc.id || '')}">Responder</button>`
                  : ''
              }</p>`;
                })
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
