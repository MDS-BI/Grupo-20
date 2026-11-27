import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { addEntity, loadDocuments, ValidationError } from '../../src/storage.js';
import { setActiveConfig, DEFAULT_CONFIG } from '../../src/module-config.js';
import { localTodayISO } from '../../src/utils/entity-date.js';
import { registerSocialInteraction } from '../../src/utils/marketing-social.js';

const documentFields = [
  { key: 'plataforma', type: 'text', label: 'Plataforma' },
  { key: 'tipo_interaccion', type: 'text', label: 'Tipo de interacción' },
  { key: 'nota', type: 'text', label: 'Nota' },
  { key: 'enlace', type: 'text', label: 'Enlace' },
  { key: 'campaña', type: 'text', label: 'Campaña' },
  { key: 'canal', type: 'text', label: 'Canal' },
];

const statusLifecycle = {
  states: ['pendiente', 'en_progreso', 'completado'],
  transitions: {},
};

const consentFields = [
  { key: 'consentimiento', type: 'boolean', label: 'Consentimiento' },
  { key: 'consentimiento_fecha', type: 'text', label: 'Fecha de consentimiento' },
  { key: 'consentimiento_version', type: 'text', label: 'Versión del consentimiento' },
];

const config = {
  customFields: {
    entity: consentFields,
    document: [...documentFields, ...consentFields],
  },
  statusLifecycle,
};

let sequence = 0;

function createEntity() {
  sequence += 1;
  return addEntity({
    name: `Cliente ${sequence}`,
    code: `SOC-${sequence}`,
    consentimiento: true,
    consentimiento_fecha: '2026-11-20T12:00:00.000Z',
    consentimiento_version: 'v1',
  });
}

beforeEach(() => {
  setActiveConfig(config);
});

afterEach(() => {
  setActiveConfig(DEFAULT_CONFIG);
});

describe('Registro de interacciones en redes (T099/T101)', () => {
  it('crea un Documento con todos los campos declarados', () => {
    const entity = createEntity();
    const documento = registerSocialInteraction(
      {
        plataforma: 'Instagram',
        startDate: '2026-11-20',
        tipo_interaccion: 'comentario',
        nota: 'Me gustó la publicación',
        enlace: 'https://instagram.com/p/ejemplo',
        campaña: 'Lanzamiento',
      },
      entity,
      config
    );

    expect(documento.id).toBeTruthy();
    expect(documento).toMatchObject({
      entity_id: entity.entity_id,
      plataforma: 'Instagram',
      startDate: '2026-11-20',
      tipo_interaccion: 'comentario',
      nota: 'Me gustó la publicación',
      enlace: 'https://instagram.com/p/ejemplo',
      campaña: 'Lanzamiento',
      canal: 'redes',
      status: 'pendiente',
    });
    expect(loadDocuments()).toEqual([documento]);
  });

  it('omite la campaña cuando no se proporciona', () => {
    const documento = registerSocialInteraction(
      {
        plataforma: 'YouTube',
        tipo_interaccion: 'video',
        nota: 'Video visto',
        enlace: 'https://youtu.be/ejemplo',
      },
      createEntity(),
      config
    );

    expect(documento.campaña).toBeUndefined();
    expect(documento.canal).toBe('redes');
    expect(documento.status).toBe('pendiente');
  });

  it('usa la fecha local ISO de hoy por defecto', () => {
    const documento = registerSocialInteraction(
      {
        plataforma: 'Twitter',
        tipo_interaccion: 'me_gusta',
        nota: 'Publicación destacada',
        enlace: '',
      },
      createEntity(),
      config
    );

    expect(documento.startDate).toBe(localTodayISO());
  });

  it('rechaza el registro sin consentimiento previo de la entidad', () => {
    const entity = { entity_id: 'ent-sin-consentimiento', name: 'Sin consentimiento' };
    expect(() => registerSocialInteraction({ plataforma: 'Instagram' }, entity, config)).toThrow(
      ValidationError
    );
    expect(loadDocuments()).toHaveLength(0);
  });

  it('reutiliza la fecha y versión del consentimiento de la entidad', () => {
    const entity = createEntity();
    const documento = registerSocialInteraction(
      { plataforma: 'Instagram', tipo_interaccion: 'comentario' },
      entity,
      config
    );
    expect(documento).toMatchObject({
      consentimiento: true,
      consentimiento_fecha: entity.consentimiento_fecha,
      consentimiento_version: entity.consentimiento_version,
    });
  });

  it('rechaza el registro sin una entidad asociada', () => {
    expect(() => registerSocialInteraction({ plataforma: 'Instagram' }, null, config)).toThrow(
      ValidationError
    );
    expect(() => registerSocialInteraction({ plataforma: 'Instagram' }, {}, config)).toThrow(
      ValidationError
    );
    try {
      registerSocialInteraction({ plataforma: 'Instagram' }, null, config);
    } catch (error) {
      expect(error.errors.entity_id).toBeTruthy();
    }
    expect(loadDocuments()).toHaveLength(0);
  });

  it('rechaza un enlace inválido solo cuando storage lo valida', () => {
    const values = {
      plataforma: 'Instagram',
      tipo_interaccion: 'comentario',
      nota: 'Comentario',
      enlace: 'no-es-un-enlace',
    };

    const accepted = registerSocialInteraction(values, createEntity(), config);
    expect(accepted.enlace).toBe('no-es-un-enlace');

    const validatingConfig = {
      ...config,
      customFields: {
        document: documentFields.map((field) =>
          field.key === 'enlace' ? { ...field, type: 'number', label: 'Enlace' } : field
        ),
      },
    };

    expect(() => registerSocialInteraction(values, createEntity(), validatingConfig)).toThrow(
      ValidationError
    );
    try {
      registerSocialInteraction(values, createEntity(), validatingConfig);
    } catch (error) {
      expect(error.errors.enlace).toBe('Enlace debe ser un número.');
    }
  });
});
