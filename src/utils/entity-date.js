export const LOCAL_TODAY = 'localToday';

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidISODate(value) {
  if (!value) return true;
  if (!ISO_DATE_RE.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
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
