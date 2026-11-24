import { afterEach, describe, it, expect, vi } from 'vitest';
import {
  localTodayISO,
  resolveEntityDateRule,
  isValidISODate,
  watchLocalDayChange,
} from '../../src/utils/entity-date.js';

afterEach(() => {
  vi.useRealTimers();
});

describe('Utilidad de fecha de entidad (FR-047 a FR-049)', () => {
  it('calcula la fecha local usando componentes locales, no UTC', () => {
    const now = new Date(2026, 0, 1, 0, 30, 0);
    expect(localTodayISO(now)).toBe('2026-01-01');
  });

  it('devuelve null cuando la configuración no declara entityDate', () => {
    expect(resolveEntityDateRule({}, new Date(2026, 0, 1))).toBeNull();
  });

  it('resuelve localToday a la fecha local actual', () => {
    const config = {
      entityDate: { label: 'Fecha de nacimiento', min: '1910-01-01', max: 'localToday' },
    };
    expect(resolveEntityDateRule(config, new Date(2026, 10, 23, 12))).toEqual({
      label: 'Fecha de nacimiento',
      min: '1910-01-01',
      max: '2026-11-23',
      required: false,
    });
  });

  it('deja sin límites los extremos omitidos', () => {
    expect(
      resolveEntityDateRule({ entityDate: { label: 'Fecha' } }, new Date(2026, 10, 23))
    ).toEqual({
      label: 'Fecha',
      min: '',
      max: '',
      required: false,
    });
  });

  it('expone required cuando la regla lo declara (T042)', () => {
    const config = {
      entityDate: {
        label: 'Fecha de nacimiento',
        min: '1910-01-01',
        max: 'localToday',
        required: true,
      },
    };
    expect(resolveEntityDateRule(config, new Date(2026, 10, 23)).required).toBe(true);
  });

  it('respeta un max ISO fijo y usa Fecha objetivo como etiqueta por defecto', () => {
    const config = { entityDate: { min: '2000-01-01', max: '2020-12-31' } };
    expect(resolveEntityDateRule(config, new Date(2026, 10, 23))).toEqual({
      label: 'Fecha objetivo',
      min: '2000-01-01',
      max: '2020-12-31',
      required: false,
    });
  });

  it('valida días y meses reales sin depender de la zona horaria', () => {
    expect(isValidISODate('2024-02-29')).toBe(true);
    expect(isValidISODate('1910-02-29')).toBe(false);
    expect(isValidISODate('2026-02-30')).toBe(false);
    expect(isValidISODate('2026-13-01')).toBe(false);
    expect(isValidISODate('')).toBe(true);
  });

  it('notifica el cambio de día local, se reprograma y permite cancelar la vigilancia', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 23, 23, 59, 0));
    const onChange = vi.fn();
    const stop = watchLocalDayChange(onChange);

    vi.advanceTimersByTime(60_000);
    expect(onChange).toHaveBeenCalledWith('2026-11-24');
    expect(onChange).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(86_400_000);
    expect(onChange).toHaveBeenCalledWith('2026-11-25');
    expect(onChange).toHaveBeenCalledTimes(2);

    stop();
    vi.advanceTimersByTime(86_400_000);
    expect(onChange).toHaveBeenCalledTimes(2);
  });
});
