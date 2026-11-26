import { describe, it, expect, beforeEach } from 'vitest';
import { initApp } from '../../src/app.js';
import { addEntity, addDocument, loadEntities, loadDocuments } from '../../src/storage.js';

let app;

function createClient() {
  return addEntity({
    name: 'Cliente Relación',
    code: 'REL-1',
    targetDate: '1980-05-05',
    rut: '11.111.111-1',
    canal_contacto: 'llamada',
    contacto_telefono: '+56912345678',
  });
}

describe('Vínculo entidad-documento y conservación del historial (T016)', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
    app = initApp(document.getElementById('app'));
  });

  it('guarda y recarga el documento con el entity_id correcto', () => {
    const entity = createClient();
    const doc = addDocument({
      entity_id: entity.entity_id,
      status: 'pendiente',
      notes: 'Llamada inicial',
    });

    const storedEntities = JSON.parse(localStorage.getItem('erp_entities'));
    const storedDocuments = JSON.parse(localStorage.getItem('erp_documents'));
    expect(storedEntities).toHaveLength(1);
    expect(storedDocuments).toHaveLength(1);
    expect(storedDocuments[0].id).toBe(doc.id);
    expect(storedDocuments[0].entity_id).toBe(storedEntities[0].entity_id);
    expect(loadEntities()[0].entity_id).toBe(entity.entity_id);
    expect(loadDocuments()[0].entity_id).toBe(doc.entity_id);

    app.navigate('search');
    expect(document.querySelector(`[data-entity-id="${entity.entity_id}"]`)).toBeTruthy();
  });

  it('archiva la entidad y conserva los documentos al intentar borrarla con historial', () => {
    const entity = createClient();
    addDocument({ entity_id: entity.entity_id, notes: 'Primera interacción' });
    addDocument({ entity_id: entity.entity_id, notes: 'Segunda interacción' });
    expect(loadDocuments()).toHaveLength(2);

    app.navigate('search');
    document.querySelector(`[data-action="delete-entity"][data-id="${entity.id}"]`).click();

    expect(loadEntities()).toHaveLength(1);
    expect(loadEntities()[0].archivedAt).toBeTruthy();
    expect(loadDocuments()).toHaveLength(2);
  });
});
