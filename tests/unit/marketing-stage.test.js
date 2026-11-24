import { describe, expect, it } from 'vitest';
import { MARKETING_STAGES } from '../../src/utils/marketing-stages.js';
import { isValidStageTransition, transitionStage } from '../../src/utils/marketing-stage.js';

describe('Transiciones del estado comercial (T087)', () => {
  it('acepta transiciones entre las cinco etapas declaradas', () => {
    for (const stage of MARKETING_STAGES) {
      expect(isValidStageTransition('prospecto', stage)).toBe(true);
    }
  });

  it('rechaza una etapa desconocida', () => {
    expect(isValidStageTransition('prospecto', 'cerrado')).toBe(false);
    const result = transitionStage({ estado_comercial: 'prospecto' }, 'cerrado');
    expect(result.valid).toBe(false);
    expect(result.errors.estado_comercial).toBeTruthy();
  });

  it('devuelve solo el cambio de estado sin tocar la identidad de la entidad', () => {
    const entity = {
      id: 'rec_1',
      entity_id: 'ent_1',
      name: 'Prospecto',
      estado_comercial: 'prospecto',
    };
    const result = transitionStage(entity, 'ganado');
    expect(result.valid).toBe(true);
    expect(result.data).toEqual({ estado_comercial: 'ganado' });
    expect(result.data.id).toBeUndefined();
  });
});
