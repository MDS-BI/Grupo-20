import { MESSAGES } from './utils/messages.js';

const USERS_KEY = 'erp_users';
const SESSION_KEY = 'erp_session';

export const SESSION_HOURS = 8;

const DEMO_USERS = [
  ['gerente', 'n4_manager'],
  ['marketing', 'n3_marketing'],
  ['ventas', 'n2_sales'],
  ['atencion', 'n1_support'],
];

const DEMO_USER_IDS = DEMO_USERS.map(([username]) => `user-${normalizeUsername(username)}`);

function storage() {
  return typeof localStorage !== 'undefined' ? localStorage : null;
}

function readJson(key, fallback) {
  try {
    const raw = storage()?.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  storage()?.setItem(key, JSON.stringify(value));
}

export function normalizeUsername(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

function buildUser(username, rank) {
  const now = new Date().toISOString();
  return {
    id: `user-${normalizeUsername(username).replace(/[^a-z0-9]+/g, '-')}`,
    username,
    usernameKey: normalizeUsername(username),
    rank,
    active: true,
    createdAt: now,
    updatedAt: now,
  };
}

let _authForced = false;

export function setAuthForced(value) {
  _authForced = Boolean(value);
}

export function authEnabled() {
  return _authForced || Boolean(storage()?.getItem(USERS_KEY) || storage()?.getItem(SESSION_KEY));
}

export function ensureSeedUsers() {
  if (storage()?.getItem(USERS_KEY)) return;
  writeJson(
    USERS_KEY,
    DEMO_USERS.map(([username, rank]) => buildUser(username, rank))
  );
}

export function listUsers() {
  const users = readJson(USERS_KEY, []);
  if (!Array.isArray(users)) return [];
  return users
    .map((user, index) => ({ user, index }))
    .sort((a, b) => {
      const seedA = DEMO_USER_IDS.indexOf(a.user?.id);
      const seedB = DEMO_USER_IDS.indexOf(b.user?.id);
      const rankA = seedA === -1 ? DEMO_USER_IDS.length : seedA;
      const rankB = seedB === -1 ? DEMO_USER_IDS.length : seedB;
      if (rankA !== rankB) return rankA - rankB;
      if (rankA !== DEMO_USER_IDS.length) return a.index - b.index;
      const createdA = String(a.user?.createdAt || '');
      const createdB = String(b.user?.createdAt || '');
      if (createdA !== createdB) return createdA < createdB ? -1 : 1;
      return a.index - b.index;
    })
    .map((entry) => entry.user);
}

function saveUsers(users) {
  writeJson(USERS_KEY, users);
}

export function getCurrentSession() {
  const session = readJson(SESSION_KEY, null);
  if (!session?.userId) return null;
  const user = listUsers().find(
    (candidate) => candidate.id === session.userId && candidate.active === true
  );
  const expired = session.expiresAt && Date.parse(session.expiresAt) <= Date.now();
  if (!user || expired) {
    storage()?.removeItem(SESSION_KEY);
    return null;
  }
  return session;
}

export function getCurrentUser() {
  const session = getCurrentSession();
  if (!session) return null;
  return (
    listUsers().find((candidate) => candidate.id === session.userId && candidate.active === true) ||
    null
  );
}

export async function login(userId) {
  ensureSeedUsers();
  const user = listUsers().find(
    (candidate) => candidate.id === userId && candidate.active === true
  );
  if (!user) throw new Error('No se pudo iniciar sesión.');
  const now = Date.now();
  writeJson(SESSION_KEY, {
    userId: user.id,
    issuedAt: new Date(now).toISOString(),
    lastActivityAt: new Date(now).toISOString(),
    expiresAt: new Date(now + SESSION_HOURS * 60 * 60 * 1000).toISOString(),
  });
  return user;
}

export function logout() {
  storage()?.removeItem(SESSION_KEY);
}

export function touchSession() {
  const session = getCurrentSession();
  if (!session) return;
  const now = Date.now();
  writeJson(SESSION_KEY, {
    ...session,
    lastActivityAt: new Date(now).toISOString(),
    expiresAt: new Date(now + SESSION_HOURS * 60 * 60 * 1000).toISOString(),
  });
}

export function createUser(values = {}) {
  const username = String(values.username || '').trim();
  const rank = String(values.rank || '').trim();
  if (!username || !rank) throw new Error(MESSAGES.required);
  const user = buildUser(username, rank);
  const users = listUsers();
  if (users.some((candidate) => candidate.usernameKey === user.usernameKey)) {
    throw new Error(MESSAGES.required);
  }
  users.push(user);
  saveUsers(users);
  return user;
}

export function updateUser(id, updates = {}) {
  const users = listUsers();
  const user = users.find((candidate) => candidate.id === id);
  if (!user) return null;
  if (updates.username !== undefined) {
    const key = normalizeUsername(updates.username);
    if (users.some((candidate) => candidate.id !== id && candidate.usernameKey === key)) {
      throw new Error(MESSAGES.required);
    }
    user.username = updates.username;
    user.usernameKey = key;
  }
  if (updates.rank !== undefined) user.rank = updates.rank;
  if (updates.active !== undefined) user.active = Boolean(updates.active);
  const previousTime = Date.parse(user.updatedAt ?? user.createdAt);
  const nextTime = Math.max(Date.now(), Number.isNaN(previousTime) ? 0 : previousTime + 1);
  user.updatedAt = new Date(nextTime).toISOString();
  saveUsers(users);
  if (!user.active) {
    const session = readJson(SESSION_KEY, null);
    if (session?.userId === id) storage()?.removeItem(SESSION_KEY);
  }
  return user;
}

export function deactivateUser(id) {
  return updateUser(id, { active: false });
}

export function listExecutiveUsers() {
  return listUsers()
    .filter(
      (user) => user.active !== false && (user.rank === 'n2_sales' || user.rank === 'n4_manager')
    )
    .map((user) => ({
      id: user.id,
      username: user.username,
      name: user.username,
      rank: user.rank,
    }));
}

export function resolveExecutive(value) {
  if (value === undefined || value === null || value === '') return null;
  const raw = String(value).trim();
  if (!raw) return null;
  const key = normalizeUsername(raw);
  const executives = listExecutiveUsers();
  return (
    executives.find((user) => user.id === raw) ||
    executives.find((user) => normalizeUsername(user.username) === key) ||
    executives.find((user) => normalizeUsername(user.name) === key) ||
    null
  );
}
