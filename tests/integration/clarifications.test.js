import { describe, it, expect, beforeEach, vi } from 'vitest';
import { normalizeConfig } from '../../src/module-config.js';
import { addEntity, addDocument, loadEntities, loadDocuments } from '../../src/storage.js';
import { initApp } from '../../src/app.js';

function qs(id) {
  return document.getElementById(id);
}

function mount(configOverride) {
  document.body.innerHTML = '<div id="app"></div>';
  return initApp(document.getElementById('app'), normalizeConfig(configOverride));
}

function navigate(view) {
  document.querySelector(`[data-action="navigate"][data-view="${view}"]`).click();
}

function submitEntity(name, code) {
  navigate('manage-entity');
  qs('field-name').value = name;
  qs('field-code').value = code;
  qs('entity-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}

describe('Clarifications 2026-11-01', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
    localStorage.clear();
    globalThis.confirm = vi.fn(() => true);
  });

  it('rejects a duplicate code ignoring case and spaces', () => {
    mount(undefined);
    submitEntity('Acme', 'AC-001');
    expect(loadEntities().length).toBe(1);

    submitEntity('Other', ' ac-001 ');
    expect(loadEntities().length).toBe(1);
    expect(qs('error-code').textContent).toMatch(/código/i);
  });

  it('shows a visible warning and falls back to defaults for invalid configuration', () => {
    mount({ moduleName: '', theme: { accentColor: 'not-a-color' } });

    expect(qs('config-warning').hidden).toBe(false);
    expect(qs('config-warning').textContent).toContain('Configuración');
    expect(qs('brand-name').textContent).toBe('Módulo Base ERP');
    expect(document.documentElement.style.getPropertyValue('--accent')).toBe('#2563eb');
  });

  it('renders user-provided text as text without executing markup', () => {
    mount(undefined);
    addEntity({
      name: '<img src=x onerror="window.__xss = 1">',
      code: 'XSS-1',
      description: '<script>window.__xss = 2</script>',
    });

    navigate('search');
    qs('search-input').value = 'img';
    qs('search-input').dispatchEvent(new Event('input', { bubbles: true }));

    const item = qs('search-results-list').querySelector('.entity-item');
    expect(item).not.toBeNull();
    expect(item.querySelector('img')).toBeNull();
    expect(item.querySelector('script')).toBeNull();
    expect(item.textContent).toContain('img');
    expect(window.__xss).toBeUndefined();
  });

  it('asks for confirmation before deleting an entity and reports how many documents will be removed', () => {
    mount(undefined);
    const entity = addEntity({ name: 'Acme', code: 'AC-001' });
    addDocument({ entity_id: entity.entity_id, notes: 'Llamada 1', startDate: '2026-08-01' });
    addDocument({ entity_id: entity.entity_id, notes: 'Llamada 2', startDate: '2026-08-03' });

    navigate('search');
    document.querySelector('[data-action="edit-entity"]').click();
    document.querySelector('[data-action="delete-entity"]').click();

    expect(globalThis.confirm).toHaveBeenCalledTimes(1);
    expect(globalThis.confirm.mock.calls[0][0]).toContain('2 documento');
    expect(loadEntities().length).toBe(0);
    expect(loadDocuments().length).toBe(0);
  });
});
