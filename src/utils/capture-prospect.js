import { addEntity, ValidationError } from '../storage.js';
import { MARKETING_STAGES } from './marketing-stages.js';
import { MESSAGES } from './messages.js';

export class CaptureError extends Error {
  constructor(errors) {
    super('Captura inválida');
    this.name = 'CaptureError';
    this.errors = errors;
  }
}

export function createProspectFromCapture(values = {}, config) {
  const marketing = config?.marketing;
  if (!marketing) {
    throw new CaptureError({ _form: 'La captura pública no está disponible para este módulo.' });
  }
  const errors = {};
  const consented = values.consentimiento === true || values.consentimiento === 'true';
  if (!consented) {
    errors.consentimiento = MESSAGES.required;
  }
  if (Object.keys(errors).length) throw new CaptureError(errors);

  const captureFields = new Set([...(marketing.captureFields || []), 'campaña']);
  const data = {};
  for (const [key, value] of Object.entries(values)) {
    if (captureFields.has(key)) data[key] = value;
  }
  data.estado_comercial = MARKETING_STAGES[0];
  data.consentimiento = true;
  data.consentimiento_fecha = new Date().toISOString();
  data.consentimiento_version = marketing.privacyNoticeVersion;

  try {
    return addEntity(data, { customFieldDefs: config.customFields?.entity || [] });
  } catch (err) {
    if (err instanceof ValidationError) throw new CaptureError(err.errors);
    throw err;
  }
}
