import { afterEach, beforeEach, describe, it, expect } from 'vitest';

let localStorageMock = {
  storage: {},
  getItem: function (key) { return this.storage[key] || null; },
  setItem: function (key, value) { this.storage[key] = String(value); },
  clear: function () { this.storage = {}; },
  removeItem: function (key) { delete this.storage[key]; },
};

beforeEach(() => {
  // Mock localStorage before modules load
  global.localStorage = localStorageMock;
  document.body.innerHTML = '';
  window.confirm = () => true;
});

afterEach(() => {
  // Restore clean localStorage
  localStorageMock.storage = {};
  document.body.innerHTML = '';
});