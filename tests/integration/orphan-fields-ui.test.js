import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActiveConfig } from '../../src/module-config.js';
import { loadEntities } from '../../src/storage.js';

const regionField = { target: 'entity', key: 'region', label: 'Región', type: 'text' };
const configWithRegion = { customFields: [regionField] };

const pedidosField = { target: 'entity', key: 'pedidos', label: 'Pedidos', type: 'number' };
const orphanValues = {
  category: 'CategoriaHuerfana',
  description: 'DescripcionHuerfana',
  pedidos: 777,
};
const configHidingOrphans = {
  customFields: [],
  fieldRules: {
    entity: {
      category: { hidden: true, searchable: false },
      description: { hidden: true, searchable: false },
      pedidos: { hidden: true, searchable: false },
    },
  },
};
const configRedeclaringOrphans = { customFields: [pedidosField], fieldRules: { entity: {} } };

function qs(id) {
  return document.getElementById(id);
}

let app;

function navigate(view) {
  app.navigate(view);
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
  app = await initApp(document.getElementById('app'), moduleConfig.normalizeConfig(configOverride));
}

function searchFor(term) {
  navigate('search');
  qs('search-input').value = term;
  qs('search-input').dispatchEvent(new Event('input', { bubbles: true }));
}

async function seedLegacyEntity() {
  vi.resetModules();
  const moduleConfig = await import('../../src/module-config.js');
  const storage = await import('../../src/storage.js');
  moduleConfig.setActiveConfig({ customFields: [pedidosField] });
  return storage.addEntity({
    name: 'Cliente Heredado',
    code: 'HER-001',
    ...orphanValues,
  });
}

function storedEntity() {
  return JSON.parse(localStorage.getItem('erp_entities'))[0];
}

function expectNoOrphanValues(text) {
  expect(text).not.toContain(orphanValues.category);
  expect(text).not.toContain(orphanValues.description);
  expect(text).not.toContain(String(orphanValues.pedidos));
  expect(text).not.toContain('Categoría');
  expect(text).not.toContain('Descripción');
  expect(text).not.toContain('Pedidos');
}

function expectOrphanValuesPresent(text) {
  expect(text).toContain(orphanValues.category);
  expect(text).toContain(orphanValues.description);
  expect(text).toContain(String(orphanValues.pedidos));
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

describe('T129 - valores huérfanos de category, description y pedidos', () => {
  it('los conserva en erp_entities y los oculta en formulario, lista, ficha y búsqueda', async () => {
    const legacy = await seedLegacyEntity();
    await bootWith(configHidingOrphans);

    const stored = storedEntity();
    expect(stored.id).toBe(legacy.id);
    expect(stored.category).toBe(orphanValues.category);
    expect(stored.description).toBe(orphanValues.description);
    expect(stored.pedidos).toBe(orphanValues.pedidos);
    expect(loadEntities()[0].pedidos).toBe(orphanValues.pedidos);

    navigate('manage-entity');
    expect(qs('field-category')).toBeNull();
    expect(qs('field-description')).toBeNull();
    expect(qs('field-pedidos')).toBeNull();
    expectNoOrphanValues(qs('entity-form').textContent);

    searchFor('heredado');
    const item = qs('search-results-list').querySelector('.entity-item');
    expect(item).not.toBeNull();
    expectNoOrphanValues(item.textContent);

    document.querySelector('[data-action="view-entity"]').click();
    expect(qs('entity-detail-info')).not.toBeNull();
    expectNoOrphanValues(qs('entity-detail-info').textContent);

    for (const term of [orphanValues.category, orphanValues.description, String(orphanValues.pedidos)]) {
      searchFor(term);
      expect(qs('search-results').textContent).toContain('No hay');
    }
  });

  it('los mantiene al editar ocultos y los restituye al redeclarar los campos', async () => {
    await seedLegacyEntity();
    await bootWith(configHidingOrphans);

    searchFor('heredado');
    document.querySelector('[data-action="edit-entity"]').click();
    qs('field-name').value = 'Cliente Heredado Editado';
    qs('entity-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    const afterEdit = storedEntity();
    expect(afterEdit.name).toBe('Cliente Heredado Editado');
    expect(afterEdit.category).toBe(orphanValues.category);
    expect(afterEdit.description).toBe(orphanValues.description);
    expect(afterEdit.pedidos).toBe(orphanValues.pedidos);

    await bootWith(configRedeclaringOrphans);

    searchFor('Editado');
    document.querySelector('[data-action="edit-entity"]').click();
    expect(qs('field-category').value).toBe(orphanValues.category);
    expect(qs('field-description').value).toBe(orphanValues.description);
    expect(qs('field-pedidos').value).toBe(String(orphanValues.pedidos));

    searchFor(orphanValues.category);
    let item = qs('search-results-list').querySelector('.entity-item');
    expect(item).not.toBeNull();
    expect(item.textContent).toContain('Pedidos: 777');

    searchFor(orphanValues.description);
    item = qs('search-results-list').querySelector('.entity-item');
    expect(item).not.toBeNull();

    searchFor(String(orphanValues.pedidos));
    item = qs('search-results-list').querySelector('.entity-item');
    expect(item).not.toBeNull();
    document.querySelector('[data-action="view-entity"]').click();
    expectOrphanValuesPresent(qs('entity-detail-info').textContent);
    expect(qs('entity-detail-info').textContent).toContain('Pedidos: 777');
  });
});
