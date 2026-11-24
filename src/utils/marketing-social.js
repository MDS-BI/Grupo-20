import { addDocument, ValidationError } from '../storage.js';
import { localTodayISO } from './entity-date.js';

export function registerSocialInteraction(values = {}, entity = null, config = {}) {
  if (!entity?.entity_id) {
    throw new ValidationError({ entity_id: 'La interacción debe estar asociada a una entidad.' });
  }

  const fields = values || {};
  const options = config || {};
  const data = {
    entity_id: entity.entity_id,
    plataforma: fields.plataforma ?? '',
    startDate: fields.startDate || localTodayISO(),
    tipo_interaccion: fields.tipo_interaccion ?? '',
    nota: fields.nota ?? '',
    enlace: fields.enlace ?? '',
    ...(fields.campaña === undefined || fields.campaña === null || fields.campaña === ''
      ? {}
      : { campaña: fields.campaña }),
    canal: 'redes',
    status: 'pendiente',
  };

  return addDocument(data, {
    customFieldDefs: options.customFields?.document || [],
    statusLifecycle: options.statusLifecycle,
  });
}
