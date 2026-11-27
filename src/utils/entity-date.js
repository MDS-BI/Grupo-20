import { MESSAGES } from './messages.js';

export const LOCAL_TODAY = 'localToday';

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidISODate(value) {
  if (!value) return true;
  if (!ISO_DATE_RE.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

export function localTodayISO(now = new Date()) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function resolveEntityDateRule(config, now = new Date()) {
  const rule = config?.entityDate;
  if (!rule) return null;
  return {
    label: rule.label || 'Fecha objetivo',
    min: rule.min || '',
    max: rule.max === LOCAL_TODAY ? localTodayISO(now) : rule.max || '',
    required: rule.required === true,
  };
}

export function validateEntityDateRange(values = {}, config = {}, now = new Date()) {
  const errors = {};
  const safeValues = values && typeof values === 'object' ? values : {};
  const rule = resolveEntityDateRule(config, now);
  const label = rule?.label || 'Fecha objetivo';
  const targetDate = safeValues.targetDate;

  if (rule?.required && !targetDate) errors.targetDate = MESSAGES.required;
  if (targetDate) {
    if (!isValidISODate(targetDate)) {
      errors.targetDate = `${label} debe ser una fecha ISO válida.`;
    } else if (rule?.min && targetDate < rule.min) {
      errors.targetDate = `${label} no puede ser anterior a ${rule.min}.`;
    } else if (rule?.max && targetDate > rule.max) {
      errors.targetDate = `${label} no puede ser posterior a ${rule.max}.`;
    }
  }

  const startDate = safeValues.startDate;
  const endDate = safeValues.endDate;
  if (startDate && !isValidISODate(startDate)) {
    errors.startDate = 'La fecha de inicio debe ser una fecha ISO válida.';
  }
  if (endDate && !isValidISODate(endDate)) {
    errors.endDate = 'La fecha de fin debe ser una fecha ISO válida.';
  }
  if (isValidISODate(startDate) && isValidISODate(endDate) && endDate < startDate) {
    errors.endDate = 'La fecha de fin no puede ser anterior a la fecha de inicio.';
  }

  return errors;
}

export function watchLocalDayChange(onChange, options = {}) {
  const now = options.now || (() => new Date());
  const scheduleTimer = options.setTimeout || ((callback, delay) => setTimeout(callback, delay));
  const cancelTimer = options.clearTimeout || ((timerId) => clearTimeout(timerId));
  let timerId = null;
  let stopped = false;

  function schedule() {
    const current = now();
    const nextMidnight = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1);
    const delay = Math.max(nextMidnight.getTime() - current.getTime(), 1);
    timerId = scheduleTimer(() => {
      if (stopped) return;
      onChange(localTodayISO(now()));
      schedule();
    }, delay);
  }

  schedule();

  return () => {
    stopped = true;
    if (timerId !== null) cancelTimer(timerId);
  };
}
