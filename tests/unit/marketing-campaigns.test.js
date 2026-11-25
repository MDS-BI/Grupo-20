import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createCampaign,
  isCampaignActive,
  selectCampaignsForEvent,
  stopCampaign,
  updateCampaign,
} from '../../src/utils/marketing-campaigns.js';
import { deactivateUser, listUsers, updateUser } from '../../src/auth.js';
import { seedAuth, signIn } from '../helpers/auth-session.js';
import { DEFAULT_CONFIG, MODULE_CONFIG, setActiveConfig } from '../../src/module-config.js';
import {
  addDocument,
  loadDocuments,
  loadMarketingConfig,
  saveEntities,
  saveMarketingConfig,
} from '../../src/storage.js';

const now = new Date(2026, 10, 23, 12, 0, 0);
const baseValues = {
  name: 'Reactivación',
  stage: 'en_recontacto',
  startDate: '2026-11-01',
  endDate: '2026-11-30',
};

function makeCampaign(extra = {}) {
  const [campaign] = createCampaign({ ...baseValues, ...extra });
  return campaign;
}

function thrownError(callback) {
  try {
    callback();
  } catch (error) {
    return error;
  }
  throw new Error('Se esperaba un error de validación.');
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Campañas internas de Marketing (T110)', () => {
  it('crea una campaña nueva sin mutar la lista recibida', () => {
    const previous = [{ id: 'camp-anterior', name: 'Anterior' }];
    const campaigns = createCampaign(
      { name: 'Nueva campaña', startDate: '2026-11-01', endDate: '2026-11-30' },
      previous
    );

    expect(campaigns).not.toBe(previous);
    expect(previous).toHaveLength(1);
    expect(campaigns).toHaveLength(2);
    expect(campaigns[1]).toMatchObject({
      name: 'Nueva campaña',
      stage: 'prospecto',
      status: 'activa',
      action: 'create_document',
      executive: '',
      targetStage: '',
      notes: '',
    });
    expect(campaigns[1].id).toMatch(/^camp-/);
    expect(Number.isNaN(Date.parse(campaigns[1].createdAt))).toBe(false);
  });

  it('valida nombre, etapa, fechas ISO y orden de fechas con errores adjuntos', () => {
    expect(
      thrownError(() => createCampaign({ ...baseValues, name: '   ' })).errors.name
    ).toBeTruthy();
    expect(
      thrownError(() => createCampaign({ ...baseValues, stage: 'cerrado' })).errors.stage
    ).toBeTruthy();
    expect(
      thrownError(() => createCampaign({ ...baseValues, startDate: '23/11/2026' })).errors.startDate
    ).toBeTruthy();
    expect(
      thrownError(() => createCampaign({ ...baseValues, endDate: '2026-13-01' })).errors.endDate
    ).toBeTruthy();
    const error = thrownError(() =>
      createCampaign({ ...baseValues, startDate: '2026-11-30', endDate: '2026-11-01' })
    );
    expect(error.errors.endDate).toBeTruthy();
    expect(error.errors.length).toBeGreaterThan(0);
  });

  it('edita los campos permitidos conservando identidad y fecha de creación', () => {
    const campaign = makeCampaign();
    const other = { id: 'camp-otra', name: 'Otra' };
    const campaigns = [campaign, other];
    const updated = updateCampaign(
      campaign.id,
      {
        name: 'Reactivación editada',
        stage: 'ganado',
        startDate: '2026-11-05',
        endDate: '2026-11-25',
        action: 'assign_executive',
        executive: 'Ana',
        targetStage: 'en_proceso',
        notes: 'Seguimiento',
      },
      campaigns
    );

    expect(updated).not.toBe(campaigns);
    expect(campaigns[0]).toBe(campaign);
    expect(updated[0]).toMatchObject({
      id: campaign.id,
      createdAt: campaign.createdAt,
      name: 'Reactivación editada',
      stage: 'ganado',
      startDate: '2026-11-05',
      endDate: '2026-11-25',
      action: 'assign_executive',
      executive: 'Ana',
      targetStage: 'en_proceso',
      notes: 'Seguimiento',
    });
    expect(updated[1]).toBe(other);
  });

  it('no permite que una edición cambie id ni estado', () => {
    const campaign = makeCampaign();
    const [updated] = updateCampaign(campaign.id, { id: 'camp-suplantada', status: 'detenida' }, [
      campaign,
    ]);
    expect(updated).toMatchObject({ id: campaign.id, status: 'activa' });
  });

  it('detiene una campaña sin borrar su historial ni mutar la lista', () => {
    const campaign = makeCampaign();
    const other = makeCampaign({ stage: 'prospecto' });
    const campaigns = [campaign, other];
    const stopped = stopCampaign(campaign.id, campaigns);

    expect(stopped).not.toBe(campaigns);
    expect(stopped[0]).toMatchObject({ ...campaign, status: 'detenida' });
    expect(stopped[1]).toBe(other);
    expect(campaign.status).toBe('activa');
    expect(
      selectCampaignsForEvent({
        event: 'entity_created',
        entity: { entity_id: 'ent_1', estado_comercial: 'en_recontacto' },
        campaigns: stopped,
        now,
      }).selected
    ).toBeNull();
  });

  it('considera activo el día local de inicio y fin, inclusive', () => {
    const campaign = makeCampaign();
    expect(isCampaignActive(campaign, now)).toBe(true);
    expect(
      isCampaignActive({ ...campaign, startDate: '2026-11-23', endDate: '2026-11-23' }, now)
    ).toBe(true);
    expect(isCampaignActive(campaign, new Date(2026, 9, 31, 23, 59))).toBe(false);
    expect(isCampaignActive(campaign, new Date(2026, 11, 1, 0, 1))).toBe(false);
    expect(isCampaignActive({ ...campaign, status: 'detenida' }, now)).toBe(false);
    expect(isCampaignActive({ ...campaign, startDate: undefined, endDate: undefined }, now)).toBe(
      true
    );
  });

  it('aplica la campaña solo a la etapa objetivo del evento', () => {
    const campaign = makeCampaign();
    const entity = { entity_id: 'ent_1', estado_comercial: 'en_recontacto' };
    expect(
      selectCampaignsForEvent({ event: 'entity_created', entity, campaigns: [campaign], now })
        .selected
    ).toBe(campaign);
    expect(
      selectCampaignsForEvent({
        event: 'entity_created',
        entity: { ...entity, estado_comercial: 'prospecto' },
        campaigns: [campaign],
        now,
      }).selected
    ).toBeNull();
    expect(
      selectCampaignsForEvent({
        event: 'stage_changed',
        entity: { ...entity, estado_comercial: 'prospecto' },
        context: { to: 'en_recontacto' },
        campaigns: [campaign],
        now,
      }).selected
    ).toBe(campaign);
    expect(
      selectCampaignsForEvent({
        event: 'document_created',
        entity,
        campaigns: [{ ...campaign, event: 'stage_changed' }],
        now,
      }).selected
    ).toBeNull();
  });

  it('admite únicamente acciones internas', () => {
    const entity = { entity_id: 'ent_1', estado_comercial: 'prospecto' };
    for (const action of ['create_document', 'assign_executive', 'update_stage']) {
      const campaign = makeCampaign({ stage: 'prospecto', action });
      const { selected } = selectCampaignsForEvent({
        event: 'entity_created',
        entity,
        campaigns: [campaign],
        now,
      });
      expect(selected?.action).toBe(action);
    }
    for (const action of ['notify', 'send_email', 'publish']) {
      const campaign = makeCampaign({ stage: 'prospecto', action });
      expect(
        selectCampaignsForEvent({ event: 'entity_created', entity, campaigns: [campaign], now })
      ).toEqual({ selected: null, skipped: [] });
    }
  });

  it('no ejecuta acciones ni escribe en localStorage al seleccionar', () => {
    const setItem = vi.fn();
    vi.stubGlobal('localStorage', { setItem });
    const campaign = makeCampaign();
    const result = selectCampaignsForEvent({
      event: 'entity_created',
      entity: { entity_id: 'ent_1', estado_comercial: 'en_recontacto' },
      campaigns: [campaign],
      now,
    });

    expect(result).toEqual({ selected: campaign, skipped: [] });
    expect(setItem).not.toHaveBeenCalled();
  });
});

describe('Atribución del creador de campañas (FR-086/FR-098)', () => {
  afterEach(() => {
    setActiveConfig(DEFAULT_CONFIG);
  });

  it('persiste createdByUserId y lo conserva al editar, detener y seleccionar', () => {
    const campaign = makeCampaign({ createdByUserId: 'user-marketing' });
    expect(campaign.createdByUserId).toBe('user-marketing');
    expect(campaign.createdByUserId).not.toBe('Sistema');

    const [edited] = updateCampaign(campaign.id, { name: 'Reactivación editada' }, [campaign]);
    expect(edited.createdByUserId).toBe('user-marketing');

    const [stopped] = stopCampaign(campaign.id, [campaign]);
    expect(stopped.createdByUserId).toBe('user-marketing');

    const older = {
      ...campaign,
      id: 'camp-anterior',
      createdAt: new Date(Date.parse(campaign.createdAt) - 60_000).toISOString(),
    };
    const { selected, skipped } = selectCampaignsForEvent({
      event: 'entity_created',
      entity: { entity_id: 'ent-1', estado_comercial: campaign.stage },
      campaigns: [older, campaign],
      now,
    });

    expect(selected?.createdByUserId).toBe('user-marketing');
    expect(skipped).toHaveLength(1);
    expect(skipped[0].createdByUserId).toBe('user-marketing');
  });

  it('conserva el creador real tras cambiar de rango y desactivarlo', async () => {
    seedAuth();
    const lucia = listUsers().find((user) => user.usernameKey === 'marketing');
    const creator = await signIn('marketing');

    const campaigns = createCampaign({
      ...baseValues,
      createdByUserId: creator.id,
    });
    saveMarketingConfig({ ...loadMarketingConfig(), campaigns });
    expect(loadMarketingConfig().campaigns[0].createdByUserId).toBe(creator.id);

    updateUser(creator.id, { rank: 'n1_support' });
    expect(loadMarketingConfig().campaigns[0].createdByUserId).toBe(creator.id);

    deactivateUser(creator.id);
    expect(loadMarketingConfig().campaigns[0].createdByUserId).toBe(creator.id);
    expect(lucia.id).toBe(creator.id);
  });

  it('registra la ejecución como Sistema sin reemplazar al creador de la campaña', async () => {
    function nearbyDate(offsetDays) {
      const date = new Date();
      date.setHours(12, 0, 0, 0);
      date.setDate(date.getDate() + offsetDays);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    setActiveConfig(MODULE_CONFIG);
    seedAuth();
    const lucia = listUsers().find((user) => user.usernameKey === 'marketing');
    await signIn('gerente');

    const campaign = makeCampaign({
      stage: 'prospecto',
      startDate: nearbyDate(-1),
      endDate: nearbyDate(1),
      createdByUserId: lucia.id,
    });
    saveEntities([
      {
        id: 'ent-campana',
        entity_id: 'CLI-CAMPANA',
        name: 'Prospecto de campaña',
        code: 'CAM-1',
        targetDate: '1980-05-05',
        estado_comercial: 'prospecto',
      },
    ]);
    saveMarketingConfig({ ...loadMarketingConfig(), campaigns: [campaign] });
    addDocument({ entity_id: 'CLI-CAMPANA' });

    const history = loadDocuments().filter((document) => document.campaignId === campaign.id);
    const storedCampaign = loadMarketingConfig().campaigns[0];
    expect(history).toHaveLength(1);
    expect(JSON.stringify({ history, storedCampaign })).toContain('Sistema');
    expect(storedCampaign.createdByUserId).toBe(lucia.id);
  });
});
