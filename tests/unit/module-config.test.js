import { describe, it, expect } from 'vitest';
import { loadModuleConfig, validateConfig, getLabel, DEFAULT_CONFIG } from '../../src/module-config.js';
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
});
