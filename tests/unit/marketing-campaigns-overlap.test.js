import { afterEach, describe, expect, it, vi } from 'vitest';
import { createCampaign, selectCampaignsForEvent } from '../../src/utils/marketing-campaigns.js';

const now = new Date(2026, 10, 23, 9, 30, 0);
const entity = { id: 'rec_1', entity_id: 'ent_1', estado_comercial: 'en_recontacto' };

function makeCampaign(id, createdAt, extra = {}) {
  const [campaign] = createCampaign({
    name: id,
    stage: 'en_recontacto',
    startDate: '2026-11-01',
    endDate: '2026-11-30',
    ...extra,
  });
  return { ...campaign, id, createdAt, ...extra };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

function select(campaigns, options = {}) {
  return selectCampaignsForEvent({
    event: 'entity_created',
    entity,
    campaigns,
    now,
    ...options,
  });
}

describe('Solapamiento de campañas internas (T111)', () => {
  it('ejecuta la campaña más reciente y registra la otra como omitida', () => {
    const older = makeCampaign('camp-antigua', '2026-11-01T10:00:00.000Z');
    const newer = makeCampaign('camp-reciente', '2026-11-02T10:00:00.000Z');
    const campaigns = [older, newer];
    const result = select(campaigns);

    expect(result.selected).toBe(newer);
    expect(result.skipped).toHaveLength(1);
    expect(result.skipped[0]).toMatchObject({
      id: 'camp-antigua',
      name: 'camp-antigua',
      notes: 'omitida por solapamiento',
      campaignId: 'camp-antigua',
      skipReason: 'solapamiento con campaña más reciente',
      entity_id: 'ent_1',
      event: 'entity_created',
      fecha: now.toISOString(),
    });
    expect(campaigns).toEqual([older, newer]);
  });

  it('desempata por id cuando createdAt es igual', () => {
    const first = makeCampaign('camp-a', '2026-11-02T10:00:00.000Z');
    const second = makeCampaign('camp-z', '2026-11-02T10:00:00.000Z');
    const result = select([first, second]);

    expect(result.selected.id).toBe('camp-z');
    expect(result.skipped).toHaveLength(1);
    expect(result.skipped[0].campaignId).toBe('camp-a');
  });

  it('omite todas las campañas aplicables restantes sin duplicar acciones', () => {
    const first = makeCampaign('camp-1', '2026-11-01T10:00:00.000Z');
    const second = makeCampaign('camp-2', '2026-11-02T10:00:00.000Z');
    const newest = makeCampaign('camp-3', '2026-11-03T10:00:00.000Z');
    const result = select([first, second, newest]);

    expect(result.selected).toBe(newest);
    expect(result.skipped).toHaveLength(2);
    expect(result.skipped.map((campaign) => campaign.campaignId)).toEqual(['camp-2', 'camp-1']);
    expect(result.skipped.every((campaign) => campaign.notes === 'omitida por solapamiento')).toBe(
      true
    );
  });

  it('excluye campañas detenidas, fuera de periodo, de otra etapa o de otro evento', () => {
    const applicable = makeCampaign('camp-activa', '2026-11-01T10:00:00.000Z');
    const newest = makeCampaign('camp-reciente', '2026-11-02T10:00:00.000Z');
    const excluded = [
      makeCampaign('camp-detenida', '2026-11-20T10:00:00.000Z', { status: 'detenida' }),
      makeCampaign('camp-fuera-periodo', '2026-11-20T10:00:00.000Z', {
        startDate: '2026-12-01',
        endDate: '2026-12-31',
      }),
      makeCampaign('camp-otra-etapa', '2026-11-20T10:00:00.000Z', { stage: 'prospecto' }),
      makeCampaign('camp-otro-evento', '2026-11-20T10:00:00.000Z', { event: 'stage_changed' }),
      makeCampaign('camp-externa', '2026-11-20T10:00:00.000Z', { action: 'send_email' }),
    ];
    const result = select([applicable, ...excluded, newest]);

    expect(result.selected).toBe(newest);
    expect(result.skipped).toHaveLength(1);
    expect(result.skipped[0].campaignId).toBe('camp-activa');
  });

  it('devuelve selección vacía sin campañas y no escribe en localStorage', () => {
    const setItem = vi.fn();
    vi.stubGlobal('localStorage', { setItem });

    expect(select([])).toEqual({ selected: null, skipped: [] });
    expect(selectCampaignsForEvent()).toEqual({ selected: null, skipped: [] });
    expect(setItem).not.toHaveBeenCalled();

    const campaigns = [
      makeCampaign('camp-antigua', '2026-11-01T10:00:00.000Z'),
      makeCampaign('camp-reciente', '2026-11-02T10:00:00.000Z'),
    ];
    select(campaigns);
    expect(setItem).not.toHaveBeenCalled();
  });
});
