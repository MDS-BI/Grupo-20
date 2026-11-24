import { escapeHtml } from '../utils/sanitize.js';
import { getEntityFieldDefs } from './entity-form.js';
import { collectFormData, renderFieldHtml } from './form-fields.js';
import { MESSAGES } from '../utils/messages.js';

function consentField(config) {
  const version = config?.marketing?.privacyNoticeVersion || 'sin versión';
  return {
    key: 'consentimiento',
    type: 'boolean',
    label: `Acepto el aviso de privacidad (v${version})`,
    required: true,
  };
}

export function getCaptureFieldDefs(config, values = {}) {
  const allowed = new Set(config?.marketing?.captureFields || []);
  const campaigns = config?.marketing?.campaigns || [];
  const fields = getEntityFieldDefs(config, values).filter((def) => allowed.has(def.key));
  const campaignDef = (config?.customFields?.entity || []).find((def) => def.key === 'campaña');
  const campaignField = campaignDef
    ? {
        ...campaignDef,
        type: 'select',
        options: campaigns.map((campaign) => ({ value: campaign.id, label: campaign.name })),
      }
    : null;
  return [...fields, ...(campaignField ? [campaignField] : []), consentField(config)];
}

export function renderCaptureFormHtml(config, values = {}, errors = {}, submitted = false) {
  const defs = getCaptureFieldDefs(config, values);
  return `
    <section class="capture-view">
      <h1>Captura de prospectos</h1>
      <p class="capture-intro">Completa tus datos para que podamos contactarte. El formulario es embebible y solo requiere tu consentimiento explícito.</p>
      ${
        submitted
          ? `<p id="capture-confirmation" class="capture-confirmation" role="status">${MESSAGES.prospectRegistered}</p>`
          : ''
      }
      <form id="capture-form" novalidate aria-label="Formulario público de captura">
        ${defs.map((def) => renderFieldHtml(def, values[def.key], errors[def.key])).join('\n')}
        <div class="form-actions">
          <button type="submit">Enviar datos</button>
        </div>
      </form>
      <p class="capture-footer">Aviso de privacidad v${escapeHtml(config?.marketing?.privacyNoticeVersion || 'sin versión')}.</p>
    </section>
  `;
}

export function collectCaptureFormData(formEl, config, values = {}) {
  return collectFormData(formEl, getCaptureFieldDefs(config, values));
}
