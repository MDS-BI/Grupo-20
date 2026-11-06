import { describe, it, expect, beforeEach } from 'vitest';
import { initApp } from '../../src/app.js';

function mount() {
  document.body.innerHTML = '<div id="app"></div>';
  return initApp(document.getElementById('app'));
}

describe('Crear entidad y rechazar código duplicado (H1)', () => {
  beforeEach(() => {
    mount();
  });

  it('crea una entidad desde el formulario de gestión y aparece en los resultados de búsqueda', () => {
    document.querySelector('[data-action="navigate"][data-view="manage-entity"]').click();
    document.getElementById('field-name').value = 'Acme Corp';
    document.getElementById('field-code').value = 'AC-1';
    document.getElementById('entity-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    document.querySelector('[data-action="navigate"][data-view="search"]').click();
    const results = document.querySelectorAll('#search-results .list-item');
    expect(results).toHaveLength(1);
    expect(results[0].textContent).toContain('Acme Corp');
  });

  it('rechaza un código duplicado con un mensaje claro', () => {
    document.querySelector('[data-action="navigate"][data-view="manage-entity"]').click();
    document.getElementById('field-name').value = 'Acme Corp';
    document.getElementById('field-code').value = 'AC-1';
    document.getElementById('entity-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    document.querySelector('[data-action="navigate"][data-view="manage-entity"]').click();
    document.getElementById('field-name').value = 'Otra Empresa';
    document.getElementById('field-code').value = ' ac-1 ';
    document.getElementById('entity-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    expect(document.querySelector('.field-error').textContent).toMatch(/código/i);
  });
});
