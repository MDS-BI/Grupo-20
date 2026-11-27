import { ensureSeedUsers, listUsers, login, normalizeUsername } from '../../src/auth.js';

export async function signIn(username = 'gerente') {
  ensureSeedUsers();
  const key = normalizeUsername(username);
  const user = listUsers().find((candidate) => candidate.usernameKey === key);
  if (!user) throw new Error('No se pudo iniciar sesión.');
  return login(user.id);
}

export function seedAuth() {
  ensureSeedUsers();
}
