import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DEMO_PASSWORD,
  LOCK_MINUTES,
  MAX_FAILED_ATTEMPTS,
  SESSION_HOURS,
  createUser,
  deactivateUser,
  ensureSeedUsers,
  getCurrentSession,
  getCurrentUser,
  hashPassword,
  listUsers,
  login,
  logout,
  normalizeUsername,
  touchSession,
  updateUser,
  verifyPassword,
} from '../../src/auth.js';
import { seedAuth, signIn } from '../helpers/auth-session.js';
import { MESSAGES } from '../../src/utils/messages.js';

afterEach(() => {
  vi.restoreAllMocks();
  logout();
});

describe('Política de autenticación local', () => {
  it('expone las constantes de sesión, bloqueo e intentos', () => {
    expect(SESSION_HOURS).toBe(8);
    expect(LOCK_MINUTES).toBe(15);
    expect(MAX_FAILED_ATTEMPTS).toBe(5);
    expect(DEMO_PASSWORD).toBeTruthy();
  });

  it('normaliza nombres de usuario recortando y pasando a minúsculas', () => {
    expect(normalizeUsername('  Pedro.Soto  ')).toBe('pedro.soto');
    expect(normalizeUsername('CAMILA.RAMIREZ')).toBe('camila.ramirez');
    expect(normalizeUsername('')).toBe('');
    expect(normalizeUsername(null)).toBe('');
    expect(normalizeUsername(undefined)).toBe('');
  });

  it('deriva hashes PBKDF2 estables y verifica contraseñas sin guardarlas en texto plano', async () => {
    const salt = 'salt-de-prueba';
    const hash = await hashPassword(DEMO_PASSWORD, salt);

    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).not.toContain(DEMO_PASSWORD);
    expect(await hashPassword(DEMO_PASSWORD, salt)).toBe(hash);
    expect(await hashPassword('otra-contraseña', salt)).not.toBe(hash);
    expect(await hashPassword(DEMO_PASSWORD, 'otra-sal')).not.toBe(hash);
    expect(await verifyPassword(DEMO_PASSWORD, { salt, passwordHash: hash })).toBe(true);
    expect(await verifyPassword('incorrecta', { salt, passwordHash: hash })).toBe(false);
    expect(await verifyPassword(DEMO_PASSWORD, {})).toBe(false);
  });
});

describe('Usuarios semilla', () => {
  it('siembra los cuatro rangos una sola vez con datos derivados', () => {
    ensureSeedUsers();
    const users = listUsers();

    expect(users.map((user) => user.usernameKey)).toEqual([
      'camila.ramirez',
      'lucia.fernandez',
      'pedro.soto',
      'sofia.torres',
    ]);
    expect(Object.fromEntries(users.map((user) => [user.usernameKey, user.rank]))).toEqual({
      'camila.ramirez': 'n4_manager',
      'lucia.fernandez': 'n3_marketing',
      'pedro.soto': 'n2_sales',
      'sofia.torres': 'n1_support',
    });
    for (const user of users) {
      expect(user.id).toBeTruthy();
      expect(user.salt).toBeTruthy();
      expect(user.passwordHash).not.toBe(DEMO_PASSWORD);
      expect(user.active).toBe(true);
      expect(user.failedAttempts).toBe(0);
      expect(user.lockedUntil).toBeNull();
      expect(Number.isNaN(Date.parse(user.createdAt))).toBe(false);
    }

    const stored = localStorage.getItem('erp_users');
    ensureSeedUsers();
    expect(localStorage.getItem('erp_users')).toBe(stored);
  });
});

describe('Login y sesión persistente', () => {
  it('acepta el usuario normalizado y crea una sesión vigente de ocho horas', async () => {
    const user = await signIn('  CAMILA.RAMIREZ ', DEMO_PASSWORD);
    const session = getCurrentSession();

    expect(user.rank).toBe('n4_manager');
    expect(session).toMatchObject({ userId: user.id });
    expect(Number.isNaN(Date.parse(session.issuedAt))).toBe(false);
    expect(Number.isNaN(Date.parse(session.lastActivityAt))).toBe(false);
    expect(Date.parse(session.expiresAt) - Date.parse(session.issuedAt)).toBe(
      SESSION_HOURS * 60 * 60 * 1000
    );
    expect(session).not.toHaveProperty('rank');
    expect(getCurrentUser()).toMatchObject({ id: user.id, rank: 'n4_manager' });

    logout();
    expect(getCurrentSession()).toBeNull();
    expect(getCurrentUser()).toBeNull();
    expect(localStorage.getItem('erp_session')).toBeNull();
  });

  it('renueva lastActivityAt y expiresAt con touchSession mientras la sesión esté vigente', async () => {
    await signIn('camila.ramirez');
    const before = getCurrentSession();
    const later = Date.now() + 60_000;
    vi.spyOn(Date, 'now').mockReturnValue(later);

    touchSession();
    const after = getCurrentSession();

    expect(after.lastActivityAt).not.toBe(before.lastActivityAt);
    expect(after.expiresAt).not.toBe(before.expiresAt);
    expect(Date.parse(after.expiresAt) - later).toBe(SESSION_HOURS * 60 * 60 * 1000);

    logout();
    touchSession();
    expect(localStorage.getItem('erp_session')).toBeNull();
  });

  it('descarta una sesión expirada y elimina la clave', async () => {
    const user = await signIn('pedro.soto');
    const session = getCurrentSession();
    localStorage.setItem(
      'erp_session',
      JSON.stringify({ ...session, expiresAt: new Date(Date.now() - 1000).toISOString() })
    );

    expect(getCurrentSession()).toBeNull();
    expect(getCurrentUser()).toBeNull();
    expect(localStorage.getItem('erp_session')).toBeNull();
    expect(user.id).toBeTruthy();
  });

  it('revoca de inmediato la sesión de un usuario desactivado', async () => {
    const user = await signIn('pedro.soto');
    expect(getCurrentUser()).not.toBeNull();

    deactivateUser(user.id);

    expect(getCurrentSession()).toBeNull();
    expect(getCurrentUser()).toBeNull();
    expect(localStorage.getItem('erp_session')).toBeNull();
    await expect(login('pedro.soto', DEMO_PASSWORD)).rejects.toThrow(
      'Usuario o contraseña incorrectos'
    );
  });
});

describe('Bloqueo por intentos fallidos', () => {
  it('cuenta los fallos con el mensaje exacto y bloquea tras cinco intentos', async () => {
    seedAuth();
    for (let attempt = 0; attempt < MAX_FAILED_ATTEMPTS; attempt += 1) {
      await expect(login('pedro.soto', 'contraseña-mala')).rejects.toThrow(
        'Usuario o contraseña incorrectos'
      );
    }

    const locked = listUsers().find((user) => user.usernameKey === 'pedro.soto');
    expect(locked.failedAttempts).toBeGreaterThanOrEqual(MAX_FAILED_ATTEMPTS);
    expect(Date.parse(locked.lockedUntil)).toBeGreaterThan(Date.now());
    expect(Date.parse(locked.lockedUntil) - Date.now()).toBeLessThanOrEqual(
      LOCK_MINUTES * 60 * 1000
    );
    await expect(login('pedro.soto', DEMO_PASSWORD)).rejects.toThrow(MESSAGES.invalidCredentials);
  });

  it('un inicio de sesión correcto reinicia el contador antes del bloqueo', async () => {
    seedAuth();
    for (let attempt = 0; attempt < MAX_FAILED_ATTEMPTS - 1; attempt += 1) {
      await expect(login('sofia.torres', 'contraseña-mala')).rejects.toThrow(
        MESSAGES.invalidCredentials
      );
    }

    await login('sofia.torres', DEMO_PASSWORD);
    const user = listUsers().find((candidate) => candidate.usernameKey === 'sofia.torres');

    expect(user.failedAttempts).toBe(0);
    expect(user.lockedUntil).toBeNull();
    expect(getCurrentSession()).not.toBeNull();
  });
});

describe('Administración de usuarios', () => {
  it('createUser persiste datos derivados y rechaza duplicados normalizados', async () => {
    seedAuth();
    const created = await createUser({
      username: ' Ana.Muñoz ',
      password: DEMO_PASSWORD,
      rank: 'n2_sales',
    });

    expect(created.usernameKey).toBe('ana.muñoz');
    expect(created.passwordHash).not.toContain(DEMO_PASSWORD);
    expect(created.salt).toBeTruthy();
    expect(created.active).toBe(true);
    expect(created.failedAttempts).toBe(0);
    expect(created.lockedUntil).toBeNull();
    expect(await verifyPassword(DEMO_PASSWORD, created)).toBe(true);

    const count = listUsers().length;
    await expect(
      createUser({ username: 'ANA.MUÑOZ', password: DEMO_PASSWORD, rank: 'n4_manager' })
    ).rejects.toThrow();
    await expect(
      createUser({ username: '  ana.muñoz  ', password: DEMO_PASSWORD, rank: 'n2_sales' })
    ).rejects.toThrow();
    expect(listUsers()).toHaveLength(count);
  });

  it('updateUser sincroniza usernameKey, aplica rangos y rechaza duplicados', () => {
    seedAuth();
    const pedro = listUsers().find((user) => user.usernameKey === 'pedro.soto');

    const renamed = updateUser(pedro.id, { username: ' PEDRO.SOTO ', rank: 'n4_manager' });
    expect(renamed.usernameKey).toBe('pedro.soto');
    expect(renamed.rank).toBe('n4_manager');
    expect(() => updateUser(pedro.id, { username: ' Camila.Ramirez ' })).toThrow();
    expect(listUsers().find((user) => user.id === pedro.id).rank).toBe('n4_manager');
  });
});
