import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { initApp } from '../../src/app.js';
import { MODULE_CONFIG, setActiveConfig } from '../../src/module-config.js';
import { addEntity, loadEntities } from '../../src/storage.js';
import { formatRut } from '../../src/seed.js';

const FAQ_QUESTION = '¿Cómo puedo agendar una reunión?';
const FAQ_ANSWER = 'Un ejecutivo te contactará para coordinar la reunión.';
const CAMPAIGN_NAME = 'Campaña Chat T105';

const CHAT_CONFIG = {
  ...MODULE_CONFIG,
  marketing: {
    ...MODULE_CONFIG.marketing,
    automationRules: [],
    faq: [{ pregunta: FAQ_QUESTION, respuesta: FAQ_ANSWER }],
    campaigns: [
      {
        id: 'camp_chat',
        name: CAMPAIGN_NAME,
        stage: 'prospecto',
        startDate: '2026-11-01',
        endDate: '2026-11-30',
      },
    ],
  },
};

let app;
let sequence = 0;

function mountApp(url = '/') {
  window.history.replaceState({}, '', url);
  document.body.innerHTML = '<div id="app"></div>';
  setActiveConfig(CHAT_CONFIG);
  app = initApp(document.getElementById('app'), { rawConfig: CHAT_CONFIG });
  return app;
}

function submitForm(form) {
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}

function storedDocuments() {
  return JSON.parse(localStorage.getItem('erp_documents') || '[]');
}

function chatDocuments() {
  return storedDocuments().filter((doc) => doc.canal === 'chat');
}

function formNames(form) {
  return [...form.querySelectorAll('[name]')].map((field) => field.name);
}

function fillCaptureForm() {
  document.getElementById('field-name').value = 'Visitante Chat T105';
  document.getElementById('field-rut').value = '11.111.111-1';
  document.getElementById('field-targetDate').value = '1980-05-05';
  const channel = document.getElementById('field-canal_contacto');
  channel.value = 'llamada';
  channel.dispatchEvent(new Event('change', { bubbles: true }));
  document.getElementById('field-contacto_telefono').value = '+56912345678';
  document.getElementById('field-consentimiento').checked = true;
}

function captureProspect() {
  fillCaptureForm();
  submitForm(document.getElementById('capture-form'));
  return loadEntities()[0];
}

function fillChatForm(
  message,
  { consent = true, campaign = CAMPAIGN_NAME, selectOption = '' } = {}
) {
  const form = document.querySelector('#chat-form');
  if (selectOption) form.querySelector('[name="entity_id"]').value = selectOption;
  form.querySelector('[name="mensaje"]').value = message;
  form.querySelector('[name="consentimiento"]').checked = consent;
  const campaignField = form.querySelector('[name="campaña"]');
  if (campaignField) campaignField.value = campaign;
  submitForm(form);
}

function openMarketingChat() {
  document.querySelector('[data-action="navigate"][data-view="marketing"]').click();
  document.querySelector('[data-action="marketing-section"][data-section="chat"]').click();
  expect(
    document
      .querySelector('[data-action="marketing-section"][data-section="chat"]')
      .getAttribute('aria-selected')
  ).toBe('true');
}

function seedEntity(consentimiento = true) {
  sequence += 1;
  return addEntity({
    name: `Cliente Chat ${sequence}`,
    code: `CHAT-${sequence}`,
    targetDate: '1980-05-05',
    rut: formatRut(`1111111${sequence}`),
    canal_contacto: 'correo',
    contacto_correo: `chat${sequence}@ejemplo.cl`,
    consentimiento,
  });
}

function openEntityDetail(entityId) {
  app.navigate('search');
  document.querySelector(`[data-action="view-entity"][data-entity-id="${entityId}"]`).click();
  expect(document.querySelector('#entity-detail').dataset.entityId).toBe(entityId);
  return document.querySelector('#entity-history');
}

afterEach(() => {
  app?.destroy();
  app = undefined;
  window.history.replaceState({}, '', '/');
  setActiveConfig(MODULE_CONFIG);
});

describe('Chat en la captura pública ?view=capture (T105)', () => {
  beforeEach(() => mountApp('/?view=capture'));

  it('muestra el chat sin entidad y bloquea el primer mensaje sin consentimiento', () => {
    const form = document.querySelector('#chat-form');
    expect(form).toBeTruthy();
    expect(document.querySelector('.chat-faq').textContent).toContain(FAQ_QUESTION);
    expect(form.elements.namedItem('entity_id')).toBeNull();

    fillChatForm(FAQ_QUESTION, { consent: false });

    expect(document.querySelector('.chat-response').textContent).toContain(
      'Completa los campos obligatorios.'
    );
    expect(chatDocuments()).toEqual([]);
  });

  it('oculta el entity_id tras capturar y responde desde marketing.faq', () => {
    const prospect = captureProspect();
    const form = document.querySelector('#chat-form');
    const entityField = form.elements.namedItem('entity_id');
    expect(entityField.type).toBe('hidden');
    expect(entityField.value).toBe(prospect.entity_id);
    expect(formNames(form)).toEqual(['entity_id', 'mensaje', 'consentimiento']);

    fillChatForm(FAQ_QUESTION);

    const response = document.querySelector('.chat-response');
    expect(response.getAttribute('role')).toBe('status');
    expect(response.textContent).toBe(FAQ_ANSWER);
    expect(chatDocuments()).toHaveLength(1);
    expect(chatDocuments()[0]).toMatchObject({
      entity_id: prospect.entity_id,
      canal: 'chat',
      mensaje: FAQ_QUESTION,
      notes: FAQ_QUESTION,
      tipo_interaccion: 'consulta',
      status: 'respondida',
      respuesta: FAQ_ANSWER,
    });
    expect(chatDocuments()[0].campaña).toBeUndefined();
    expect(document.querySelector('.chat-messages').textContent).toContain(FAQ_QUESTION);
    expect(document.querySelector('.chat-messages').textContent).toContain(FAQ_ANSWER);
  });

  it('muestra el acuse y guarda la consulta sin coincidencia para seguimiento en la ficha', () => {
    const prospect = captureProspect();
    const message = 'Necesito una cotización personalizada';

    fillChatForm(message);

    expect(document.querySelector('.chat-response').textContent).toContain(
      'Consulta registrada; un ejecutivo hará seguimiento.'
    );
    const [doc] = chatDocuments();
    expect(doc).toMatchObject({
      entity_id: prospect.entity_id,
      canal: 'chat',
      mensaje: message,
      tipo_interaccion: 'consulta',
      status: 'pendiente',
    });
    expect(doc.respuesta).toBeUndefined();
    expect(doc.campaña).toBeUndefined();

    const history = openEntityDetail(prospect.entity_id);
    expect(history.textContent).toContain(message);
    expect(history.textContent).toContain('Canal: chat');
  });

  it('comparte los mismos mensajes al abrir Marketing desde la captura', () => {
    captureProspect();
    const message = '¿Dónde veo la respuesta?';

    fillChatForm(message);
    app.navigate('marketing');
    openMarketingChat();

    expect(document.querySelector('.marketing-chat .chat-message').textContent).toContain(message);
    expect(chatDocuments()).toHaveLength(1);
  });
});

describe('Chat en Marketing (T105)', () => {
  let entity;

  beforeEach(() => {
    mountApp('/');
    entity = seedEntity();
    openMarketingChat();
  });

  it('selecciona la entidad y bloquea el envío sin consentimiento explícito', () => {
    const withoutConsent = seedEntity(false);
    document.querySelector('[data-action="marketing-section"][data-section="chat"]').click();
    const form = document.querySelector('#chat-form');
    expect(formNames(form)).toEqual(['entity_id', 'mensaje', 'campaña', 'consentimiento']);
    expect(
      [...form.querySelectorAll('[name="entity_id"] option')].map((option) => option.value)
    ).toContain(withoutConsent.entity_id);

    fillChatForm('Consulta sin consentimiento', {
      consent: false,
      selectOption: withoutConsent.entity_id,
    });

    expect(document.querySelector('.chat-response').textContent).toContain(
      'Completa los campos obligatorios.'
    );
    expect(chatDocuments()).toEqual([]);
  });

  it('responde desde la FAQ configurada y deja el mensaje visible en la ficha', () => {
    fillChatForm(FAQ_QUESTION, { selectOption: entity.entity_id });

    expect(document.querySelector('.chat-response').textContent).toBe(FAQ_ANSWER);
    const [doc] = chatDocuments();
    expect(doc).toMatchObject({
      entity_id: entity.entity_id,
      canal: 'chat',
      mensaje: FAQ_QUESTION,
      campaña: CAMPAIGN_NAME,
      status: 'respondida',
      respuesta: FAQ_ANSWER,
    });

    const history = openEntityDetail(entity.entity_id);
    expect(history.textContent).toContain(FAQ_QUESTION);
    expect(history.textContent).toContain(FAQ_ANSWER);
    expect(history.textContent).toContain('Canal: chat');
  });
});
