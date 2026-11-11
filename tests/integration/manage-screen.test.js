import { describe, it, expect, beforeEach } from 'vitest';
import { initApp } from '../../src/app.js';

function mount() {
  document.body.innerHTML = '<div id="app"></div>';
  return initApp(document.getElementById('app'));
}

describe('Pantalla de gestión dedicada (H4)', () => {
  beforeEach(() => {
    mount();
  });

  it('no muestra la lista de entidades en la pantalla de gestión', () => {
    document.getElementById('field-name'); // no-op to ensure dom ready
    document.querySelector('[data-action="navigate"][data-view="manage-entity"]').click();
    document.getElementById('field-name').value = 'Acme';
    document.getElementById('field-code').value = 'AC-1';
    document.getElementById('entity-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    expect(document.querySelector('.manage-view .entity-list')).toBeNull();
  });

  it('alterna entre la pestaña de entidades y la de documentos', () => {
    document.querySelector('[data-action="navigate"][data-view="manage-entity"]').click();
    expect(document.querySelector('[data-action="manage-tab"][data-tab="entity"]').classList.contains('active')).toBe(true);

    document.querySelector('[data-action="navigate"][data-view="manage-document"]').click();
    expect(document.querySelector('[data-action="manage-tab"][data-tab="document"]').classList.contains('active')).toBe(true);
  });
});
