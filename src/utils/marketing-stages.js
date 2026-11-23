export const MARKETING_STAGES = Object.freeze([
  'prospecto',
  'en_proceso',
  'en_recontacto',
  'ganado',
  'perdido',
]);

export const MARKETING_STAGE_LABELS = Object.freeze({
  prospecto: 'Prospecto',
  en_proceso: 'En proceso',
  en_recontacto: 'En recontacto',
  ganado: 'Cliente ganado',
  perdido: 'Perdido',
});

export const MARKETING_CATEGORIES = Object.freeze([
  { key: 'ganado', label: 'Clientes ganados', stages: ['ganado'], color: '#0f766e' },
  { key: 'en_recontacto', label: 'En recontacto', stages: ['en_recontacto'], color: '#2563eb' },
  { key: 'en_proceso', label: 'En proceso', stages: ['en_proceso'], color: '#7c3aed' },
  { key: 'perdido', label: 'Perdidos', stages: ['perdido'], color: '#c0392b' },
  {
    key: 'sin_resultado',
    label: 'Sin resultados definitivos',
    stages: ['prospecto'],
    color: '#94a3b8',
  },
]);

export function isMarketingStage(value) {
  return MARKETING_STAGES.includes(value);
}

export function categoryForStage(stage) {
  return MARKETING_CATEGORIES.find((category) => category.stages.includes(stage)) || MARKETING_CATEGORIES[4];
}
