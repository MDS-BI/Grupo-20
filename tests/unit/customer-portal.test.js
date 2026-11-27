import { afterEach, describe, expect, it } from 'vitest';
import {
  buildPortalTicketValues,
  findClientByEmailOrPhone,
} from '../../src/utils/customer-portal.js';
import { DEFAULT_CONFIG, MODULE_CONFIG, setActiveConfig } from '../../src/module-config.js';

const config = MODULE_CONFIG;
const clients = [
  {
    entity_id: 'cli-2',
    name: 'Cliente Reciente',
    contacto_correo: 'cliente@ejemplo.cl',
    contacto_telefono: '+56987654321',
    createdAt: '2026-02-01T00:00:00.000Z',
  },
  {
    entity_id: 'cli-1',
    name: 'Cliente Original',
    contacto_correo: 'CLIENTE@EJEMPLO.CL',
    contacto_telefono: '+56 9 8765 4321',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

afterEach(() => setActiveConfig(DEFAULT_CONFIG));

describe('Utilidades del Portal del Cliente', () => {
  it('busca por correo o teléfono sin distinguir mayúsculas ni espacios', () => {
    expect(findClientByEmailOrPhone(clients, ' cliente@ejemplo.cl ').entity_id).toBe('cli-1');
    expect(findClientByEmailOrPhone(clients, '', '+56987654321').entity_id).toBe('cli-1');
    expect(findClientByEmailOrPhone(clients, 'otro@ejemplo.cl', '+56900000000')).toBeNull();
  });

  it('selecciona el cliente más antiguo cuando hay varias coincidencias', () => {
    const client = findClientByEmailOrPhone(clients, 'cliente@ejemplo.cl', '+56987654321');
    expect(client.entity_id).toBe('cli-1');
  });

  it('rechaza los campos obligatorios sin mutar valores', () => {
    const result = buildPortalTicketValues(
      { correo_cliente: 'cliente@ejemplo.cl', categoria: '', descripcion: '' },
      { entities: clients, config }
    );
    expect(result.errors._form).toBe('Completa los campos obligatorios.');
    expect(result.values).toBeNull();
  });

  it('rechaza una búsqueda sin coincidencia con el mensaje exacto', () => {
    const result = buildPortalTicketValues(
      {
        correo_cliente: 'otro@ejemplo.cl',
        categoria: 'Consulta',
        descripcion: 'No encuentro mi pedido.',
      },
      { entities: clients, config }
    );
    expect(result.errors._form).toBe('No encontramos un cliente con ese correo o teléfono.');
    expect(result.values).toBeNull();
  });

  it('construye los valores del ticket público con estado Abierto y prioridad Media', () => {
    const result = buildPortalTicketValues(
      {
        correo_cliente: '+56 9 8765 4321',
        categoria: 'consulta',
        descripcion: 'No encuentro mi pedido.',
      },
      { entities: clients, config }
    );
    expect(result.errors).toEqual({});
    expect(result.values).toMatchObject({
      ticket: true,
      entity_id: 'cli-1',
      asunto: 'Consulta',
      categoria: 'consulta',
      notes: 'No encuentro mi pedido.',
      status: 'Abierto',
      prioridad: 'media',
    });
    expect(result.values.createdByUserId).toBeUndefined();
  });
});
