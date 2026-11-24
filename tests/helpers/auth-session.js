import { DEMO_PASSWORD, ensureSeedUsers, login } from '../../src/auth.js';

export async function signIn(username = 'camila.ramirez', password = DEMO_PASSWORD) {
  ensureSeedUsers();
  return login(username, password);
}

export function seedAuth() {
  ensureSeedUsers();
}
