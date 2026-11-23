import { isMarketingStage } from './marketing-stages.js';

export function isValidStageTransition(fromStage, toStage) {
  return isMarketingStage(fromStage) && isMarketingStage(toStage);
}

export function transitionStage(entity = {}, toStage) {
  const errors = {};
  if (!isMarketingStage(toStage)) {
    errors.estado_comercial = 'La etapa comercial no es válida.';
  }
  const fromStage = entity.estado_comercial;
  if (fromStage && !isMarketingStage(fromStage)) {
    errors.estado_comercial = 'El estado comercial almacenado no es válido.';
  }
  if (!isValidStageTransition(fromStage, toStage) && !errors.estado_comercial) {
    errors.estado_comercial = 'Transición comercial no válida.';
  }
  return {
    valid: Object.keys(errors).length === 0,
    errors,
    data: { estado_comercial: toStage },
  };
}
