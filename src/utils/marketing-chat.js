import { addDocument, updateDocument, ValidationError } from '../storage.js';
import { localTodayISO } from './entity-date.js';
import { normalizeText } from './search.js';

export class ChatConsentError extends Error {
  constructor() {
    super('El chat requiere consentimiento explícito');
    this.name = 'ChatConsentError';
    this.errors = {
      consentimiento: 'Debes marcar el consentimiento explícito antes de enviar un mensaje.',
    };
  }
}

export function answerFaq(question, config) {
  const faq = config?.marketing?.faq;
  const normalizedQuestion = normalizeText(question);
  if (!Array.isArray(faq) || !normalizedQuestion) return null;

  let exactAnswer;
  let includedAnswer = null;
  let longestLength = -1;

  for (const item of faq) {
    const normalizedFaqQuestion = normalizeText(item?.pregunta);
    if (!normalizedFaqQuestion) continue;
    const answer = item?.respuesta ?? null;
    if (normalizedFaqQuestion === normalizedQuestion && exactAnswer === undefined) exactAnswer = answer;
    if (normalizedQuestion.includes(normalizedFaqQuestion) && normalizedFaqQuestion.length > longestLength) {
      includedAnswer = answer;
      longestLength = normalizedFaqQuestion.length;
    }
  }

  return exactAnswer === undefined ? includedAnswer : exactAnswer;
}

export function registerChatMessage(values = {}, entity = null, config = {}) {
  const fields = values || {};
  const options = config || {};
  const consented = fields.consentimiento === true || entity?.consentimiento === true;
  if (!consented) throw new ChatConsentError();

  const errors = {};
  if (!entity?.entity_id) errors.entity_id = 'La consulta debe estar asociada a una entidad.';
  const mensaje = String(fields.mensaje ?? '').trim();
  if (!mensaje) errors.mensaje = 'El mensaje es obligatorio.';
  if (Object.keys(errors).length) throw new ValidationError(errors);

  const data = {
    entity_id: entity.entity_id,
    canal: 'chat',
    mensaje,
    tipo_interaccion: 'consulta',
    notes: mensaje,
    startDate: fields.startDate || localTodayISO(),
    respondida: false,
    ...(fields.campaña === undefined || fields.campaña === null || fields.campaña === ''
      ? {}
      : { campaña: fields.campaña }),
    status: 'pendiente',
  };

  return addDocument(data, {
    customFieldDefs: options.customFields?.document,
    statusLifecycle: options.statusLifecycle,
  });
}

export function markChatAnswered(documentId, updates = {}) {
  return updateDocument(documentId, {
    respondida: true,
    status: 'respondida',
    respuesta: updates?.respuesta ?? '',
  });
}
