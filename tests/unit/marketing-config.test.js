import { describe, expect, it } from 'vitest';
import {
  MARKETING_STAGES,
  normalizeMarketingConfig,
  validateMarketingConfig,
} from '../../src/utils/marketing-config.js';

describe('Configuración de Marketing (T075)', () => {
  it('declara exactamente las cinco etapas comerciales', () => {
    expect(MARKETING_STAGES).toEqual([
      'prospecto',
      'en_proceso',
      'en_recontacto',
      'ganado',
      'perdido',
    ]);
  });

  it('normaliza una configuración válida preservando reglas y campos de captura', () => {
    const raw = {
      privacyNoticeVersion: '2026-11-23',
      automationRules: [
        { event: 'entity_created', action: 'create_document', label: 'Bienvenida' },
      ],
      captureFields: ['name', 'rut'],
    };
    const { config, errors } = normalizeMarketingConfig(raw);
    expect(errors).toEqual([]);
    expect(config.privacyNoticeVersion).toBe('2026-11-23');
    expect(config.automationRules).toEqual(raw.automationRules);
    expect(config.captureFields).toEqual(['name', 'rut']);
  });

  it('conserva las acciones declaradas en marketing.campaigns.actions', () => {
    const campaigns = [{ id: 'c1', name: 'Campaña', stage: 'prospecto' }];
    Object.defineProperty(campaigns, 'actions', { value: ['create_document'], enumerable: false });
    const { config, errors } = normalizeMarketingConfig({
      privacyNoticeVersion: 'v1',
      automationRules: [
        { event: 'entity_created', action: 'create_document', label: 'Bienvenida' },
      ],
      captureFields: [],
      campaigns,
    });

    expect(errors).toEqual([]);
    expect(config.campaigns).toHaveLength(1);
    expect(config.campaigns.actions).toEqual(['create_document']);
  });

  it('rechaza una regla cuya acción no está declarada', () => {
    const campaigns = [];
    Object.defineProperty(campaigns, 'actions', { value: ['create_document'], enumerable: false });
    const errors = validateMarketingConfig(
      {
        privacyNoticeVersion: 'v1',
        automationRules: [{ event: 'entity_created', action: 'notify', label: 'Aviso' }],
        captureFields: [],
        campaigns,
      },
      []
    );
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rechaza eventos y acciones desconocidos', () => {
    const errors = [];
    validateMarketingConfig(
      {
        privacyNoticeVersion: 'v1',
        automationRules: [
          { event: 'unknown', action: 'create_document', label: 'Regla' },
          { event: 'entity_created', action: 'unknown', label: 'Regla' },
        ],
        captureFields: [],
      },
      errors
    );
    expect(errors.length).toBeGreaterThanOrEqual(2);
  });

  it('exige una versión de aviso no vacía y etiquetas de regla válidas', () => {
    const errors = [];
    validateMarketingConfig(
      {
        privacyNoticeVersion: '   ',
        automationRules: [{ event: 'entity_created', action: 'notify', label: '' }],
      },
      errors
    );
    expect(errors.length).toBeGreaterThanOrEqual(2);
  });

  it('retrocede a valores seguros cuando la configuración no es un objeto', () => {
    const { config, errors } = normalizeMarketingConfig('invalido');
    expect(config).toMatchObject({
      privacyNoticeVersion: '2026-11-23',
      automationRules: [],
      captureFields: [],
    });
    expect(errors.length).toBeGreaterThan(0);
  });
});
