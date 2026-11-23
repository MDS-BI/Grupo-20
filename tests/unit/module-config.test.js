import { describe, it, expect } from 'vitest';
import {
  loadModuleConfig,
  normalizeConfig,
  validateConfig,
  getLabel,
  DEFAULT_CONFIG,
} from '../../src/module-config.js';
import { sanitizeAccentColor } from '../../src/module-config.js';

describe('Carga de configuración del módulo (H5)', () => {
  it('usa los valores predeterminados cuando no se provee configuración', () => {
    const { config, warning } = loadModuleConfig(null);
    expect(config).toEqual(DEFAULT_CONFIG);
    expect(warning).toBeNull();
  });

  it('acepta un perfil de Ventas completo', () => {
    const sales = {
      moduleName: 'Ventas',
      labels: { entity: 'Cliente', entityPlural: 'Clientes', document: 'Pedido de Venta' },
      customFields: { entity: [{ key: 'creditLimit', label: 'Límite de crédito', type: 'number' }], document: [] },
      statusLifecycle: { states: ['cotizacion', 'pedido', 'facturado'], transitions: { cotizacion: ['pedido'], pedido: ['facturado'] } },
      theme: { accentColor: '#1a73e8' },
    };
    const { config, warning } = loadModuleConfig(sales);
    expect(warning).toBeNull();
    expect(config.moduleName).toBe('Ventas');
    expect(getLabel(config, 'entity')).toBe('Cliente');
    expect(getLabel(config, 'document')).toBe('Pedido de Venta');
  });

  it('retrocede a los valores predeterminados con advertencia ante una configuración inválida', () => {
    const { config, warning } = loadModuleConfig({ moduleName: '' });
    expect(config).toEqual(DEFAULT_CONFIG);
    expect(warning).toBeTruthy();
  });

  it('detecta un campo personalizado que choca con un nombre de campo base', () => {
    const errors = validateConfig({ customFields: { entity: [{ key: 'name', type: 'text' }], document: [] } });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('detecta un tipo de campo desconocido y una transición de ciclo de vida inválida', () => {
    const badType = validateConfig({ customFields: { entity: [{ key: 'x', type: 'unknown-type' }] } });
    expect(badType.length).toBeGreaterThan(0);

    const badLifecycle = validateConfig({
      statusLifecycle: { states: ['a', 'b'], transitions: { a: ['c'] } },
    });
    expect(badLifecycle.length).toBeGreaterThan(0);
  });

  it('retrocede en silencio a los valores integrados ante un color de acento inválido, sin invalidar el resto de la configuración', () => {
    expect(sanitizeAccentColor('not-a-color')).toBeNull();
    expect(sanitizeAccentColor('#1a73e8')).toBe('#1a73e8');
    const { config, warning } = loadModuleConfig({ moduleName: 'Ventas', theme: { accentColor: 'not-a-color' } });
    expect(warning).toBeNull();
    expect(config.moduleName).toBe('Ventas');
    expect(config.theme.accentColor).toBeNull();
  });

  it('retrocede a etiquetas predeterminadas cuando no se proveen mapeos', () => {
    const { config } = loadModuleConfig(null);
    expect(getLabel(config, 'entity')).toBe('Entidad');
    expect(getLabel(config, 'document')).toBe('Documento');
  });

  it('acepta una regla entityDate válida y la conserva en la configuración cargada', () => {
    const raw = {
      moduleName: 'CRM Comercial',
      entityDate: { label: 'Fecha de nacimiento', min: '1910-01-01', max: 'localToday' },
    };
    const { config, warning } = loadModuleConfig(raw);
    expect(warning).toBeNull();
    expect(config.entityDate).toEqual(raw.entityDate);
  });

  it('rechaza una regla entityDate con etiqueta vacía, min inválido o max desconocido', () => {
    expect(validateConfig({ entityDate: { label: '' } }).length).toBeGreaterThan(0);
    expect(validateConfig({ entityDate: { min: '1910-02-29' } }).length).toBeGreaterThan(0);
    expect(validateConfig({ entityDate: { max: 'hoy' } }).length).toBeGreaterThan(0);
    expect(validateConfig({ entityDate: 'no-es-un-objeto' }).length).toBeGreaterThan(0);
  });

  it('hace fallback con advertencia cuando entityDate es inválida', () => {
    const { config, warning } = loadModuleConfig({ moduleName: 'CRM', entityDate: { max: 'mañana' } });
    expect(config).toEqual(DEFAULT_CONFIG);
    expect(warning).toBeTruthy();
  });

  it('valida pendingStates contra los estados declarados en el ciclo de vida', () => {
    const valid = {
      statusLifecycle: {
        states: ['pendiente', 'en_revision', 'cerrado'],
        pendingStates: ['pendiente', 'en_revision'],
      },
    };
    expect(validateConfig(valid)).toEqual([]);
    expect(validateConfig({ statusLifecycle: { states: ['pendiente'], pendingStates: ['otro'] } }).length).toBeGreaterThan(0);
    expect(validateConfig({ statusLifecycle: { states: ['pendiente'], pendingStates: 'pendiente' } }).length).toBeGreaterThan(0);
  });

  it('normaliza pendingStates sin perderlos', () => {
    const raw = {
      statusLifecycle: {
        states: ['pendiente', 'en_revision'],
        pendingStates: ['en_revision'],
      },
    };
    const { config, errors } = normalizeConfig(raw);
    expect(errors).toEqual([]);
    expect(config.statusLifecycle.pendingStates).toEqual(['en_revision']);
  });
});
