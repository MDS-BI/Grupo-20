import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DEMO_PASSWORD,
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

afterEach(() => {
  vi.restoreAllMocks();
  logout();
});

describe('Política de autenticación demostrativa', () => {
  it('expone la duración de sesión y una contraseña de prueba cualquiera', () => {
    expect(SESSION_HOURS).toBe(8);
    expect(DEMO_PASSWORD).toBeTruthy();
  });

  it('normaliza nombres de usuario recortando y pasando a minúsculas', () => {
    expect(normalizeUsername('  Ventas  ')).toBe('ventas');
    expect(normalizeUsername('GERENTE')).toBe('gerente');
    expect(normalizeUsername('')).toBe('');
    expect(normalizeUsername(null)).toBe('');
    expect(normalizeUsername(undefined)).toBe('');
  });
});

describe('Usuarios de demostración', () => {
  it('siembra exactamente los cuatro usuarios con sus rangos y sin contraseñas', () => {
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
      expect(user).not.toHaveProperty('passwordHash');
      expect(user).not.toHaveProperty('salt');
      expect(user).not.toHaveProperty('failedAttempts');
      expect(user).not.toHaveProperty('lockedUntil');
      expect(user.active).toBe(true);
      expect(Number.isNaN(Date.parse(user.createdAt))).toBe(false);
    }

    const stored = localStorage.getItem('erp_users');
    ensureSeedUsers();
    expect(localStorage.getItem('erp_users')).toBe(stored);
  });
});

describe('Inicio de sesión demostrativo', () => {
  it.each([
    ['gerente', 'n4_manager'],
    ['marketing', 'n3_marketing'],
    ['ventas', 'n2_sales'],
    ['atencion', 'n1_support'],
  ])('%s inicia sesión con cualquier contraseña', async (username, rank) => {
    const user = await login(`  ${username.toUpperCase()}  `, `clave-${username}-cualquiera`);
    const session = getCurrentSession();

    expect(user.rank).toBe(rank);
    expect(session).toMatchObject({ userId: user.id });
    expect(Number.isNaN(Date.parse(session.issuedAt))).toBe(false);
    expect(Number.isNaN(Date.parse(session.lastActivityAt))).toBe(false);
    expect(Date.parse(session.expiresAt) - Date.parse(session.issuedAt)).toBe(
      SESSION_HOURS * 60 * 60 * 1000
    );
    expect(session).not.toHaveProperty('rank');
    expect(getCurrentUser()).toMatchObject({ id: user.id, rank });
  });

  it('rechaza la contraseña vacía con el mensaje exacto', async () => {
    seedAuth();

    await expect(login('gerente', '')).rejects.toThrow('Ingresa una contraseña');
    await expect(login('gerente', '   ')).rejects.toThrow('Ingresa una contraseña');
    expect(getCurrentSession()).toBeNull();
    expect(localStorage.getItem('erp_session')).toBeNull();
  });

  it('rechaza un usuario inexistente con el mensaje exacto', async () => {
    seedAuth();

    await expect(login('desconocido', DEMO_PASSWORD)).rejects.toThrow('Usuario no encontrado');
    expect(getCurrentSession()).toBeNull();
    expect(localStorage.getItem('erp_session')).toBeNull();
  });

  it('no bloquea al usuario tras intentos fallidos', async () => {
    seedAuth();
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await expect(login('ventas', '')).rejects.toThrow('Ingresa una contraseña');
    }

    await expect(login('ventas', 'otra-clave')).resolves.toMatchObject({ usernameKey: 'ventas' });
    expect(getCurrentSession()).not.toBeNull();
    expect(listUsers().find((user) => user.usernameKey === 'ventas')).not.toHaveProperty(
      'failedAttempts'
    );
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

    logout();
    touchSession();
    expect(localStorage.getItem('erp_session')).toBeNull();
  });

  it('descarta una sesión expirada y elimina la clave', async () => {
    const user = await signIn('ventas');
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
    const user = await signIn('ventas');
    expect(getCurrentUser()).not.toBeNull();

    deactivateUser(user.id);

    expect(getCurrentSession()).toBeNull();
    expect(getCurrentUser()).toBeNull();
    expect(localStorage.getItem('erp_session')).toBeNull();
  });
});

describe('Administración de usuarios', () => {
  it('createUser rechaza duplicados normalizados', async () => {
    seedAuth();
    const created = createUser({
      username: ' Ana.Muñoz ',
      password: DEMO_PASSWORD,
      rank: 'n2_sales',
    });

    expect(created.usernameKey).toBe('ana.muñoz');
    expect(created).not.toHaveProperty('passwordHash');
    expect(created.active).toBe(true);

    const count = listUsers().length;
    expect(() =>
      createUser({ username: 'ANA.MUÑOZ', password: DEMO_PASSWORD, rank: 'n4_manager' })
    ).toThrow();
    expect(() =>
      createUser({ username: '  ana.muñoz  ', password: DEMO_PASSWORD, rank: 'n2_sales' })
    ).toThrow();
    expect(listUsers()).toHaveLength(count);
  });

  it('updateUser sincroniza usernameKey, aplica rangos y rechaza duplicados', () => {
    seedAuth();
    const ventas = listUsers().find((user) => user.usernameKey === 'ventas');

    const renamed = updateUser(ventas.id, { username: ' VENTAS ', rank: 'n4_manager' });
    expect(renamed.usernameKey).toBe('ventas');
    expect(renamed.rank).toBe('n4_manager');
    expect(() => updateUser(ventas.id, { username: ' GERENTE ' })).toThrow();
    expect(listUsers().find((user) => user.id === ventas.id).rank).toBe('n4_manager');
  });
});
