import { describe, expect, it } from 'vitest';
import { renderDocumentListHtml } from '../../src/components/document-list.js';
import { LOST_REASON_OPTIONS } from '../../src/utils/lost-reason.js';
import { addDocument, addEntity, loadDocuments } from '../../src/storage.js';
import { setActiveConfig } from '../../src/module-config.js';

const CONFIG = {
  documentRules: {
    lostReason: {
      status: 'cerrado perdido',
      entityStateField: 'estado_comercial',
      entityState: 'prospecto',
      customField: 'motivo_perdida',
      options: LOST_REASON_OPTIONS,
    },
  },
  customFields: {
    document: [
      { key: 'motivo_perdida', label: 'Motivo de pérdida', type: 'text' },
      { key: 'automation_key', label: 'Clave', type: 'text' },
    ],
  },
  fieldRules: { document: { automation_key: { hidden: true } } },
};

describe('Relación entidad-documento (US1/US11b)', () => {
  it('asocia el documento al cliente y conserva el motivo en el historial', () => {
    setActiveConfig(CONFIG);
    const entity = addEntity({ name: 'Prospecto', code: 'ED-1', estado_comercial: 'prospecto' });
    const document = addDocument({
      entity_id: entity.entity_id,
      status: 'cerrado perdido',
      motivo_perdida: 'Sin presupuesto',
      automation_key: 'interna',
    });

    expect(loadDocuments()[0].entity_id).toBe(entity.entity_id);
    expect(document.motivo_perdida).toBe('Sin presupuesto');
    const html = renderDocumentListHtml([document], CONFIG);
    expect(html).toContain('data-document-id');
    expect(html).toContain('Sin presupuesto');
    expect(html).not.toContain('Clave');
  });
});
