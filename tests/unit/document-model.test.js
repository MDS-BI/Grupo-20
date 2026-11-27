import { describe, expect, it } from 'vitest';
import {
  buildDocumentFormBaseline,
  getDocumentFieldDefs,
  renderDocumentFormHtml,
} from '../../src/components/document-form.js';
import { renderDocumentListHtml } from '../../src/components/document-list.js';
import { LOST_REASON_OPTIONS } from '../../src/utils/lost-reason.js';

const CONFIG = {
  labels: { entity: 'Cliente', document: 'Interacción', documentPlural: 'Interacciones' },
  customFields: {
    document: [
      { key: 'importe', label: 'Importe (USD)', type: 'number' },
      { key: 'automation_key', label: 'Clave de automatización', type: 'text' },
      { key: 'motivo_perdida', label: 'Motivo de pérdida', type: 'text' },
    ],
  },
  documentRules: {
    lostReason: {
      status: 'cerrado perdido',
      entityStateField: 'estado_comercial',
      entityState: 'prospecto',
      customField: 'motivo_perdida',
      options: LOST_REASON_OPTIONS,
    },
  },
  fieldRules: { document: { automation_key: { hidden: true } } },
  statusLifecycle: {
    states: ['pendiente', 'cerrado ganado', 'cerrado perdido'],
    transitions: { pendiente: ['cerrado ganado', 'cerrado perdido'] },
  },
};

describe('Modelo de documento (US11b)', () => {
  it('oculta campos internos y restringe los estados declarados', () => {
    const defs = getDocumentFieldDefs(CONFIG, {}, {});
    expect(defs.some((def) => def.key === 'automation_key')).toBe(false);
    expect(defs.find((def) => def.key === 'status').options).toEqual([
      'pendiente',
      'cerrado ganado',
      'cerrado perdido',
    ]);
    expect(buildDocumentFormBaseline(CONFIG, { automation_key: 'secreto' }, {})).not.toHaveProperty(
      'automation_key'
    );
  });

  it('muestra el motivo perdido solo para prospectos y lo lista en el historial', () => {
    const prospecto = { estado_comercial: 'prospecto' };
    const perdido = { status: 'cerrado perdido', motivo_perdida: 'Precio alto' };
    const html = renderDocumentFormHtml(CONFIG, perdido, {}, prospecto);
    const defs = getDocumentFieldDefs(CONFIG, perdido, prospecto);
    expect(html).toContain('field-motivo_perdida');
    expect(defs.find((def) => def.key === 'motivo_perdida').options).toEqual(LOST_REASON_OPTIONS);
    expect(
      getDocumentFieldDefs(CONFIG, perdido, { estado_comercial: 'ganado' }).some(
        (def) => def.key === 'motivo_perdida'
      )
    ).toBe(false);

    const listHtml = renderDocumentListHtml([{ ...perdido, id: 'doc-1' }], CONFIG);
    expect(listHtml).toContain('Precio alto');
    expect(listHtml).not.toContain('Clave de automatización');
  });
});
