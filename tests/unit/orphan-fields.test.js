import { describe, it, expect, beforeEach } from 'vitest';
import { addEntity, updateEntity, loadEntities, validateEntity } from '../../src/storage.js';
import { setActiveConfig } from '../../src/module-config.js';

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear()
};

beforeEach(() => {
  store.clear();
  setActiveConfig(null);
});

describe('custom field retention across configuration changes', () => {
  it('keeps undeclared values in storage and restores them when redeclared', () => {
    setActiveConfig({
      customFields: [{ target: 'entity', key: 'region', label: 'Región', type: 'text' }]
    });
    const entity = addEntity({ name: 'Acme', code: 'AC-001', region: 'EMEA' });
    expect(loadEntities()[0].region).toBe('EMEA');

    setActiveConfig({ customFields: [] });
    updateEntity(entity.id, { name: 'Acme Updated' });
    expect(loadEntities()[0].region).toBe('EMEA');

    setActiveConfig({
      customFields: [{ target: 'entity', key: 'region', label: 'Región', type: 'text' }]
    });
    expect(loadEntities()[0].region).toBe('EMEA');
    expect(validateEntity(loadEntities()[0]).valid).toBe(true);
  });
});
