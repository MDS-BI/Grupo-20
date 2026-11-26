import { describe, it, expect, beforeEach } from 'vitest';
import { initApp } from '../../src/app.js';
import { addEntity, addDocument } from '../../src/storage.js';

let app;

function mount() {
  document.body.innerHTML = '<div id="app"></div>';
  app = initApp(document.getElementById('app'));
  return app;
}

function seed() {
  const entity = addEntity({
    name: 'Prospecto Navegación',
    code: 'NAV-1',
    targetDate: '1980-05-05',
    rut: '11.111.111-1',
    canal_contacto: 'correo',
    contacto_correo: 'navegacion@ejemplo.cl',
  });
  addDocument({
    entity_id: entity.entity_id,
    status: 'pendiente',
    notes: 'Llamada de prueba',
    importe: 120,
  });
  return entity;
}

describe('Navegación a Marketing desde la barra lateral (T044/T131)', () => {
  beforeEach(() => mount());

  it('abre Marketing como cuarta opción y resalta la vista activa', () => {
    const buttons = [...document.querySelectorAll('.sidebar-button')];
    expect(buttons).toHaveLength(5);
    expect(buttons[3].dataset.view).toBe('marketing');
    expect(buttons[4].dataset.view).toBe('postventa');
    buttons[3].click();
    expect(document.querySelector('.marketing-view')).toBeTruthy();
    expect(document.querySelector('.sidebar-button.active').dataset.view).toBe('marketing');
  });

  it('recorre Panel, Buscar y Resumen sin perder erp_entities ni erp_documents', () => {
    const entity = seed();
    const entitiesBefore = localStorage.getItem('erp_entities');
    const documentsBefore = localStorage.getItem('erp_documents');

    document.querySelector('[data-view="marketing"]').click();
    expect(document.querySelector('.marketing-view')).toBeTruthy();
    document.querySelector('[data-view="dashboard"]').click();
    expect(document.querySelector('.dashboard')).toBeTruthy();
    document.querySelector('[data-view="search"]').click();
    expect(document.querySelector('#search-input')).toBeTruthy();
    document.querySelector('[data-view="summary"]').click();
    expect(document.querySelector('.commercial-summary')).toBeTruthy();

    expect(localStorage.getItem('erp_entities')).toBe(entitiesBefore);
    expect(localStorage.getItem('erp_documents')).toBe(documentsBefore);
    expect(JSON.parse(localStorage.getItem('erp_entities'))[0].entity_id).toBe(entity.entity_id);
    expect(JSON.parse(localStorage.getItem('erp_documents'))[0].entity_id).toBe(entity.entity_id);
  });

  it('no ofrece acceso desde el panel ni controles retirados de Marketing', () => {
    app.navigate('dashboard');
    const panelHtml = document.getElementById('app').innerHTML;
    expect(panelHtml).not.toContain('Abrir Marketing');

    app.navigate('marketing');
    const marketingHtml = document.getElementById('app').innerHTML;
    expect(marketingHtml).not.toContain('Abrir Marketing');
    expect(marketingHtml).not.toContain('Estado comercial de la cartera');
    expect(marketingHtml).not.toContain('estado_comercial');
    expect(document.querySelector('[data-role="marketing-stage"]')).toBeNull();
  });

  it('ofrece cinco atajos de Marketing en el orden acordado (T138)', () => {
    app.navigate('marketing');
    const tabs = [
      ...document.querySelectorAll('.marketing-sections [data-action="marketing-section"]'),
    ];

    expect(tabs.map((tab) => tab.dataset.section)).toEqual([
      'team',
      'campaigns',
      'performance',
      'chat',
      'social',
    ]);
    expect(tabs.map((tab) => tab.textContent.trim())).toEqual([
      'Equipos de ventas y logros',
      'Campañas',
      'Rendimiento de campañas',
      'Dudas y consultas',
      'Redes sociales',
    ]);
  });

  it('reserva las acciones rápidas al panel y elimina etiquetas obsoletas (T144)', () => {
    app.navigate('dashboard');
    expect(document.querySelectorAll('.dashboard .quick-actions button')).toHaveLength(5);
    expect(document.body.textContent).not.toContain('Abrir Marketing');

    app.navigate('marketing');
    const marketingView = document.querySelector('.marketing-view');
    const marketingText = document.getElementById('app').textContent;
    expect(marketingView.querySelector('.quick-actions')).toBeNull();
    expect(marketingText).toContain('Equipos de ventas y logros');
    expect(marketingText).toContain('Dudas y consultas');
    expect(marketingText).not.toContain('Equipo de ventas y logros');
    expect(marketingText).not.toContain('Chat');
  });
});
