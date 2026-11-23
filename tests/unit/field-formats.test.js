import { describe, expect, it } from 'vitest';
import {
  FORMAT_NAMES,
  formatRut,
  hasFormat,
  isValidFormat,
  isValidRut,
  normalizeClRut,
  normalizeFieldValue,
  rutDigit,
} from '../../src/utils/field-formats.js';

describe('Formatos declarativos de campo (T027)', () => {
  it('registra solo los formatos permitidos', () => {
    expect(FORMAT_NAMES).toEqual(['cl-rut', 'phone', 'email', 'nonEmpty']);
    expect(hasFormat('cl-rut')).toBe(true);
    expect(hasFormat('unknown')).toBe(false);
  });

  it('valida el dígito verificador del RUT chileno y normaliza puntos, guion y espacios', () => {
    expect(rutDigit('12345678')).toBe('5');
    expect(formatRut(12345678)).toBe('12.345.678-5');
    expect(isValidRut('12.345.678-5')).toBe(true);
    expect(isValidRut('12345678-5')).toBe(true);
    expect(isValidRut('12.345.678-k')).toBe(false);
    expect(normalizeClRut(' 12.345.678-5 ')).toBe('123456785');
    expect(normalizeFieldValue('12.345.678-k', 'cl-rut')).toBe('12345678K');
  });

  it('acepta RUT con puntos y sin puntos con una sola normalización (T056)', () => {
    expect(isValidRut('12.345.678-5')).toBe(true);
    expect(isValidRut('12345678-5')).toBe(true);
    expect(normalizeClRut('12.345.678-5')).toBe(normalizeClRut('12345678-5'));
    expect(normalizeFieldValue('12.345.678-k', 'cl-rut')).toBe(normalizeFieldValue('12345678-K', 'cl-rut'));
  });

  it('valida teléfono, correo y texto no vacío sin efectos secundarios', () => {
    expect(isValidFormat('cl-rut', '12.345.678-5')).toBe(true);
    expect(isValidFormat('cl-rut', '12.345.678-6')).toBe(false);
    expect(isValidFormat('phone', '+56 9 1234 5678')).toBe(true);
    expect(isValidFormat('phone', 'abc')).toBe(false);
    expect(isValidFormat('email', 'ana@example.com')).toBe(true);
    expect(isValidFormat('email', 'anaexample.com')).toBe(false);
    expect(isValidFormat('nonEmpty', '  dato  ')).toBe(true);
    expect(isValidFormat('nonEmpty', '   ')).toBe(false);
    expect(isValidFormat('unknown', 'dato')).toBe(false);
  });
});
