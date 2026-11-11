import { afterEach, beforeEach } from 'vitest';

beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = '';
  window.confirm = () => true;
});

afterEach(() => {
  localStorage.clear();
  document.body.innerHTML = '';
});
