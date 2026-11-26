import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { logout } from '../../src/auth.js';
import { DEFAULT_CONFIG, setActiveConfig } from '../../src/module-config.js';
import { MESSAGES } from '../../src/utils/messages.js';
import { signIn } from '../helpers/auth-session.js';
import {
  ValidationError,
  addEntity,
  changeTicketStatus,
  createTicketDocument,
  listTicketDocuments,
  loadDocuments,
  setStorageAuthEnforced,
} from '../../src/storage.js';

const baseValues = {
  asunto: 'Falla con el producto',
  categoria: 'soporte_tecnico',
  prioridad: 'alta',
  status: 'Abierto',
};

let ownEntity;
let otherEntity;

async function switchUser(username) {
  logout();
  await signIn(username);
  setStorageAuthEnforced(true);
}

function tick() {
  return new Promise((resolve) => setTimeout(resolve, 2));
}

describe('Operaciones de Postventa en la capa de datos (T197)', () => {
  beforeEach(async () => {
    setActiveConfig(DEFAULT_CONFIG);
    await signIn('gerente');
    setStorageAuthEnforced(true);
    ownEntity = addEntity({
      name: 'Cliente Propio',
      code: 'PV-1',
      ejecutivo_asignado: 'user-ventas',
      ownerId: 'user-ventas',
    });
    otherEntity = addEntity({
      name: 'Cliente Ajeno',
      code: 'PV-2',
      ejecutivo_asignado: 'user-gerente',
      ownerId: 'user-gerente',
    });
  });

  afterEach(() => {
    setStorageAuthEnforced(false);
    logout();
    setActiveConfig(DEFAULT_CONFIG);
    vi.restoreAllMocks();
  });

  it('N1 crea un ticket vinculado, saneado y sin nota fuera de Resuelto', async () => {
    await switchUser('atencion');
    const ticket = createTicketDocument({
      ...baseValues,
      entity_id: ownEntity.entity_id,
      asunto: '  <b>Falla</b>  ',
      nota_resolucion: 'No corresponde',
    });

    expect(ticket).toMatchObject({
      ticket: true,
      entity_id: ownEntity.entity_id,
      asunto: '&lt;b&gt;Falla&lt;/b&gt;',
      status: 'Abierto',
      nota_resolucion: '',
    });
    expect(loadDocuments()).toHaveLength(1);
  });

  it('rechaza clientes inexistentes y campos obligatorios con el mensaje exacto', () => {
    expect(() => createTicketDocument({ ...baseValues, entity_id: 'no-existe' })).toThrow(
      ValidationError
    );
    expect(() =>
      createTicketDocument({ ...baseValues, entity_id: ownEntity.entity_id, prioridad: '' })
    ).toThrow(ValidationError);
    try {
      createTicketDocument({
        ...baseValues,
        entity_id: ownEntity.entity_id,
        status: 'Resuelto',
      });
      throw new Error('debió fallar');
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.errors._form).toBe('Completa los campos obligatorios.');
    }
    expect(loadDocuments()).toHaveLength(0);
  });

  it('acepta cualquier transición y conserva la nota al reabrir', async () => {
    const ticket = createTicketDocument({ ...baseValues, entity_id: ownEntity.entity_id });
    await tick();
    const resolved = changeTicketStatus(ticket.id, 'Resuelto', '  <b>Listo</b>  ');
    expect(resolved.status).toBe('Resuelto');
    expect(resolved.nota_resolucion).toBe('&lt;b&gt;Listo&lt;/b&gt;');
    expect(resolved.updatedAt >= ticket.updatedAt).toBe(true);

    await tick();
    const inReview = changeTicketStatus(ticket.id, 'En revisión', 'se descarta');
    expect(inReview.status).toBe('En revisión');
    expect(inReview.nota_resolucion).toBe(resolved.nota_resolucion);

    await tick();
    const reopened = changeTicketStatus(ticket.id, 'Abierto', 'se descarta');
    expect(reopened.status).toBe('Abierto');
    expect(reopened.nota_resolucion).toBe(resolved.nota_resolucion);
    expect(reopened.updatedAt >= inReview.updatedAt).toBe(true);
  });

  it('exige nota para llegar a Resuelto desde cualquier estado', () => {
    const ticket = createTicketDocument({ ...baseValues, entity_id: ownEntity.entity_id });
    try {
      changeTicketStatus(ticket.id, 'Resuelto', '   ');
      throw new Error('debió fallar');
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.errors._form).toBe('Completa los campos obligatorios.');
    }
    expect(loadDocuments()[0].status).toBe('Abierto');
  });

  it('N2 solo recibe los tickets de sus clientes', async () => {
    const ownTicket = createTicketDocument({ ...baseValues, entity_id: ownEntity.entity_id });
    createTicketDocument({ ...baseValues, entity_id: otherEntity.entity_id });
    await switchUser('ventas');

    const tickets = listTicketDocuments();
    expect(tickets.map((ticket) => ticket.id)).toEqual([ownTicket.id]);
    expect(() => createTicketDocument({ ...baseValues, entity_id: ownEntity.entity_id })).toThrow(
      MESSAGES.permissionDenied
    );
    expect(() => changeTicketStatus(ownTicket.id, 'Resuelto', 'nota')).toThrow(
      MESSAGES.permissionDenied
    );
  });

  it('N3 y visitantes no leen ni escriben tickets', async () => {
    const stored = localStorage.getItem('erp_documents');
    await switchUser('marketing');
    const setItem = vi.spyOn(localStorage, 'setItem');

    expect(() => createTicketDocument({ ...baseValues, entity_id: ownEntity.entity_id })).toThrow(
      MESSAGES.permissionDenied
    );
    expect(() => changeTicketStatus('rec-1', 'Resuelto', 'nota')).toThrow(
      MESSAGES.permissionDenied
    );
    expect(() => listTicketDocuments()).toThrow(MESSAGES.permissionDenied);
    expect(setItem).not.toHaveBeenCalled();
    expect(localStorage.getItem('erp_documents')).toBe(stored);
  });
});
