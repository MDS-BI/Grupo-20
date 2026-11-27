import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, loadModuleConfig, validateConfig } from '../../src/module-config.js';
import {
  DEFAULT_POSTVENTA_CONFIG,
  allowsTicketTransition,
  computeTicketStats,
  isResolutionNoteRequired,
  isTicket,
  validatePostventaConfig,
  validateTicketValues,
} from '../../src/utils/postventa.js';
import { renderTicketFormHtml } from '../../src/components/ticket-form.js';
import { renderPostventaHtml } from '../../src/components/postventa.js';

describe('Configuración y utilidades de Postventa (T195)', () => {
  it('declara exactamente los estados, opciones y tarjetas contratados', () => {
    expect(validatePostventaConfig(DEFAULT_POSTVENTA_CONFIG)).toEqual([]);
    expect(DEFAULT_POSTVENTA_CONFIG.states).toEqual(['Abierto', 'En revisión', 'Resuelto']);
    expect(DEFAULT_POSTVENTA_CONFIG.categoryOptions).toEqual([
      { value: 'soporte_tecnico', label: 'Soporte técnico' },
      { value: 'facturacion', label: 'Facturación' },
      { value: 'garantia', label: 'Garantía' },
      { value: 'consulta', label: 'Consulta' },
    ]);
    expect(DEFAULT_POSTVENTA_CONFIG.priorityOptions).toEqual([
      { value: 'baja', label: 'Baja' },
      { value: 'media', label: 'Media' },
      { value: 'alta', label: 'Alta' },
    ]);
    expect(DEFAULT_POSTVENTA_CONFIG.cardMapping).toEqual({
      abiertos: 'Abierto',
      enProceso: 'En revisión',
      resueltos: 'Resuelto',
    });
    expect(DEFAULT_POSTVENTA_CONFIG.resolutionNoteStates).toEqual(['Resuelto']);
    expect(DEFAULT_POSTVENTA_CONFIG.transitions).toEqual([]);
    expect(DEFAULT_POSTVENTA_CONFIG).not.toHaveProperty('defaultPriority');
    expect(
      DEFAULT_POSTVENTA_CONFIG.priorityOptions.every(
        (option) => !option.selected && !option.default
      )
    ).toBe(true);
  });

  it('rechaza cualquier desviación de la configuración y una prioridad preseleccionada', () => {
    const base = structuredClone(DEFAULT_POSTVENTA_CONFIG);
    base.states = ['Abierto', 'Cerrado'];
    expect(validatePostventaConfig(base).length).toBeGreaterThan(0);

    const badCategory = structuredClone(DEFAULT_POSTVENTA_CONFIG);
    badCategory.categoryOptions[0].label = 'Soporte';
    expect(validatePostventaConfig(badCategory).length).toBeGreaterThan(0);

    const badPriority = structuredClone(DEFAULT_POSTVENTA_CONFIG);
    badPriority.priorityOptions.pop();
    expect(validatePostventaConfig(badPriority).length).toBeGreaterThan(0);

    const preselected = { ...structuredClone(DEFAULT_POSTVENTA_CONFIG), defaultPriority: 'baja' };
    expect(validatePostventaConfig(preselected).length).toBeGreaterThan(0);

    const badMapping = structuredClone(DEFAULT_POSTVENTA_CONFIG);
    badMapping.cardMapping.enProceso = 'Proceso';
    expect(validatePostventaConfig(badMapping).length).toBeGreaterThan(0);

    const badNote = structuredClone(DEFAULT_POSTVENTA_CONFIG);
    badNote.resolutionNoteStates = ['Abierto'];
    expect(validatePostventaConfig(badNote).length).toBeGreaterThan(0);

    const badTransitions = structuredClone(DEFAULT_POSTVENTA_CONFIG);
    badTransitions.transitions = { Abierto: ['Resuelto'] };
    expect(validatePostventaConfig(badTransitions).length).toBeGreaterThan(0);
  });

  it('permite cualquier par de estados, incluida la reapertura', () => {
    const states = DEFAULT_POSTVENTA_CONFIG.states;
    for (const from of states) {
      for (const to of states) {
        expect(allowsTicketTransition(from, to, DEFAULT_POSTVENTA_CONFIG)).toBe(true);
      }
    }
    expect(allowsTicketTransition('Resuelto', 'Abierto', DEFAULT_POSTVENTA_CONFIG)).toBe(true);
    expect(allowsTicketTransition('Resuelto', 'Cerrado', DEFAULT_POSTVENTA_CONFIG)).toBe(false);
  });

  it('usa ticket: true como único discriminador', () => {
    expect(isTicket({ ticket: true, status: 'Abierto' })).toBe(true);
    expect(isTicket({ ticket: false, status: 'Abierto' })).toBe(false);
    expect(isTicket({ status: 'Abierto' })).toBe(false);
  });

  it('cuenta cada ticket una sola vez en una pasada', () => {
    const ticket = (id, status, extra = {}) => ({ id, ticket: true, status, ...extra });
    const stats = computeTicketStats({
      documents: [
        ticket('t1', 'Abierto'),
        ticket('t2', 'En revisión'),
        ticket('t3', 'Resuelto'),
        ticket('t3', 'Resuelto'),
        ticket('t4', 'Abierto'),
        { id: 'd1', status: 'Abierto' },
      ],
    });
    expect(stats).toEqual({ abiertos: 2, enProceso: 1, resueltos: 1 });
  });

  it('exige prioridad y nota solo cuando corresponde, con el mensaje exacto', () => {
    const entities = [{ entity_id: 'ent-1' }];
    expect(
      validateTicketValues(
        { entity_id: 'ent-1', asunto: 'Falla', categoria: 'garantia', status: 'Abierto' },
        { entities }
      )._form
    ).toBe('Completa los campos obligatorios.');
    expect(
      validateTicketValues(
        {
          entity_id: 'ent-1',
          asunto: 'Falla',
          categoria: 'garantia',
          prioridad: 'alta',
          status: 'Resuelto',
        },
        { entities }
      )._form
    ).toBe('Completa los campos obligatorios.');
    expect(
      validateTicketValues(
        {
          entity_id: 'ent-1',
          asunto: 'Falla',
          categoria: 'garantia',
          prioridad: 'alta',
          status: 'Abierto',
        },
        { entities }
      )
    ).toEqual({});
    expect(
      validateTicketValues(
        { entity_id: 'ent-inexistente', asunto: 'Falla', categoria: 'garantia', prioridad: 'alta' },
        { entities }
      ).entity_id
    ).toBeTruthy();
  });

  it('integra el bloque postventa en la configuración cargada sin romper la base', () => {
    expect(DEFAULT_CONFIG.postventa).toEqual(DEFAULT_POSTVENTA_CONFIG);
    expect(loadModuleConfig(null).config.postventa).toEqual(DEFAULT_POSTVENTA_CONFIG);
    expect(loadModuleConfig({ moduleName: 'CRM' }).config.postventa).toEqual(
      DEFAULT_POSTVENTA_CONFIG
    );
    expect(validateConfig({ postventa: { states: ['Abierto'] } }).length).toBeGreaterThan(0);
  });
});

describe('Formulario y vista de tickets (T226/T230)', () => {
  it('deja la prioridad sin preseleccionar y marca la nota como exclusiva de Resuelto', () => {
    const html = renderTicketFormHtml(null, {
      clients: [{ entity_id: 'e-1', name: 'Cliente', code: 'C-1' }],
      formValues: { entity_id: 'e-1' },
    });
    expect(html).toContain('<option value="e-1" selected>Cliente (C-1)</option>');
    expect(html).toMatch(
      /id="ticket-prioridad"[\s\S]*<option value="" selected>-- Selecciona --<\/option>/
    );
    expect(html).toContain('data-when-equals="Resuelto"');
    expect(html).not.toMatch(/<option value="baja" selected>/);
  });

  it('exige la nota solo en Resuelto y valida prioridad obligatoria', () => {
    expect(isResolutionNoteRequired('Resuelto')).toBe(true);
    expect(isResolutionNoteRequired('Abierto')).toBe(false);
    expect(
      validateTicketValues(
        { entity_id: 'e-1', asunto: 'Falla', categoria: 'garantia', status: 'Abierto' },
        { entities: [{ entity_id: 'e-1' }] }
      )._form
    ).toBe('Completa los campos obligatorios.');
  });

  it('renderiza tres tarjetas y el panel en línea sin abrir pestaña', () => {
    const html = renderPostventaHtml(null, {
      tickets: [{ id: 't-1', ticket: true, entity_id: 'e-1', status: 'Abierto' }],
      clients: [{ entity_id: 'e-1', name: 'Cliente' }],
      ticketFormOpen: true,
      ticketFormHtml: '<form id="ticket-form"></form>',
    });
    expect(html.match(/class="stat-card"/g)).toHaveLength(3);
    expect(html).toContain('id="ticket-form"');
    expect(html).not.toContain('ticket-form?view');
  });
});
