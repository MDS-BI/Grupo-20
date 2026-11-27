import { describe, expect, it } from 'vitest';
import {
  LOST_REASON_OPTIONS,
  isLostReasonActive,
  requiresLostReason,
  requiresLostReasonOptions,
  validateLostReason,
} from '../../src/utils/lost-reason.js';

const CONFIG = {
  documentRules: {
    lostReason: {
      status: 'cerrado perdido',
      entityStateField: 'estado_comercial',
      entityState: 'prospecto',
      customField: 'motivo_perdida',
      options: LOST_REASON_OPTIONS,
    },
  },
};

describe('Motivo de cierre perdido (T145)', () => {
  it('declara las cuatro opciones exactas en orden', () => {
    expect(LOST_REASON_OPTIONS).toEqual([
      'Precio alto',
      'Eligió competencia',
      'Sin presupuesto',
      'No responde',
    ]);
    expect(requiresLostReasonOptions(CONFIG)).toEqual(LOST_REASON_OPTIONS);
  });

  it('aplica solo a prospectos con estado cerrado perdido', () => {
    const prospecto = { estado_comercial: 'prospecto' };
    expect(requiresLostReason({ status: 'Cerrado perdido' }, prospecto, CONFIG)).toBe(true);
    expect(requiresLostReason({ status: 'cerrado perdido' }, prospecto, CONFIG)).toBe(true);
    expect(isLostReasonActive({ status: 'Cerrado perdido' }, prospecto, CONFIG)).toBe(true);
    expect(requiresLostReason({ status: 'cerrado ganado' }, prospecto, CONFIG)).toBe(false);
    expect(
      requiresLostReason({ status: 'Cerrado perdido' }, { estado_comercial: 'ganado' }, CONFIG)
    ).toBe(false);
    expect(requiresLostReason({}, prospecto, CONFIG)).toBe(false);
  });

  it('exige una opción válida y conserva el valor histórico sin mutarlo', () => {
    const documento = { status: 'Cerrado perdido', motivo_perdida: 'Precio alto' };
    expect(validateLostReason(documento, { estado_comercial: 'prospecto' }, CONFIG)).toBe(true);
    expect(() =>
      validateLostReason({ status: 'Cerrado perdido' }, { estado_comercial: 'prospecto' }, CONFIG)
    ).toThrow('El motivo de pérdida es obligatorio.');
    expect(() =>
      validateLostReason(
        { status: 'Cerrado perdido', motivo_perdida: 'Otro' },
        { estado_comercial: 'prospecto' },
        CONFIG
      )
    ).toThrow('El motivo de pérdida es obligatorio.');

    const historico = { status: 'cerrado ganado', motivo_perdida: 'Sin presupuesto' };
    expect(validateLostReason(historico, { estado_comercial: 'ganado' }, CONFIG)).toBe(true);
    expect(historico.motivo_perdida).toBe('Sin presupuesto');
  });
});
