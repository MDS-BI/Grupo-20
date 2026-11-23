import { describe, it, expect, beforeEach } from 'vitest';
import { initApp } from '../../src/app.js';

let app;

function mount() {
  document.body.innerHTML = '<div id="app"></div>';
  app = initApp(document.getElementById('app'), { rawConfig: {} });
  return app;
}

describe('Pantalla de gestión dedicada (H4)', () => {
  beforeEach(() => {
    mount();
  });

  it('no muestra la lista de entidades en la pantalla de gestión', () => {
    document.getElementById('field-name'); // no-op to ensure dom ready
    app.navigate('manage-entity');
    document.getElementById('field-name').value = 'Acme';
    document.getElementById('field-code').value = 'AC-1';
    document.getElementById('entity-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    expect(document.querySelector('.manage-view .entity-list')).toBeNull();
  });

  it('alterna entre la pestaña de entidades y la de documentos', () => {
    app.navigate('manage-entity');
    expect(document.querySelector('[data-action="manage-tab"][data-tab="entity"]').classList.contains('active')).toBe(true);

    app.navigate('manage-document');
    expect(document.querySelector('[data-action="manage-tab"][data-tab="document"]').classList.contains('active')).toBe(true);
  });
});
