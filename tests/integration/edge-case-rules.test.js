import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { deactivateUser, listUsers, updateUser } from '../../src/auth.js';
import { initApp } from '../../src/app.js';
import {
  DEFAULT_CONFIG,
  MODULE_CONFIG,
  loadModuleConfig,
  setActiveConfig,
  validateConfig,
} from '../../src/module-config.js';
import {
  ValidationError,
  addDocument,
  addEntity,
  computeSummary,
  EntityHasRecordsError,
  archiveEntity,
  deleteEntity,
  loadDocuments,
  loadEntities,
  updateEntity,
} from '../../src/storage.js';
import { formatRut } from '../../src/utils/field-formats.js';
import { MESSAGES } from '../../src/utils/messages.js';
import { computeMarketingPerformance } from '../../src/utils/marketing-performance.js';
import { signIn } from '../helpers/auth-session.js';

let app = null;
let sequence = 0;

function validClient(overrides = {}) {
  sequence += 1;
  return {
    name: `Cliente borde ${sequence}`,
    targetDate: '1990-01-01',
    rut: formatRut(7000000 + sequence),
    canal_contacto: 'llamada',
    contacto_telefono: '+56912345678',
    ...overrides,
  };
}

function mount() {
  app = initApp({ mountElement: document.body, rawConfig: MODULE_CONFIG, enableAuth: true });
  return app;
}

beforeEach(async () => {
  await signIn('gerente');
  setActiveConfig(MODULE_CONFIG);
});

afterEach(() => {
  app?.destroy();
  app = null;
  vi.restoreAllMocks();
  setActiveConfig(DEFAULT_CONFIG);
  localStorage.clear();
});

describe('Búsqueda y registros inexistentes', () => {
  it('muestra el mensaje exacto cuando no hay coincidencias', () => {
    mount();
    app.navigate('search');
    const input = document.querySelector('#search-input');
    input.value = 'NO-EXISTE-999';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    expect(document.querySelector('#search-results .empty-state').textContent).toBe(
      MESSAGES.noResults
    );
  });

  it('editar o eliminar una entidad inexistente no muta el almacenamiento', () => {
    const before = loadEntities();

    expect(() => updateEntity('entidad-inexistente', { name: 'Cambio' })).toThrow(ValidationError);
    expect(deleteEntity('entidad-inexistente')).toEqual({ deletedDocumentCount: 0 });
    expect(loadEntities()).toEqual(before);
  });
});

describe('Fechas y relaciones', () => {
  it('rechaza fechas de calendario inválidas', () => {
    expect(() =>
      addEntity(validClient({ targetDate: '2026-02-30' }), {
        customFieldDefs: MODULE_CONFIG.customFields.entity,
      })
    ).toThrow(ValidationError);
  });

  it('rechaza endDate menor que startDate con defs y ciclo de vida del perfil', () => {
    const entity = addEntity(validClient(), {
      customFieldDefs: MODULE_CONFIG.customFields.entity,
    });

    expect(() =>
      addDocument(
        { entity_id: entity.entity_id, startDate: '2026-03-10', endDate: '2026-03-01' },
        {
          customFieldDefs: MODULE_CONFIG.customFields.document,
          statusLifecycle: MODULE_CONFIG.statusLifecycle,
        }
      )
    ).toThrow(ValidationError);
  });

  it('impide eliminar con documentos asociados y permite archivar conservándolos', () => {
    const entity = addEntity(validClient(), {
      customFieldDefs: MODULE_CONFIG.customFields.entity,
    });
    addDocument({ entity_id: entity.entity_id, notes: 'Primera' });
    addDocument({ entity_id: entity.entity_id, notes: 'Segunda' });

    expect(() => deleteEntity(entity.id)).toThrow(EntityHasRecordsError);
    expect(archiveEntity(entity.id).archivedAt).toBeTruthy();
    expect(loadDocuments().filter((doc) => doc.entity_id === entity.entity_id)).toHaveLength(2);
  });

  it('conserva valores históricos aunque las defs pasadas no los declaren', () => {
    const entity = addEntity(validClient({ rubro: 'Dependiente', campaña: 'campaña-eliminada' }), {
      customFieldDefs: MODULE_CONFIG.customFields.entity,
    });

    const updated = updateEntity(entity.id, { name: 'Cliente histórico' }, { customFieldDefs: [] });

    expect(updated.name).toBe('Cliente histórico');
    expect(updated.rubro).toBe('Dependiente');
    expect(updated.campaña).toBe('campaña-eliminada');
  });
});

describe('Configuración y valores atípicos', () => {
  it('retrocede a la configuración base ante un nombre vacío', () => {
    const { config, warning } = loadModuleConfig({ moduleName: '' });

    expect(config).toEqual(DEFAULT_CONFIG);
    expect(warning).toBeTruthy();
  });

  it('detecta colisión de clave, tipo desconocido y transición inválida', () => {
    expect(
      validateConfig({
        customFields: { entity: [{ key: 'name', type: 'text' }], document: [] },
      }).join(' ')
    ).toContain('name');
    expect(
      validateConfig({ customFields: { entity: [{ key: 'x', type: 'magico' }] } }).length
    ).toBeGreaterThan(0);
    expect(
      validateConfig({ statusLifecycle: { states: ['a'], transitions: { a: ['b'] } } }).length
    ).toBeGreaterThan(0);
  });

  it('guarda valores huérfanos sin mostrarlos en la ficha', () => {
    const entity = addEntity(validClient({ campaña: 'campaña-eliminada' }), {
      customFieldDefs: MODULE_CONFIG.customFields.entity,
    });
    expect(loadEntities().find((item) => item.id === entity.id).campaña).toBe('campaña-eliminada');

    mount();
    app.navigate('search');
    document
      .querySelector(`[data-action="view-entity"][data-entity-id="${entity.entity_id}"]`)
      .dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(document.querySelector('#view-root').textContent).not.toContain('campaña-eliminada');
  });

  it('no cuenta valores huérfanos como campaña «Sin campaña»', () => {
    const result = computeMarketingPerformance({
      entities: [{ entity_id: 'ent-1', campaña: 'campaña-eliminada' }],
      documents: [],
    });
    const none = result.byCampaign.find((group) => group.id === 'none');

    expect(result.totalProspects).toBe(1);
    expect(none.hasData).toBe(false);
  });

  it('mantiene estados cero sin datos', () => {
    const performance = computeMarketingPerformance();
    const summary = computeSummary({ entities: [], documents: [] });

    expect(performance.hasData).toBe(false);
    expect(performance.totalProspects).toBe(0);
    expect(summary.totalEntities).toBe(0);
    expect(summary.totalPending).toBe(0);
  });

  it('acepta un color de acento inválido sin descartar el resto del perfil', () => {
    const { config, warning } = loadModuleConfig({
      moduleName: 'Ventas',
      theme: { accentColor: 'not-a-color' },
    });

    expect(warning).toBeNull();
    expect(config.moduleName).toBe('Ventas');
    expect(config.theme.accentColor).toBeNull();
  });

  it('define una barra lateral compacta en pantallas estrechas', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/styles.css'), 'utf8');

    expect(css).toContain('@media (max-width: 640px)');
    expect(css).toContain('grid-template-columns: 64px 1fr');
    expect(css).toContain('.sidebar-label');
  });
});

describe('Interfaz y sesión', () => {
  it('avisa de cambios sin guardar y permite descartarlos solo al confirmar', () => {
    mount();
    app.navigate('manage-entity');
    document.querySelector('#entity-form [name="name"]').value = 'Borrador sin guardar';

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    expect(app.navigate('search')).toBe(false);
    expect(app.getState().view).toBe('manage');
    expect(document.querySelector('#entity-form [name="name"]').value).toBe('Borrador sin guardar');

    confirmSpy.mockReturnValue(true);
    expect(app.navigate('search')).toBe(true);
    expect(app.getState().view).toBe('search');
  });

  it('muestra que una ficha no tiene documentos asociados', () => {
    const entity = addEntity(validClient(), {
      customFieldDefs: MODULE_CONFIG.customFields.entity,
    });

    mount();
    app.navigate('search');
    document
      .querySelector(`[data-action="view-entity"][data-entity-id="${entity.entity_id}"]`)
      .dispatchEvent(new MouseEvent('click', { bubbles: true }));

    const empty = document.querySelector('#entity-history-empty');
    expect(empty.hidden).toBe(false);
    expect(empty.textContent).toBe('Este registro no tiene documentos asociados.');
  });

  it('mantiene el orden de pendientes empatados por entidad', () => {
    const first = addEntity(validClient(), {
      customFieldDefs: MODULE_CONFIG.customFields.entity,
    });
    const second = addEntity(validClient(), {
      customFieldDefs: MODULE_CONFIG.customFields.entity,
    });
    addDocument({ entity_id: first.entity_id, status: 'pendiente' });
    addDocument({ entity_id: second.entity_id, status: 'pendiente' });

    const summary = computeSummary({
      entities: loadEntities(),
      documents: loadDocuments(),
      statusLifecycle: MODULE_CONFIG.statusLifecycle,
    });

    expect(summary.pendingByEntity.map((row) => row.entityId)).toEqual([
      first.entity_id,
      second.entity_id,
    ]);
    expect(summary.pendingByEntity.map((row) => row.count)).toEqual([1, 1]);
  });

  it('revoca de inmediato la sesión de un usuario desactivado (FR-099)', async () => {
    await signIn('ventas');
    mount();
    expect(document.querySelector('#current-user').textContent).toBe('ventas');

    const pedro = listUsers().find((user) => user.username === 'ventas');
    deactivateUser(pedro.id);
    app.navigate('summary');

    expect(app.getState().view).toBe('login');
    expect(app.getState().currentUser).toBeNull();
  });

  it('aplica un cambio de rango en la siguiente acción (FR-099)', async () => {
    await signIn('ventas');
    mount();
    expect(app.getState().role).toBe('n2_sales');

    const ventas = listUsers().find((user) => user.username === 'ventas');
    updateUser(ventas.id, { rank: 'n3_marketing' });
    app.navigate('marketing');

    expect(app.getState().role).toBe('n3_marketing');
    expect(app.getState().view).toBe('marketing');
    expect(document.querySelector('#current-rank').textContent).toContain('Marketing');
  });
});
