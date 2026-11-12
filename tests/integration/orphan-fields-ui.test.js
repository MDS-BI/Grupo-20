import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActiveConfig } from '../../src/module-config.js';
import { loadEntities } from '../../src/storage.js';

const regionField = { target: 'entity', key: 'region', label: 'Región', type: 'text' };
const configWithRegion = { customFields: [regionField] };

function qs(id) {
  return document.getElementById(id);
}

function navigate(view) {
  document.querySelector(`[data-action="navigate"][data-view="${view}"]`).click();
}

async function seedWithRegion() {
  vi.resetModules();
  const moduleConfig = await import('../../src/module-config.js');
  const storage = await import('../../src/storage.js');
  moduleConfig.setActiveConfig(configWithRegion);
  storage.addEntity({ name: 'Acme', code: 'AC-001', region: 'EMEA' });
}

async function bootWith(configOverride) {
  vi.resetModules();
  const { initApp } = await import('../../src/app.js');
  const moduleConfig = await import('../../src/module-config.js');
  document.body.innerHTML = '<div id="app"></div>';
  await initApp(document.getElementById('app'), moduleConfig.normalizeConfig(configOverride));
}

function searchFor(term) {
  navigate('search');
  qs('search-input').value = term;
  qs('search-input').dispatchEvent(new Event('input', { bubbles: true }));
}

describe('User Story 7 - orphan custom values', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
    localStorage.clear();
    setActiveConfig(null);
  });

  it('hides undeclared values from the interface without deleting them', async () => {
    await seedWithRegion();
    await bootWith({ customFields: [] });

    navigate('manage-entity');
    expect(qs('field-region')).toBeNull();

    searchFor('acme');
    const item = qs('search-results-list').querySelector('.entity-item');
    expect(item).not.toBeNull();
    expect(item.textContent).not.toContain('Región');

    expect(loadEntities()[0].region).toBe('EMEA');
  });

  it('restores hidden values in the form and search once the field is declared again', async () => {
    await seedWithRegion();
    await bootWith(configWithRegion);

    navigate('search');
    document.querySelector('[data-action="edit-entity"]').click();
    expect(qs('field-region').value).toBe('EMEA');

    searchFor('emea');
    const item = qs('search-results-list').querySelector('.entity-item');
    expect(item).not.toBeNull();
    expect(item.textContent).toContain('Región: EMEA');
  });
});
