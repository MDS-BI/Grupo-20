import {
  buildFormBaseline,
  collectFormData,
  isFormDirty,
  renderFieldsHtml,
} from './form-fields.js';
import { getLabel } from '../module-config.js';
import { isFieldVisible, resolveFieldRules } from '../utils/field-rules.js';
import {
  LOST_REASON_OPTIONS,
  hasLostReasonRule,
  isLostReasonEligibleEntity,
  lostReasonKey,
  lostReasonStatus,
  requiresLostReason,
  requiresLostReasonOptions,
} from '../utils/lost-reason.js';

const INTERNAL_DOCUMENT_KEYS = new Set([
  'automation_key',
  'automationKey',
  'automation',
  'chat',
  '_internal',
]);

function statusOptions(config, document) {
  const lifecycle = config?.statusLifecycle;
  if (!lifecycle) return null;
  const states = Array.isArray(lifecycle.states) ? lifecycle.states : [];
  const transitions =
    lifecycle.transitions && typeof lifecycle.transitions === 'object' ? lifecycle.transitions : {};
  const options = [];
  const add = (status, force = false) => {
    if (typeof status !== 'string' || !status || options.includes(status)) return;
    if (!force && states.length && !states.includes(status)) return;
    options.push(status);
  };
  for (const [from, targets] of Object.entries(transitions)) {
    add(from);
    if (Array.isArray(targets)) for (const to of targets) add(to);
  }
  if (!options.length) for (const state of states) add(state);
  if (document?.status) add(document.status, true);
  return options;
}

export function getDocumentFieldDefs(config, document = {}, entity = {}) {
  const rules = resolveFieldRules(config, 'document');
  const values = { ...entity, ...document };
  const hasRule = hasLostReasonRule(config);
  const eligible = hasRule && isLostReasonEligibleEntity(entity, config);
  const active = hasRule && requiresLostReason(document, entity, config);
  const reasonKey = lostReasonKey(config);
  const reasonRule = config?.documentRules?.lostReason || {};
  const reasonOptions = requiresLostReasonOptions(config);
  const reasonWhen = active ? undefined : { key: 'status', equals: lostReasonStatus(config) };
  const options = statusOptions(config, document);
  const statusField = options
    ? { key: 'status', label: 'Estado', type: 'datalist', options }
    : { key: 'status', label: 'Estado', type: 'text' };
  const base = [
    { key: 'startDate', label: 'Fecha', type: 'date' },
    { key: 'endDate', label: 'Fecha de término', type: 'date' },
    { key: 'notes', label: 'Notas', type: 'textarea' },
  ];
  const custom = (config?.customFields?.document || [])
    .filter((def) => def?.key && !INTERNAL_DOCUMENT_KEYS.has(def.key))
    .filter((def) =>
      hasRule && def.key === reasonKey ? eligible : isFieldVisible(rules, def.key, values)
    )
    .map((def) => {
      const rule = rules[def.key] || {};
      const defWithRule = {
        ...def,
        label: rule.label || def.label || def.key,
        required: Boolean(rule.required || def.required),
        placeholder: rule.placeholder || def.placeholder,
        when: rule.when ? { ...rule.when } : undefined,
      };
      if (!hasRule || def.key !== reasonKey) return defWithRule;
      return {
        ...defWithRule,
        type: 'select',
        label: def.label || reasonRule.label || 'Motivo de pérdida',
        options: reasonOptions,
        emptyLabel: def.emptyLabel || reasonRule.emptyLabel || '-- Seleccionar --',
        required: active,
        when: reasonWhen,
      };
    });
  if (eligible && !custom.some((def) => def.key === reasonKey)) {
    custom.push({
      key: reasonKey,
      label: reasonRule.label || 'Motivo de pérdida',
      type: 'select',
      options: reasonOptions.length ? reasonOptions : LOST_REASON_OPTIONS,
      emptyLabel: reasonRule.emptyLabel || '-- Seleccionar --',
      required: active,
      when: reasonWhen,
    });
  }
  return [...base, statusField, ...custom];
}

export function renderDocumentFormHtml(config, document = {}, errors = {}, entity = {}) {
  const defs = getDocumentFieldDefs(config, document, entity);
  const label = getLabel(config, 'document');
  return `
    <form id="document-form" novalidate aria-label="Formulario de ${label}">
      ${renderFieldsHtml(defs, document, errors)}
      <div class="form-actions">
        <button type="submit">Guardar</button>
        <button type="button" data-action="cancel-document-form">Cancelar</button>
      </div>
    </form>
  `;
}

function currentDocumentContext(formEl, entity = {}) {
  const statusField = formEl?.elements?.namedItem('status');
  const status = statusField && !statusField.multiple ? statusField.value : '';
  return status ? { ...entity, status } : { ...entity };
}

export function collectDocumentFormData(formEl, config, entity = {}) {
  return collectFormData(
    formEl,
    getDocumentFieldDefs(config, currentDocumentContext(formEl, entity), entity)
  );
}

export function buildDocumentFormBaseline(config, doc = {}, entity = {}) {
  return buildFormBaseline(getDocumentFieldDefs(config, doc, entity), doc);
}

export function isDocumentFormDirty(formEl, config, baseline, entity = {}) {
  return isFormDirty(
    formEl,
    getDocumentFieldDefs(config, currentDocumentContext(formEl, entity), entity),
    baseline
  );
}
