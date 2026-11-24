import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/storage.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    addDocument: vi.fn((...args) => actual.addDocument(...args)),
  };
});

import { addDocument, addEntity, loadDocuments, ValidationError } from '../../src/storage.js';
import { DEFAULT_CONFIG, setActiveConfig } from '../../src/module-config.js';
import { localTodayISO } from '../../src/utils/entity-date.js';
import {
  answerFaq,
  ChatConsentError,
  markChatAnswered,
  registerChatMessage,
} from '../../src/utils/marketing-chat.js';

const documentFields = [
  { key: 'canal', type: 'text', label: 'Canal' },
  { key: 'mensaje', type: 'text', label: 'Mensaje' },
  { key: 'tipo_interaccion', type: 'text', label: 'Tipo de interacción' },
  { key: 'campaña', type: 'text', label: 'Campaña' },
  { key: 'respondida', type: 'boolean', label: 'Respondida' },
  { key: 'respuesta', type: 'text', label: 'Respuesta' },
];

const statusLifecycle = {
  states: ['pendiente', 'respondida'],
  transitions: { pendiente: ['respondida'] },
};

const config = {
  customFields: {
    entity: [{ key: 'consentimiento', type: 'boolean', label: 'Consentimiento' }],
    document: documentFields,
  },
  statusLifecycle,
  marketing: {
    privacyNoticeVersion: '2026-11-23',
    faq: [
      { pregunta: 'cómo capturo prospectos', respuesta: 'Use el formulario público con consentimiento.' },
      { pregunta: 'cómo capturo prospectos con consentimiento', respuesta: 'Marque la casilla de privacidad.' },
    ],
  },
};

let sequence = 0;

function createEntity(consentimiento = true) {
  sequence += 1;
  return addEntity({ name: `Visitante ${sequence}`, code: `CHAT-${sequence}`, consentimiento });
}

beforeEach(() => {
  setActiveConfig(config);
  vi.mocked(addDocument).mockClear();
});

afterEach(() => {
  setActiveConfig(DEFAULT_CONFIG);
});

describe('answerFaq (T104)', () => {
  it('devuelve la respuesta con coincidencia exacta normalizada', () => {
    expect(answerFaq('CÓMO CAPTURO PROSPECTOS', config)).toBe(
      'Use el formulario público con consentimiento.',
    );
  });

  it('resuelve inclusiones priorizando la pregunta más larga', () => {
    expect(answerFaq('Necesito saber cómo capturo prospectos con consentimiento hoy', config)).toBe(
      'Marque la casilla de privacidad.',
    );
  });

  it('devuelve null sin marketing, sin FAQ o sin coincidencia', () => {
    expect(answerFaq('cómo capturo prospectos', {})).toBeNull();
    expect(answerFaq('cómo capturo prospectos', { marketing: {} })).toBeNull();
    expect(answerFaq('pregunta desconocida', config)).toBeNull();
    expect(answerFaq('', config)).toBeNull();
  });
});

describe('registerChatMessage (T104/T106)', () => {
  it('crea un Documento con consentimiento de la entidad y campaña opcional', () => {
    const entity = createEntity();
    const documento = registerChatMessage(
      { mensaje: 'Hola, tengo una consulta', startDate: '2026-11-20', campaña: 'Lanzamiento' },
      entity,
      config,
    );

    expect(documento).toMatchObject({
      entity_id: entity.entity_id,
      canal: 'chat',
      mensaje: 'Hola, tengo una consulta',
      tipo_interaccion: 'consulta',
      notes: 'Hola, tengo una consulta',
      startDate: '2026-11-20',
      campaña: 'Lanzamiento',
      status: 'pendiente',
      respondida: false,
    });
    expect(addDocument).toHaveBeenCalledTimes(1);
    expect(loadDocuments()).toEqual([documento]);
  });

  it('crea un Documento con consentimiento del mensaje y omite la campaña', () => {
    const documento = registerChatMessage(
      { consentimiento: true, mensaje: 'Tengo una duda' },
      createEntity(false),
      config,
    );

    expect(documento.mensaje).toBe('Tengo una duda');
    expect(documento.canal).toBe('chat');
    expect(documento.tipo_interaccion).toBe('consulta');
    expect(documento.respondida).toBe(false);
    expect(documento.startDate).toBe(localTodayISO());
    expect(documento.campaña).toBeUndefined();
  });

  it('bloquea el registro sin consentimiento y no guarda documento', () => {
    expect(() =>
      registerChatMessage({ consentimiento: 'true', mensaje: 'Hola' }, createEntity(false), config),
    ).toThrow(ChatConsentError);

    try {
      registerChatMessage({ mensaje: 'Hola' }, createEntity(false), config);
    } catch (error) {
      expect(error.errors.consentimiento).toBeTruthy();
    }

    expect(addDocument).not.toHaveBeenCalled();
    expect(loadDocuments()).toEqual([]);
  });

  it('rechaza la ausencia de entidad o de mensaje con errores', () => {
    expect(() => registerChatMessage({ consentimiento: true, mensaje: 'Hola' }, null, config)).toThrow(
      ValidationError,
    );
    try {
      registerChatMessage({ consentimiento: true, mensaje: 'Hola' }, null, config);
    } catch (error) {
      expect(error.errors.entity_id).toBeTruthy();
    }

    const entity = createEntity();
    expect(() => registerChatMessage({ mensaje: '   ' }, entity, config)).toThrow(ValidationError);
    try {
      registerChatMessage({ mensaje: '   ' }, entity, config);
    } catch (error) {
      expect(error.errors.mensaje).toBeTruthy();
    }

    expect(loadDocuments()).toEqual([]);
  });

  it('marca la consulta como respondida y persiste solo la respuesta', () => {
    const documento = registerChatMessage({ mensaje: '¿Cuánto cuesta?' }, createEntity(), config);
    const respondedido = markChatAnswered(documento.id, {
      respuesta: 'El primer mes sin costo.',
      otro: 'no debe persistirse',
    });

    expect(respondedido).toMatchObject({
      id: documento.id,
      respondida: true,
      status: 'respondida',
      respuesta: 'El primer mes sin costo.',
    });
    expect(respondedido.otro).toBeUndefined();
    expect(loadDocuments()).toEqual([respondedido]);
  });
});
