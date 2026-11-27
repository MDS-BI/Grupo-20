import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  SESSION_HOURS,
  createUser,
  deactivateUser,
  ensureSeedUsers,
  getCurrentSession,
  getCurrentUser,
  listUsers,
  login,
  logout,
  normalizeUsername,
  touchSession,
  updateUser,
} from '../../src/auth.js';
import { seedAuth, signIn } from '../helpers/auth-session.js';
import { MESSAGES } from '../../src/utils/messages.js';

const FORBIDDEN_MESSAGES = ['Ingresa una contraseña', 'Usuario no encontrado'];

function expectGenericError(error) {
  expect(error).toBeInstanceOf(Error);
  for (const text of FORBIDDEN_MESSAGES) expect(error.message).not.toContain(text);
}

afterEach(() => {
  vi.restoreAllMocks();
  logout();
});

describe('Política de acceso demostrativo', () => {
  it('expone la duración de sesión y normaliza nombres sin contraseña', () => {
    expect(SESSION_HOURS).toBe(8);
    expect(normalizeUsername('  Ventas  ')).toBe('ventas');
    expect(normalizeUsername('GERENTE')).toBe('gerente');
    expect(normalizeUsername('')).toBe('');
    expect(normalizeUsername(null)).toBe('');
    expect(normalizeUsername(undefined)).toBe('');
  });

  it.each([
    ['gerente', 'n4_manager'],
    ['marketing', 'n3_marketing'],
    ['ventas', 'n2_sales'],
    ['atencion', 'n1_support'],
  ])('%s inicia sesión por id con su rango vigente', async (usernameKey, rank) => {
    seedAuth();
    const user = listUsers().find((candidate) => candidate.usernameKey === usernameKey);
    expect(user).toBeTruthy();

    const signedIn = await login(user.id);
    const session = getCurrentSession();

    expect(signedIn).toMatchObject({ id: user.id, usernameKey, rank, active: true });
    expect(session).toMatchObject({ userId: user.id });
    expect(Number.isNaN(Date.parse(session.issuedAt))).toBe(false);
    expect(Number.isNaN(Date.parse(session.lastActivityAt))).toBe(false);
    expect(Date.parse(session.expiresAt) - Date.parse(session.issuedAt)).toBe(
      SESSION_HOURS * 60 * 60 * 1000
    );
    expect(session).not.toHaveProperty('rank');
    expect(session).not.toHaveProperty('password');
    expect(getCurrentUser()).toMatchObject({ id: user.id, rank });
  });

  it('resuelve login solo por id y nunca con un nombre de usuario', async () => {
    seedAuth();
    let error;
    try {
      await login('gerente');
    } catch (caught) {
      error = caught;
    }

    expectGenericError(error);
    expect(getCurrentSession()).toBeNull();
    expect(localStorage.getItem('erp_session')).toBeNull();
    await expect(login('user-gerente')).resolves.toMatchObject({ usernameKey: 'gerente' });
  });

  it('rechaza usuarios inexistentes con un error genérico', async () => {
    seedAuth();
    let error;
    try {
      await login('user-inexistente');
    } catch (caught) {
      error = caught;
    }

    expectGenericError(error);
    expect(getCurrentSession()).toBeNull();
    expect(localStorage.getItem('erp_session')).toBeNull();
  });

  it('exige active === true incluso si el valor almacenado solo parece verdadero', async () => {
    seedAuth();
    const user = listUsers().find((candidate) => candidate.usernameKey === 'ventas');
    const users = listUsers().map((candidate) =>
      candidate.id === user.id ? { ...candidate, active: 'true' } : candidate
    );
    localStorage.setItem('erp_users', JSON.stringify(users));

    let error;
    try {
      await login(user.id);
    } catch (caught) {
      error = caught;
    }

    expectGenericError(error);
    expect(getCurrentSession()).toBeNull();
  });

  it('rechaza usuarios desactivados sin mensajes de credenciales', async () => {
    seedAuth();
    const user = listUsers().find((candidate) => candidate.usernameKey === 'ventas');
    deactivateUser(user.id);

    let error;
    try {
      await login(user.id);
    } catch (caught) {
      error = caught;
    }

    expectGenericError(error);
    expect(getCurrentSession()).toBeNull();
    expect(localStorage.getItem('erp_session')).toBeNull();
  });

  it('renueva lastActivityAt y expiresAt con touchSession mientras la sesión esté vigente', async () => {
    await signIn('gerente');
    const before = getCurrentSession();
    const later = Date.now() + 60_000;
    vi.spyOn(Date, 'now').mockReturnValue(later);

    touchSession();
    const after = getCurrentSession();

    expect(after.lastActivityAt).not.toBe(before.lastActivityAt);
    expect(after.expiresAt).not.toBe(before.expiresAt);
    expect(Date.parse(after.expiresAt) - later).toBe(SESSION_HOURS * 60 * 60 * 1000);
    expect(after.issuedAt).toBe(before.issuedAt);

    logout();
    touchSession();
    expect(localStorage.getItem('erp_session')).toBeNull();
  });

  it('descarta una sesión expirada y elimina la clave', async () => {
    await signIn('ventas');
    const session = getCurrentSession();
    localStorage.setItem(
      'erp_session',
      JSON.stringify({ ...session, expiresAt: new Date(Date.now() - 1000).toISOString() })
    );

    expect(getCurrentSession()).toBeNull();
    expect(getCurrentUser()).toBeNull();
    expect(localStorage.getItem('erp_session')).toBeNull();
  });

  it('revoca de inmediato la sesión de un usuario desactivado', async () => {
    const user = await signIn('ventas');
    expect(getCurrentUser()).not.toBeNull();

    deactivateUser(user.id);

    expect(getCurrentSession()).toBeNull();
    expect(getCurrentUser()).toBeNull();
    expect(localStorage.getItem('erp_session')).toBeNull();
  });
});

describe('Usuarios semilla y orden estable', () => {
  it('siembra exactamente cuatro usuarios activos sin credenciales', () => {
    ensureSeedUsers();
    const users = listUsers();

    expect(users.map((user) => user.usernameKey)).toEqual([
      'gerente',
      'marketing',
      'ventas',
      'atencion',
    ]);
    expect(Object.fromEntries(users.map((user) => [user.usernameKey, user.rank]))).toEqual({
      gerente: 'n4_manager',
      marketing: 'n3_marketing',
      ventas: 'n2_sales',
      atencion: 'n1_support',
    });
    for (const user of users) {
      expect(user.id).toBeTruthy();
      expect(user.active).toBe(true);
      expect(user).not.toHaveProperty('password');
      expect(user).not.toHaveProperty('passwordHash');
      expect(user).not.toHaveProperty('salt');
      expect(user).not.toHaveProperty('failedAttempts');
      expect(user).not.toHaveProperty('lockedUntil');
      expect(Number.isNaN(Date.parse(user.createdAt))).toBe(false);
    }

    const stored = localStorage.getItem('erp_users');
    ensureSeedUsers();
    expect(localStorage.getItem('erp_users')).toBe(stored);
  });

  it('coloca semilla primero y después los creados por createdAt sin reordenar al recargar', async () => {
    seedAuth();
    const ana = createUser({ username: 'ana.munoz', rank: 'n2_sales' });
    const bruno = createUser({ username: 'bruno', rank: 'n1_support' });
    const users = listUsers().map((user) => {
      if (user.id === ana.id) return { ...user, createdAt: '2026-11-27T12:00:00.000Z' };
      if (user.id === bruno.id) return { ...user, createdAt: '2026-11-27T08:00:00.000Z' };
      return user;
    });
    localStorage.setItem('erp_users', JSON.stringify(users));

    const expected = ['gerente', 'marketing', 'ventas', 'atencion', 'bruno', 'ana.munoz'];
    expect(listUsers().map((user) => user.usernameKey)).toEqual(expected);
    await expect(signIn('bruno')).resolves.toMatchObject({ usernameKey: 'bruno' });
    expect(listUsers().map((user) => user.usernameKey)).toEqual(expected);
  });
});

describe('Administración de usuarios sin contraseña', () => {
  it('createUser valida username y rank no vacíos sin exigir ni propagar password', () => {
    seedAuth();

    expect(() => createUser({ username: '  ', rank: 'n2_sales', password: 'x' })).toThrow(
      MESSAGES.required
    );
    expect(() => createUser({ username: 'ana', rank: '   ', password: 'x' })).toThrow(
      MESSAGES.required
    );

    const created = createUser({
      username: ' Ana.Muñoz ',
      rank: 'n2_sales',
      password: 'no-debe-guardarse',
    });
    expect(created.username).toBe('Ana.Muñoz');
    expect(created.usernameKey).toBe('ana.muñoz');
    expect(created.rank).toBe('n2_sales');
    expect(created.active).toBe(true);
    expect(created.updatedAt).toBeTruthy();
    expect(created).not.toHaveProperty('password');
    expect(created).not.toHaveProperty('passwordHash');
    expect(listUsers().find((user) => user.id === created.id)).not.toHaveProperty('password');
  });

  it('createUser rechaza duplicados normalizados', () => {
    seedAuth();
    const created = createUser({ username: ' Ana.Muñoz ', rank: 'n2_sales' });
    const count = listUsers().length;

    expect(() => createUser({ username: 'ANA.MUÑOZ', rank: 'n4_manager' })).toThrow(
      MESSAGES.required
    );
    expect(() => createUser({ username: '  ana.muñoz  ', rank: 'n2_sales' })).toThrow(
      MESSAGES.required
    );
    expect(listUsers()).toHaveLength(count);
    expect(listUsers().filter((user) => user.id === created.id)).toHaveLength(1);
  });

  it('updateUser sincroniza usernameKey, aplica rangos y rechaza duplicados', () => {
    seedAuth();
    const ventas = listUsers().find((user) => user.usernameKey === 'ventas');
    const before = listUsers().find((user) => user.id === ventas.id);

    const renamed = updateUser(ventas.id, { username: ' VENTAS ', rank: 'n4_manager' });
    expect(renamed.usernameKey).toBe('ventas');
    expect(renamed.rank).toBe('n4_manager');
    expect(renamed.updatedAt).not.toBe(before.updatedAt);
    expect(() => updateUser(ventas.id, { username: ' GERENTE ' })).toThrow(MESSAGES.required);
    expect(listUsers().find((user) => user.id === ventas.id).rank).toBe('n4_manager');
  });
});
