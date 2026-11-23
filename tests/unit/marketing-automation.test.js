import { describe, expect, it } from 'vitest';
import { runAutomationRules } from '../../src/utils/marketing-automation.js';

const config = {
  marketing: {
    privacyNoticeVersion: 'v1',
    automationRules: [
      { event: 'entity_created', action: 'create_document', label: 'Bienvenida' },
      {
        event: 'stage_changed',
        from: 'prospecto',
        to: 'en_proceso',
        action: 'notify',
        label: 'Prospecto en seguimiento',
      },
    ],
  },
};

const entity = { id: 'rec_1', entity_id: 'ent_1', estado_comercial: 'prospecto' };

describe('Automatización de Marketing (T096)', () => {
  it('ejecuta la regla que coincide con la captura del prospecto', () => {
    const [document] = runAutomationRules('entity_created', entity, config, []);
    expect(document).toMatchObject({
      entity_id: 'ent_1',
      notes: 'Bienvenida',
      status: 'automatico',
    });
    expect(document.automation_key).toContain('entity_created');
  });

  it('solo ejecuta la regla de cambio de etapa cuando coinciden from y to', () => {
    expect(runAutomationRules('stage_changed', entity, config, [], { from: 'prospecto', to: 'en_proceso' })).toHaveLength(1);
    expect(runAutomationRules('stage_changed', entity, config, [], { from: 'ganado', to: 'perdido' })).toHaveLength(0);
  });

  it('no repite una ejecución ya registrada en el historial', () => {
    const [first] = runAutomationRules('entity_created', entity, config, []);
    const existing = [{ ...first, id: 'doc_1' }];
    expect(runAutomationRules('entity_created', entity, config, existing)).toHaveLength(0);
  });

  it('no ejecuta nada sin configuración de Marketing', () => {
    expect(runAutomationRules('entity_created', entity, {}, [])).toEqual([]);
  });
});
