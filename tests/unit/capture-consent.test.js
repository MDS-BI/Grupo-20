import { describe, expect, it, afterEach } from 'vitest';
import {
  loadModuleConfig,
  MODULE_CONFIG,
  setActiveConfig,
  DEFAULT_CONFIG,
} from '../../src/module-config.js';
import { CaptureError, createProspectFromCapture } from '../../src/utils/capture-prospect.js';
import { loadEntities } from '../../src/storage.js';

const config = loadModuleConfig(MODULE_CONFIG).config;

const validValues = {
  name: 'Visitante Web',
  targetDate: '1980-05-05',
  rut: '11.111.111-1',
  canal_contacto: 'llamada',
  contacto_telefono: '+56912345678',
  consentimiento: true,
};

afterEach(() => setActiveConfig(DEFAULT_CONFIG));

describe('Creación de prospectos desde captura (T082)', () => {
  it('rechaza el guardado sin consentimiento explícito', () => {
    setActiveConfig(config);
    expect(() =>
      createProspectFromCapture({ ...validValues, consentimiento: false }, config)
    ).toThrow(CaptureError);
    expect(loadEntities()).toHaveLength(0);
  });

  it('crea un prospecto con estado inicial, fecha y versión del aviso', () => {
    setActiveConfig(config);
    const entity = createProspectFromCapture(validValues, config);
    expect(entity).toMatchObject({
      name: 'Visitante Web',
      estado_comercial: 'prospecto',
      consentimiento: true,
      consentimiento_version: config.marketing.privacyNoticeVersion,
    });
    expect(entity.consentimiento_fecha).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('rechaza la captura cuando no hay configuración de Marketing', () => {
    setActiveConfig(DEFAULT_CONFIG);
    expect(() => createProspectFromCapture(validValues, DEFAULT_CONFIG)).toThrow(CaptureError);
  });
});
