import { describe, expect, it } from 'vitest';
import { computePendingByEntity } from '../../src/utils/marketing-stats.js';

function sample(args = {}) {
  return {
    entities: [
      { entity_id: 'e1', name: 'Cliente Uno' },
      { entity_id: 'e2', name: 'Cliente Dos' },
      { entity_id: 'e3', name: 'Archivado', archivedAt: '2026-11-01' },
    ],
    documents: [
      { entity_id: 'e1', status: 'pendiente' },
      { entity_id: 'e1', status: 'en_revision' },
      { entity_id: 'e1', status: 'cerrado perdido' },
      { entity_id: 'e2', status: 'pendiente' },
      { entity_id: 'e3', status: 'pendiente' },
    ],
    config: {
      statusLifecycle: {
        states: ['pendiente', 'en_revision', 'cerrado perdido'],
        pendingStates: ['en_revision'],
      },
    },
    ...args,
  };
}

describe('Ciclo de vida y pendientes configurados', () => {
  it('cuenta solo pendingStates declarados', () => {
    const result = computePendingByEntity(sample());
    expect(result.totalPending).toBe(1);
    expect(result.pendingByEntity).toHaveLength(1);
    expect(result.pendingByEntity[0]).toMatchObject({ entityId: 'e1', count: 1 });
    expect(result.pendingByEntity[0].entity.name).toBe('Cliente Uno');
  });

  it('usa la coincidencia normalizada con pendiente sin pendingStates', () => {
    const args = sample();
    delete args.config.statusLifecycle.pendingStates;
    const result = computePendingByEntity(args);
    expect(result.totalPending).toBe(2);
    expect(result.pendingByEntity.map((row) => row.entityId)).toEqual(['e1', 'e2']);
  });

  it('excluye entidades archivadas y cierres perdidos', () => {
    const args = sample();
    args.config.statusLifecycle.pendingStates = ['pendiente'];
    const result = computePendingByEntity(args);
    expect(result.totalPending).toBe(2);
    expect(result.pendingByEntity.map((row) => row.entityId)).toEqual(['e1', 'e2']);
  });
});
