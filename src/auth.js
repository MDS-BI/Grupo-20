import { MESSAGES } from './utils/messages.js';

const USERS_KEY = 'erp_users';
const SESSION_KEY = 'erp_session';

export const SESSION_HOURS = 8;
export const LOCK_MINUTES = 15;
export const MAX_FAILED_ATTEMPTS = 5;
export const DEMO_PASSWORD = 'demo1234';

const SEED_USERS = [
  [
    'camila.ramirez',
    'n4_manager',
    'camila.ramirez-erp-salt',
    '6bb2d9c271ebc1bb800072a36b88b478886ebcf17f48dfb091fbac904d0bb1fc',
  ],
  [
    'lucia.fernandez',
    'n3_marketing',
    'lucia.fernandez-erp-salt',
    'fd09bc01c2fb3cf207ebf221ea4a976815b76984007be454cd564fe38f1f889e',
  ],
  [
    'pedro.soto',
    'n2_sales',
    'pedro.soto-erp-salt',
    'a1b9a42baf1757956cc672df6fa40085106fd0fd022e1239db7ec0ffacdb66e9',
  ],
  [
    'sofia.torres',
    'n1_support',
    'sofia.torres-erp-salt',
    '79e06f8ce7c68cbd8a9d685dd8207ea7153c3c652c2743f44b759be2bdc3a33f',
  ],
];

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

function bytesToHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function randomSalt() {
  const subtle = globalThis.crypto;
  if (subtle?.getRandomValues) return bytesToHex(subtle.getRandomValues(new Uint8Array(16)));
  return bytesToHex(new Uint8Array(16).map(() => Math.floor(Math.random() * 256)));
}

export async function hashPassword(password, salt) {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new Error('Web Crypto API no disponible');
  const key = await subtle.importKey(
    'raw',
    new TextEncoder().encode(String(password)),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: new TextEncoder().encode(String(salt)),
      iterations: 100000,
      hash: 'SHA-256',
    },
    key,
    256
  );
  return bytesToHex(new Uint8Array(bits));
}

export async function verifyPassword(password, user) {
  if (!user?.salt || !user?.passwordHash) return false;
  try {
    const digest = await hashPassword(password, user.salt);
    return digest.toLowerCase() === String(user.passwordHash).toLowerCase();
  } catch {
    return false;
  }
}

async function buildUser(username, rank, password) {
  const salt = randomSalt();
  const now = new Date().toISOString();
  return {
    id: `user-${normalizeUsername(username).replace(/[^a-z0-9]+/g, '-')}`,
    username,
    usernameKey: normalizeUsername(username),
    passwordHash: await hashPassword(password, salt),
    salt,
    rank,
    active: true,
    failedAttempts: 0,
    lockedUntil: null,
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
  const now = new Date().toISOString();
  const users = SEED_USERS.map(([username, rank, salt, passwordHash]) => ({
    id: `user-${normalizeUsername(username).replace(/[^a-z0-9]+/g, '-')}`,
    username,
    usernameKey: normalizeUsername(username),
    passwordHash,
    salt,
    rank,
    active: true,
    failedAttempts: 0,
    lockedUntil: null,
    createdAt: now,
    updatedAt: now,
  }));
  writeJson(USERS_KEY, users);
}

export function listUsers() {
  const users = readJson(USERS_KEY, []);
  return Array.isArray(users) ? users : [];
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

export async function login(username, password) {
  ensureSeedUsers();
  const users = listUsers();
  const key = normalizeUsername(username);
  const user = users.find((candidate) => candidate.usernameKey === key);
  const locked = user?.lockedUntil && Date.parse(user.lockedUntil) > Date.now();
  const valid = user && user.active !== false && !locked && (await verifyPassword(password, user));
  if (!valid) {
    if (user && user.active !== false && !locked) {
      user.failedAttempts = (user.failedAttempts || 0) + 1;
      if (user.failedAttempts >= MAX_FAILED_ATTEMPTS) {
        user.lockedUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000).toISOString();
      }
      saveUsers(users);
    }
    throw new Error(MESSAGES.invalidCredentials);
  }
  user.failedAttempts = 0;
  user.lockedUntil = null;
  user.updatedAt = new Date().toISOString();
  saveUsers(users);
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

export async function createUser(values = {}) {
  const user = await buildUser(values.username, values.rank, values.password);
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
  user.updatedAt = new Date().toISOString();
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
