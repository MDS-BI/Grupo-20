export function normalizeText(value) {
  return String(value === null || value === undefined ? '' : value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function matchesQuery(value, query) {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return false;
  return normalizeText(value).includes(normalizedQuery);
}

export function matchesAny(values, query) {
  return values.some(value => matchesQuery(value, query));
}
