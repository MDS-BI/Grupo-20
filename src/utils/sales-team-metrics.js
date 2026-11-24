import { normalizeText } from './search.js';

const WON_STATUS = 'cerrado ganado';

function isSameMonth(dateValue, now) {
  const text = String(dateValue ?? '');
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(text);
  if (match) {
    return Number(match[1]) === now.getFullYear() && Number(match[2]) === now.getMonth() + 1;
  }
  const date = new Date(text);
  return (
    !Number.isNaN(date.getTime()) &&
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  );
}

function projectGoal(realMonthly, elapsedDays, daysInMonth) {
  if (!realMonthly || !elapsedDays) return 0;
  return Number(((realMonthly / elapsedDays) * daysInMonth).toFixed(2));
}

function hasValue(value) {
  return value !== undefined && value !== null && String(value).trim() !== '';
}

export function computeSalesTeamMetrics({
  teams = [],
  entities = [],
  documents = [],
  now = new Date(),
} = {}) {
  const safeTeams = Array.isArray(teams) ? teams : [];
  const safeEntities = Array.isArray(entities) ? entities : [];
  const safeDocuments = Array.isArray(documents) ? documents : [];

  const entityById = new Map();
  for (const entity of safeEntities) {
    if (entity?.entity_id !== undefined && entity.entity_id !== null && entity.entity_id !== '') {
      entityById.set(entity.entity_id, entity);
    }
    if (entity?.id !== undefined && entity.id !== null && entity.id !== '') {
      entityById.set(entity.id, entity);
    }
  }

  const wonByExecutive = new Map();
  for (const document of safeDocuments) {
    if (normalizeText(document?.status) !== WON_STATUS) continue;
    if (!isSameMonth(document?.startDate, now)) continue;
    const entity = entityById.get(document?.entity_id) || {};
    const saleOwner = hasValue(document?.assignedUserIdAtSale)
      ? document.assignedUserIdAtSale
      : hasValue(entity.ejecutivo_asignado)
        ? entity.ejecutivo_asignado
        : entity.executive;
    if (!hasValue(saleOwner)) continue;
    const executive = normalizeText(saleOwner);
    wonByExecutive.set(
      executive,
      (wonByExecutive.get(executive) || 0) + (Number(document?.importe) || 0)
    );
  }

  const elapsedDays = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  const resultTeams = safeTeams.map((team) => {
    const members = (Array.isArray(team?.members) ? team.members : []).map((member) => {
      const executiveKeys = [
        ...new Set(
          [member?.userId, member?.name, member?.executive].filter(hasValue).map(normalizeText)
        ),
      ];
      let realMonthly = 0;
      if (member?.active !== false) {
        for (const key of executiveKeys) realMonthly += wonByExecutive.get(key) || 0;
      }
      return {
        id: member?.id,
        name: member?.name,
        role: member?.role,
        active: member?.active,
        realMonthly,
        monthlyGoal: projectGoal(realMonthly, elapsedDays, daysInMonth),
      };
    });
    const realMonthly = members.reduce(
      (sum, member) => sum + (member.active === false ? 0 : member.realMonthly),
      0
    );
    return {
      id: team?.id,
      name: team?.name,
      members,
      realMonthly,
      monthlyGoal: projectGoal(realMonthly, elapsedDays, daysInMonth),
    };
  });

  const totalsReal = resultTeams.reduce((sum, team) => sum + team.realMonthly, 0);
  return {
    teams: resultTeams,
    totals: {
      realMonthly: totalsReal,
      monthlyGoal: projectGoal(totalsReal, elapsedDays, daysInMonth),
    },
  };
}
